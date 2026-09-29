/* ============================================================================
   Langue de l'interface — commun au serveur et au navigateur.

   Deux langues : francais et anglais. La langue se decide dans cet ordre :
   1. le choix explicite du visiteur (cookie hkl_lang, pose par le selecteur) ;
   2. la langue de son navigateur (en-tete Accept-Language) ;
   3. l'anglais par defaut.

   Pourquoi la langue du navigateur plutot que l'adresse IP : l'IP dit ou se
   trouve quelqu'un, pas la langue qu'il lit. Un Algerien a Paris, un
   Francais a Dubai, un Canadien anglophone a Montreal : le navigateur, lui,
   est regle dans la langue que la personne a choisie.
   ========================================================================== */

export type Langue = "fr" | "en";

export const LANGUES: Langue[] = ["fr", "en"];
export const COOKIE_LANGUE = "hkl_lang";

export function estLangue(v: unknown): v is Langue {
  return v === "fr" || v === "en";
}

/** Premiere langue reconnue dans un en-tete Accept-Language ("fr-DZ,fr;q=0.9,en;q=0.8"). */
export function langueDepuisEntete(entete: string | null | undefined): Langue {
  if (!entete) return "en";
  const preferees = entete
    .split(",")
    .map((morceau) => {
      const [code, q] = morceau.trim().split(";q=");
      return { code: code.toLowerCase(), q: q ? Number(q) : 1 };
    })
    .sort((a, b) => b.q - a.q);
  for (const { code } of preferees) {
    if (code.startsWith("fr")) return "fr";
    if (code.startsWith("en")) return "en";
  }
  return "en";
}

/** Choisit le texte dans la bonne langue : t(langue, { fr: "...", en: "..." }). */
export function choisir<T>(langue: Langue, textes: Record<Langue, T>): T {
  return textes[langue];
}

/** Locale Intl correspondante, pour les nombres et les dates. */
export function locale(langue: Langue): string {
  return langue === "fr" ? "fr-FR" : "en-US";
}
