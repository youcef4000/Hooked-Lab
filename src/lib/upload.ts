import { createWriteStream, existsSync, readdirSync, rmSync, statSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { Readable } from "node:stream";
import path from "node:path";
import { ffmpegPath, run } from "./bin";
import { DATA_DIR, ensureDir } from "./paths";
import { TAILLE_MAX_OCTETS, extensionDe } from "./upload-limites";
import type { Langue } from "./langue";

export {
  EXTENSIONS_ACCEPTEES,
  EXTENSIONS_IMAGE,
  EXTENSIONS_VIDEO,
  TAILLE_MAX_OCTETS,
  estImage,
  extensionAcceptee,
  extensionDe,
  formatTaille,
} from "./upload-limites";

import { formatTaille } from "./upload-limites";

/** Dossier de transit des fichiers deposes. Couvert par `data/` dans .gitignore. */
export const UPLOADS_DIR = path.join(DATA_DIR, "uploads");

/** Duree de vie d'un fichier orphelin avant purge automatique. */
const DUREE_VIE_MS = 60 * 60 * 1000;

/** Nom de fichier imprevisible : le nom d'origine n'atteint jamais le disque. */
function nomTemporaire(extension: string): string {
  return `${Date.now().toString(36)}-${randomBytes(16).toString("hex")}${extension}`;
}

export class UploadError extends Error {}

/**
 * Ecrit le corps de la requete sur disque en flux, sans jamais charger les
 * 95 Mo en memoire. Interrompt et nettoie des que le quota est depasse.
 */
/** Messages de depot, dans la langue de la personne qui depose. */
const MESSAGES = {
  fr: {
    tropLourd: (limite: string) => `Fichier trop volumineux : la limite est ${limite}. Compresse la vidéo ou coupe-la avant de la déposer.`,
    transfert: (detail: string) => `Le transfert du fichier a échoué : ${detail}`,
    vide: "Le fichier reçu est vide.",
    disque: "Le fichier n'a pas pu être enregistré sur le disque.",
    pasVideo:
      "Ce fichier n'est pas une vidéo lisible. Vérifie qu'il s'ouvre bien dans ton lecteur vidéo, et qu'il ne s'agit pas d'un autre type de document renommé en .mp4.",
    audioSeul: "Ce fichier ne contient qu'une piste audio. Dépose la vidéo complète.",
    sansVideo: "Aucune piste vidéo détectée dans ce fichier. Vérifie qu'il s'agit bien d'une vidéo.",
    tronquee: "La vidéo semble vide ou tronquée (durée nulle). Le transfert a peut-être été interrompu : réessaie.",
    pasImage:
      "Ce fichier n'est pas une image lisible. Vérifie qu'elle s'ouvre bien dans une visionneuse, et qu'il ne s'agit pas d'un autre type de document renommé en .jpg ou .png.",
    sansImage: "Aucune image détectée dans ce fichier. Vérifie qu'il s'agit bien d'une créative statique.",
  },
  en: {
    tropLourd: (limite: string) => `File too large: the limit is ${limite}. Compress or trim the video before uploading it.`,
    transfert: (detail: string) => `The file upload failed: ${detail}`,
    vide: "The uploaded file is empty.",
    disque: "The file could not be saved to disk.",
    pasVideo:
      "This file is not a readable video. Check that it opens in your video player and that it is not another kind of document renamed to .mp4.",
    audioSeul: "This file only contains an audio track. Upload the full video.",
    sansVideo: "No video track found in this file. Check that it really is a video.",
    tronquee: "The video looks empty or truncated (zero duration). The upload may have been interrupted: try again.",
    pasImage:
      "This file is not a readable image. Check that it opens in an image viewer and that it is not another kind of document renamed to .jpg or .png.",
    sansImage: "No image found in this file. Check that it really is a static creative.",
  },
} as const;

export async function ecrireFluxSurDisque(
  corps: ReadableStream<Uint8Array>,
  nomOriginal: string,
  langue: Langue = "fr",
): Promise<{ chemin: string; taille: number }> {
  const t = MESSAGES[langue];
  ensureDir(UPLOADS_DIR);
  purgerUploadsAnciens();

  const extension = extensionDe(nomOriginal) || ".mp4";
  const chemin = path.join(UPLOADS_DIR, nomTemporaire(extension));
  const sortie = createWriteStream(chemin);

  let taille = 0;
  try {
    for await (const morceau of Readable.fromWeb(corps as Parameters<typeof Readable.fromWeb>[0])) {
      const bloc = morceau as Buffer;
      taille += bloc.length;
      if (taille > TAILLE_MAX_OCTETS) {
        throw new UploadError(t.tropLourd(formatTaille(TAILLE_MAX_OCTETS)));
      }
      if (!sortie.write(bloc)) {
        // Le tampon d'ecriture est plein : on attend qu'il se vide.
        await new Promise<void>((resolve) => sortie.once("drain", () => resolve()));
      }
    }
    await new Promise<void>((resolve, reject) => {
      sortie.end((err?: Error | null) => (err ? reject(err) : resolve()));
    });
  } catch (err) {
    sortie.destroy();
    supprimerFichier(chemin);
    if (err instanceof UploadError) throw err;
    throw new UploadError(t.transfert((err as Error).message));
  }

  if (taille === 0) {
    supprimerFichier(chemin);
    throw new UploadError(t.vide);
  }

  return { chemin, taille };
}

export interface InfosVideo {
  dureeSecondes: number;
  largeur?: number;
  hauteur?: number;
  fps?: number;
}

/**
 * Verifie qu'un fichier est bien une video exploitable, en lisant son entete
 * avec ffmpeg (meme lecture de conteneur que ffprobe, binaire deja installe).
 * Attrape aussi bien un fichier corrompu qu'un PDF renomme en .mp4.
 */
export async function validerVideo(
  chemin: string,
  langue: Langue = "fr",
): Promise<{ ok: true; infos: InfosVideo } | { ok: false; message: string }> {
  const t = MESSAGES[langue];
  if (!existsSync(chemin)) {
    return { ok: false, message: t.disque };
  }

  const res = await run(ffmpegPath(), ["-hide_banner", "-i", chemin], { timeoutMs: 60_000 });
  const sortie = res.stderr;
  const bas = sortie.toLowerCase();

  // ffmpeg n'ouvre meme pas le conteneur : ce n'est pas une video.
  if (
    bas.includes("invalid data found") ||
    bas.includes("moov atom not found") ||
    bas.includes("no such file") ||
    bas.includes("end of file") ||
    bas.includes("invalid argument")
  ) {
    return {
      ok: false,
      message: t.pasVideo,
    };
  }

  if (!/Stream #\d+:\d+.*: Video:/i.test(sortie)) {
    return {
      ok: false,
      message: bas.includes("audio:") ? t.audioSeul : t.sansVideo,
    };
  }

  const mDuree = sortie.match(/Duration:\s*(\d+):(\d+):(\d+\.?\d*)/);
  const duree = mDuree
    ? Number(mDuree[1]) * 3600 + Number(mDuree[2]) * 60 + Number(mDuree[3])
    : 0;

  if (!duree || duree < 0.5) {
    return {
      ok: false,
      message: t.tronquee,
    };
  }

  const mDim = sortie.match(/: Video:.*?,\s*(\d{2,5})x(\d{2,5})/);
  const mFps = sortie.match(/([\d.]+)\s*fps/);

  return {
    ok: true,
    infos: {
      dureeSecondes: duree,
      largeur: mDim ? Number(mDim[1]) : undefined,
      hauteur: mDim ? Number(mDim[2]) : undefined,
      fps: mFps ? Number(mFps[1]) : undefined,
    },
  };
}

/**
 * Verifie qu'un fichier est bien une image exploitable. ffmpeg decode une
 * image comme un flux video d'une seule frame : memes verifications, sans
 * l'exigence de duree.
 */
export async function validerImage(
  chemin: string,
  langue: Langue = "fr",
): Promise<{ ok: true; infos: InfosVideo } | { ok: false; message: string }> {
  const t = MESSAGES[langue];
  if (!existsSync(chemin)) {
    return { ok: false, message: t.disque };
  }

  const res = await run(ffmpegPath(), ["-hide_banner", "-i", chemin], { timeoutMs: 60_000 });
  const sortie = res.stderr;
  const bas = sortie.toLowerCase();

  if (
    bas.includes("invalid data found") ||
    bas.includes("no such file") ||
    bas.includes("end of file") ||
    bas.includes("invalid argument")
  ) {
    return {
      ok: false,
      message: t.pasImage,
    };
  }

  if (!/Stream #\d+:\d+.*: Video:/i.test(sortie)) {
    return {
      ok: false,
      message: t.sansImage,
    };
  }

  const mDim = sortie.match(/: Video:.*?,\s*(\d{2,5})x(\d{2,5})/);

  return {
    ok: true,
    infos: {
      dureeSecondes: 0,
      largeur: mDim ? Number(mDim[1]) : undefined,
      hauteur: mDim ? Number(mDim[2]) : undefined,
    },
  };
}

export function supprimerFichier(chemin: string): void {
  try {
    if (existsSync(chemin)) rmSync(chemin, { force: true });
  } catch {
    /* le fichier disparaitra a la prochaine purge */
  }
}

/**
 * Supprime les fichiers deposes restes en transit plus d'une heure : ce sont
 * des analyses interrompues avant que le pipeline ne les nettoie lui-meme.
 */
export function purgerUploadsAnciens(): void {
  if (!existsSync(UPLOADS_DIR)) return;
  const limite = Date.now() - DUREE_VIE_MS;

  for (const nom of readdirSync(UPLOADS_DIR)) {
    const chemin = path.join(UPLOADS_DIR, nom);
    try {
      if (statSync(chemin).mtimeMs < limite) rmSync(chemin, { force: true });
    } catch {
      /* fichier deja supprime ou verrouille */
    }
  }
}
