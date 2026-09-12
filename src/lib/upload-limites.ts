/**
 * Limites de depot de fichier, partagees par le navigateur et le serveur.
 * Ce module ne doit importer aucun module Node : il est charge cote client.
 */

export const TAILLE_MAX_OCTETS = 300 * 1024 * 1024;

export const EXTENSIONS_VIDEO = [".mp4", ".mov", ".webm", ".m4v"] as const;
export const EXTENSIONS_IMAGE = [".jpg", ".jpeg", ".png", ".webp"] as const;
export const EXTENSIONS_ACCEPTEES = [...EXTENSIONS_VIDEO, ...EXTENSIONS_IMAGE] as const;

/** Valeur de l'attribut accept de l'input fichier. */
export const ACCEPT_INPUT = [
  ...EXTENSIONS_ACCEPTEES,
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "image/jpeg",
  "image/png",
  "image/webp",
].join(",");

export function extensionDe(nom: string): string {
  const point = nom.lastIndexOf(".");
  return point === -1 ? "" : nom.slice(point).toLowerCase();
}

/** true si le fichier est une creative statique d apres son extension. */
export function estImage(nom: string): boolean {
  return (EXTENSIONS_IMAGE as readonly string[]).includes(extensionDe(nom));
}

export function extensionAcceptee(nom: string): boolean {
  return (EXTENSIONS_ACCEPTEES as readonly string[]).includes(extensionDe(nom));
}

/** Retire les decimales inutiles : 300.0 Mo devient 300 Mo. */
function nombre(valeur: number, decimales: number): string {
  return valeur.toFixed(decimales).replace(/\.?0+$/, "");
}

export function formatTaille(octets: number): string {
  if (octets >= 1024 * 1024 * 1024) return `${nombre(octets / 1024 / 1024 / 1024, 2)} Go`;
  if (octets >= 1024 * 1024) return `${nombre(octets / 1024 / 1024, 1)} Mo`;
  return `${Math.max(1, Math.round(octets / 1024))} Ko`;
}
