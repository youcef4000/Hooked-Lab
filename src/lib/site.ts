/**
 * Adresse publique du site, sans barre finale.
 *
 * SITE_URL (lue a l'execution, donc modifiable sans reconstruire le site),
 * sinon NEXT_PUBLIC_SITE_URL. Sert aux apercus de liens (Open Graph), au
 * plan du site, au fichier robots et aux adresses de retour de paiement.
 */
export const URL_SITE_CONFIGUREE = (
  process.env.SITE_URL?.trim() ||
  process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
  "http://localhost:3000"
).replace(/\/+$/, "");

/** Pour les pages sans requete sous la main : l'adresse configuree. */
export const URL_SITE = URL_SITE_CONFIGUREE;

const configuree = Boolean(process.env.SITE_URL?.trim() || process.env.NEXT_PUBLIC_SITE_URL?.trim());

/**
 * Adresse publique deduite de la requete (hote transmis par le proxy de
 * l'hebergeur). L'adresse configuree garde la priorite quand elle existe.
 */
export function urlSiteDepuis(h: Headers): string {
  if (configuree) return URL_SITE_CONFIGUREE;
  const hote = h.get("x-forwarded-host") ?? h.get("host");
  if (!hote) return URL_SITE_CONFIGUREE;
  const protocole = h.get("x-forwarded-proto")?.split(",")[0].trim() || (hote.startsWith("localhost") ? "http" : "https");
  return `${protocole}://${hote}`;
}
