/**
 * Adresse publique du site, sans barre finale.
 *
 * NEXT_PUBLIC_SITE_URL une fois le nom de domaine branche ; en attendant,
 * Render fournit RENDER_EXTERNAL_URL (l'adresse en .onrender.com). Sert aux
 * apercus de liens (Open Graph), au plan du site et au fichier robots.
 */
export const URL_SITE_CONFIGUREE = (
  process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
  process.env.RENDER_EXTERNAL_URL?.trim() ||
  "http://localhost:3000"
).replace(/\/+$/, "");

/** Pour les pages sans requete sous la main : l'adresse configuree. */
export const URL_SITE = URL_SITE_CONFIGUREE;

/**
 * Adresse publique deduite de la requete (hote transmis par le proxy de
 * l'hebergeur). NEXT_PUBLIC_SITE_URL garde la priorite quand elle existe.
 */
export function urlSiteDepuis(h: Headers): string {
  if (process.env.NEXT_PUBLIC_SITE_URL?.trim()) return URL_SITE_CONFIGUREE;
  const hote = h.get("x-forwarded-host") ?? h.get("host");
  if (!hote) return URL_SITE_CONFIGUREE;
  const protocole = h.get("x-forwarded-proto")?.split(",")[0].trim() || (hote.startsWith("localhost") ? "http" : "https");
  return `${protocole}://${hote}`;
}
