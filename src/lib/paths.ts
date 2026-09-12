import { mkdirSync, existsSync } from "node:fs";
import path from "node:path";

/** Racine du projet (le process Next tourne toujours depuis la racine). */
export const ROOT = process.cwd();

export const BIN_DIR = path.join(ROOT, "bin");
/**
 * Donnees persistantes : comptes, codes, commandes, analyses, modele Whisper.
 * Chez un hebergeur, le disque de l'application est efface a chaque
 * redeploiement : DATA_DIR doit alors pointer vers un volume persistant.
 * Sans variable, on garde ./data, comme en local.
 */
export const DATA_DIR = process.env.DATA_DIR?.trim()
  ? path.resolve(process.env.DATA_DIR.trim())
  : path.join(ROOT, "data");
export const ANALYSES_DIR = path.join(DATA_DIR, "analyses");

/** Dossier de travail d'une analyse : video, audio, frames, rapport. */
export function analysisDir(id: string): string {
  return path.join(ANALYSES_DIR, id);
}

export function analysisFile(id: string, ...parts: string[]): string {
  return path.join(analysisDir(id), ...parts);
}

export function ensureDir(dir: string): string {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  return dir;
}

/**
 * Empeche qu'un nom de fichier venu de l'URL sorte du dossier de l'analyse.
 * Retourne null si le chemin resolu s'echappe.
 */
export function safeMediaPath(id: string, relative: string): string | null {
  if (!/^[a-z0-9-]+$/i.test(id)) return null;
  const base = path.resolve(analysisDir(id));
  const target = path.resolve(base, relative);
  return target === base || target.startsWith(base + path.sep) ? target : null;
}
