import { readdirSync, readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { ytDlpPath, ffmpegPath, run } from "./bin";
import { config } from "./config";
import { ensureDir } from "./paths";
import type { Platform, SourceMeta } from "@/types/analysis";

export function detectPlatform(url: string): Platform {
  const u = url.toLowerCase();
  if (u.includes("tiktok.")) return "tiktok";
  if (u.includes("instagram.")) return "instagram";
  if (u.includes("facebook.") || u.includes("fb.watch") || u.includes("fb.com")) return "facebook";
  if (u.includes("youtube.") || u.includes("youtu.be")) return "youtube";
  return "autre";
}

export function isSupportedUrl(url: string): boolean {
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function extractHashtags(...texts: (string | undefined)[]): string[] {
  const found = new Set<string>();
  for (const text of texts) {
    if (!text) continue;
    for (const m of text.matchAll(/#([\p{L}\p{N}_]+)/gu)) found.add(m[1]);
  }
  return [...found];
}

function formatDate(raw?: string): string | undefined {
  // yt-dlp renvoie AAAAMMJJ
  if (!raw || !/^\d{8}$/.test(raw)) return raw;
  return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
}

/** Traduit les erreurs yt-dlp les plus frequentes en message actionnable. */
function humanizeYtDlpError(stderr: string, platform: Platform): string {
  const s = stderr.toLowerCase();

  const conseilCookies =
    "Ajoute YTDLP_COOKIES_FROM_BROWSER=chrome (ou firefox/edge) dans .env.local, " +
    "connecte-toi a la plateforme dans ce navigateur, ferme-le completement, puis relance l'analyse.";

  if (
    s.includes("login required") ||
    s.includes("requested content is not available") ||
    s.includes("rate-limit")
  ) {
    return `${platform} demande une session connectee pour cette video. ${conseilCookies}`;
  }
  // Reponse inattendue = protection anti-bot de la plateforme, pas un lien casse.
  if (s.includes("unexpected response") || s.includes("unable to extract") || s.includes("captcha")) {
    return (
      `${platform} a refuse la requete (protection anti-robot) ou la video n'existe pas. ` +
      `Verifie d'abord que le lien s'ouvre en navigation privee. S'il fonctionne : ${conseilCookies}`
    );
  }
  if (s.includes("private") || s.includes("this video is unavailable")) {
    return "Video privee, supprimee ou reservee a certains pays. Verifie que le lien s'ouvre en navigation privee.";
  }
  if (s.includes("unsupported url")) {
    return "Lien non reconnu. Colle l'URL complete du post (pas un lien de profil ou de recherche).";
  }
  if (s.includes("http error 404")) {
    return "Video introuvable (404). Le post a peut-etre ete supprime.";
  }
  const tail = stderr.trim().split(/\r?\n/).filter(Boolean).slice(-3).join(" | ");
  return `Telechargement impossible. Detail yt-dlp : ${tail || "erreur inconnue"}`;
}

export interface DownloadResult {
  videoPath: string;
  meta: SourceMeta;
  /** Fichiers .vtt de sous-titres eventuellement recuperes. */
  subtitlePaths: string[];
  thumbnailPath?: string;
}

export async function downloadVideo(url: string, dir: string): Promise<DownloadResult> {
  ensureDir(dir);
  const platform = detectPlatform(url);
  const ffmpegDir = path.dirname(ffmpegPath());

  const args = [
    url,
    "--no-playlist",
    "--no-warnings",
    "--no-progress",
    "--retries",
    "3",
    "--socket-timeout",
    "30",
    "-f",
    "bv*+ba/b",
    "--merge-output-format",
    "mp4",
    "--ffmpeg-location",
    ffmpegDir,
    "--write-info-json",
    "--write-subs",
    "--write-auto-subs",
    "--sub-langs",
    "ar.*,fr.*,en.*,ara,fra,eng",
    "--sub-format",
    "vtt/best",
    "--write-thumbnail",
    "--convert-thumbnails",
    "jpg",
    "-o",
    "video.%(ext)s",
    "-P",
    dir,
  ];

  if (config.cookiesFromBrowser) {
    args.push("--cookies-from-browser", config.cookiesFromBrowser);
  }

  const res = await run(ytDlpPath(), args, { timeoutMs: 5 * 60_000 });

  const infoPath = path.join(dir, "video.info.json");
  if (res.code !== 0 && !existsSync(infoPath)) {
    throw new Error(humanizeYtDlpError(res.stderr, platform));
  }

  // Le conteneur final n'est pas toujours .mp4 (webm sur certains posts Facebook).
  const files = readdirSync(dir);
  const videoFile = files.find((f) => /^video\.(mp4|webm|mkv|mov)$/i.test(f));
  if (!videoFile) {
    throw new Error(humanizeYtDlpError(res.stderr || "aucun fichier video produit", platform));
  }

  let info: Record<string, unknown> = {};
  if (existsSync(infoPath)) {
    try {
      info = JSON.parse(readFileSync(infoPath, "utf8"));
    } catch {
      /* info.json illisible : on continue avec des metadonnees vides */
    }
  }

  const get = <T>(key: string): T | undefined => info[key] as T | undefined;
  const title = get<string>("title") ?? get<string>("fulltitle");
  const description = get<string>("description");

  const meta: SourceMeta = {
    platform,
    url,
    id: get<string>("id"),
    titre: title,
    description,
    auteur: get<string>("uploader") ?? get<string>("channel") ?? get<string>("creator"),
    auteurUrl: get<string>("uploader_url") ?? get<string>("channel_url"),
    datePublication: formatDate(get<string>("upload_date")),
    dureeSecondes: Number(get<number>("duration") ?? 0),
    largeur: get<number>("width"),
    hauteur: get<number>("height"),
    fps: get<number>("fps"),
    vues: get<number>("view_count"),
    likes: get<number>("like_count"),
    commentaires: get<number>("comment_count"),
    partages: get<number>("repost_count"),
    hashtags: extractHashtags(title, description),
    musique: [get<string>("track"), get<string>("artist")].filter(Boolean).join(" - ") || undefined,
  };

  const subtitlePaths = files
    .filter((f) => f.startsWith("video.") && f.endsWith(".vtt"))
    .map((f) => path.join(dir, f));

  const thumb = files.find((f) => /^video\.(jpg|jpeg|png|webp)$/i.test(f));

  return {
    videoPath: path.join(dir, videoFile),
    meta,
    subtitlePaths,
    thumbnailPath: thumb ? path.join(dir, thumb) : undefined,
  };
}
