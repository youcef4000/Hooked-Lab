import { copyFileSync, renameSync } from "node:fs";
import path from "node:path";
import { downloadVideo, type DownloadResult } from "./download";
import { estImage, extensionDe, supprimerFichier, validerImage, validerVideo } from "./upload";
import { ensureDir } from "./paths";
import type { SourceEntree, SourceMeta } from "@/types/analysis";

/**
 * Point d'entree unique du pipeline.
 *
 * Quelle que soit l'origine de la creative — video telechargee depuis une
 * plateforme, video deposee, ou image deposee — cette fonction depose le
 * fichier dans le dossier de l'analyse et renvoie toujours la meme structure.
 * Toutes les etapes suivantes s'adaptent via meta.estStatique.
 */
export async function acquerirVideo(source: SourceEntree, dir: string): Promise<DownloadResult> {
  if (source.type === "url") return downloadVideo(source.url, dir);
  return adopterFichierDepose(source, dir);
}

/** Deplace un fichier depose dans le dossier de l'analyse et lit ses metadonnees. */
async function adopterFichierDepose(
  source: Extract<SourceEntree, { type: "fichier" }>,
  dir: string,
): Promise<DownloadResult> {
  ensureDir(dir);

  const statique = estImage(source.nomOriginal);
  const validation = statique
    ? await validerImage(source.cheminTemporaire)
    : await validerVideo(source.cheminTemporaire);

  if (!validation.ok) {
    supprimerFichier(source.cheminTemporaire);
    throw new Error(validation.message);
  }

  const extension = extensionDe(source.nomOriginal) || (statique ? ".jpg" : ".mp4");
  const destination = path.join(dir, `${statique ? "image" : "video"}${extension}`);

  try {
    renameSync(source.cheminTemporaire, destination);
  } catch {
    // Le renommage echoue si le dossier temporaire est sur un autre volume.
    copyFileSync(source.cheminTemporaire, destination);
    supprimerFichier(source.cheminTemporaire);
  }

  const nomSansExtension = path.basename(source.nomOriginal, extension);

  const meta: SourceMeta = {
    platform: statique ? "image" : "fichier",
    // Pas d'URL d'origine : le fichier vient du poste de l'utilisateur.
    url: "",
    titre: nomSansExtension,
    dureeSecondes: validation.infos.dureeSecondes,
    largeur: validation.infos.largeur,
    hauteur: validation.infos.hauteur,
    fps: validation.infos.fps,
    hashtags: [],
    estStatique: statique || undefined,
  };

  return {
    videoPath: destination,
    meta,
    // Un fichier local n'apporte ni sous-titres ni miniature : la transcription
    // bascule sur Whisper local, puis sur la lecture des textes a l'ecran.
    subtitlePaths: [],
  };
}
