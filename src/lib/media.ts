import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { ffmpegPath, run, runOrThrow } from "./bin";
import { config } from "./config";
import { ensureDir } from "./paths";
import type { Frame, MediaAssets } from "@/types/analysis";

/** Duree en secondes lue dans la banniere ffmpeg (evite une dependance a ffprobe). */
export async function probeDuration(videoPath: string): Promise<number> {
  const res = await run(ffmpegPath(), ["-hide_banner", "-i", videoPath], { timeoutMs: 30_000 });
  const m = res.stderr.match(/Duration:\s*(\d+):(\d+):(\d+\.?\d*)/);
  if (!m) return 0;
  return Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]);
}

/**
 * Produit deux pistes audio :
 *  - audio.mp3  : ecoutable et telechargeable depuis l'interface
 *  - audio16k.wav : PCM 16 kHz mono, format attendu par Whisper
 */
export async function extractAudio(
  videoPath: string,
  dir: string,
  maxSeconds: number,
): Promise<{ mp3?: string; wav?: string }> {
  const mp3 = path.join(dir, "audio.mp3");
  const wav = path.join(dir, "audio16k.wav");
  const limit = ["-t", String(maxSeconds)];

  const mp3Res = await run(
    ffmpegPath(),
    ["-y", "-hide_banner", "-loglevel", "error", "-i", videoPath, ...limit,
     "-vn", "-acodec", "libmp3lame", "-b:a", "128k", mp3],
    { timeoutMs: 3 * 60_000 },
  );

  const wavRes = await run(
    ffmpegPath(),
    ["-y", "-hide_banner", "-loglevel", "error", "-i", videoPath, ...limit,
     "-vn", "-ac", "1", "-ar", "16000", "-acodec", "pcm_s16le", wav],
    { timeoutMs: 3 * 60_000 },
  );

  return {
    mp3: mp3Res.code === 0 && existsSync(mp3) ? mp3 : undefined,
    wav: wavRes.code === 0 && existsSync(wav) ? wav : undefined,
  };
}

/** Timestamps des changements de plan, via le filtre `scene` de ffmpeg. */
export async function detectScenes(videoPath: string, maxSeconds: number): Promise<number[]> {
  const res = await run(
    ffmpegPath(),
    ["-hide_banner", "-t", String(maxSeconds), "-i", videoPath,
     "-filter:v", "select='gt(scene,0.28)',showinfo", "-f", "null", "-"],
    { timeoutMs: 4 * 60_000 },
  );

  const times: number[] = [];
  for (const m of res.stderr.matchAll(/pts_time:([0-9.]+)/g)) {
    const t = Number(m[1]);
    if (Number.isFinite(t)) times.push(Number(t.toFixed(2)));
  }
  return [...new Set(times)].sort((a, b) => a - b);
}

/**
 * Choisit les instants a capturer : les changements de plan d'abord (ils portent
 * l'information narrative), completes par un echantillonnage regulier.
 * Le tout premier instant est force a 0.3 s car le hook se joue la.
 */
export function pickFrameTimes(duration: number, scenes: number[], maxFrames: number): {
  times: number[];
  cuts: Set<number>;
} {
  const usable = Math.max(1, Math.min(duration, config.maxVideoSeconds));
  const minGap = Math.max(0.5, usable / (maxFrames * 1.8));
  const cuts = new Set<number>();
  const chosen: number[] = [];

  const push = (t: number, isCut: boolean) => {
    const clamped = Math.max(0.1, Math.min(usable - 0.05, Number(t.toFixed(2))));
    if (chosen.some((c) => Math.abs(c - clamped) < minGap)) return;
    chosen.push(clamped);
    if (isCut) cuts.add(clamped);
  };

  push(0.3, false);
  // Les plans detectes : on capture juste apres la coupe pour eviter le fondu.
  for (const s of scenes) {
    if (chosen.length >= maxFrames) break;
    if (s <= usable) push(s + 0.15, true);
  }
  // Remplissage regulier sur toute la duree.
  const steps = Math.max(2, maxFrames);
  for (let i = 0; i < steps && chosen.length < maxFrames; i++) {
    push((usable * (i + 0.5)) / steps, false);
  }

  chosen.sort((a, b) => a - b);
  return { times: chosen.slice(0, maxFrames), cuts };
}

/** Capture une image par instant demande, redimensionnee pour l'analyse vision. */
export async function extractFrames(
  videoPath: string,
  dir: string,
  times: number[],
  cuts: Set<number>,
): Promise<Frame[]> {
  const framesDir = ensureDir(path.join(dir, "frames"));
  const frames: Frame[] = [];

  for (let i = 0; i < times.length; i++) {
    const t = times[i];
    const name = `f${String(i).padStart(3, "0")}.jpg`;
    const out = path.join(framesDir, name);

    const res = await run(
      ffmpegPath(),
      ["-y", "-hide_banner", "-loglevel", "error",
       "-ss", String(t), "-i", videoPath, "-frames:v", "1",
       // Le cote long est ramene a 900 px : assez pour lire les sous-titres brules
       // sans exploser le nombre de tokens image.
       "-vf", "scale=w=900:h=900:force_original_aspect_ratio=decrease:force_divisible_by=2",
       "-q:v", "4", out],
      { timeoutMs: 60_000 },
    );

    if (res.code === 0 && existsSync(out)) {
      frames.push({ file: `frames/${name}`, t, coupe: cuts.has(t) });
    }
  }

  if (frames.length === 0) {
    throw new Error(
      "Aucune image n'a pu etre extraite de la video. Le fichier telecharge est peut-etre corrompu.",
    );
  }
  return frames;
}

export function readFrameBase64(absPath: string): string {
  return readFileSync(absPath).toString("base64");
}

/** Chaine complete d'extraction media a partir de la video telechargee. */
export async function buildMediaAssets(
  videoPath: string,
  dir: string,
  knownDuration: number,
): Promise<{ assets: MediaAssets; duration: number; wavPath?: string; warnings: string[] }> {
  const warnings: string[] = [];

  let duration = knownDuration;
  if (!duration || duration <= 0) duration = await probeDuration(videoPath);
  if (!duration || duration <= 0) {
    warnings.push("Duree de la video indeterminee : les timestamps peuvent etre approximatifs.");
    duration = 60;
  }

  const capped = Math.min(duration, config.maxVideoSeconds);
  if (duration > config.maxVideoSeconds) {
    warnings.push(
      `Video de ${Math.round(duration)} s tronquee a ${config.maxVideoSeconds} s pour l'analyse ` +
        "(reglable via MAX_VIDEO_SECONDS).",
    );
  }

  const audio = await extractAudio(videoPath, dir, capped);
  if (!audio.mp3) warnings.push("Extraction audio impossible : la video n'a probablement pas de piste son.");

  let scenes: number[] = [];
  try {
    scenes = await detectScenes(videoPath, capped);
  } catch {
    warnings.push("Detection des changements de plan indisponible : echantillonnage regulier utilise.");
  }

  const { times, cuts } = pickFrameTimes(capped, scenes, config.maxFrames);
  const frames = await extractFrames(videoPath, dir, times, cuts);

  return {
    assets: {
      video: path.basename(videoPath),
      audio: audio.mp3 ? "audio.mp3" : undefined,
      frames,
      coupes: scenes,
    },
    duration: capped,
    wavPath: audio.wav,
    warnings,
  };
}

/**
 * Prepare une creative statique pour l'analyse : une seule "frame", re-encodee
 * en JPEG avec un cote long genereux (1400 px) pour que les textes de l'image
 * publicitaire restent lisibles par le modele. Ni audio, ni scenes.
 */
export async function buildMediaAssetsImage(
  imagePath: string,
  dir: string,
): Promise<{ assets: MediaAssets; duration: number; wavPath?: string; warnings: string[] }> {
  const framesDir = ensureDir(path.join(dir, "frames"));
  const out = path.join(framesDir, "f000.jpg");

  await runOrThrow(
    ffmpegPath(),
    ["-y", "-hide_banner", "-loglevel", "error", "-i", imagePath, "-frames:v", "1",
     "-vf", "scale=w=1400:h=1400:force_original_aspect_ratio=decrease:force_divisible_by=2",
     "-q:v", "3", out],
    { timeoutMs: 60_000, context: "preparation de l'image" },
  );

  return {
    assets: {
      // Pas de lecteur video pour une image : l'interface affiche la frame.
      video: undefined,
      audio: undefined,
      frames: [{ file: "frames/f000.jpg", t: 0, coupe: false }],
      coupes: [],
    },
    duration: 0,
    warnings: [],
  };
}

/** Verifie tot que ffmpeg repond, pour echouer avec un message clair. */
export async function assertFfmpeg(): Promise<void> {
  await runOrThrow(ffmpegPath(), ["-version"], { timeoutMs: 15_000, context: "ffmpeg" });
}
