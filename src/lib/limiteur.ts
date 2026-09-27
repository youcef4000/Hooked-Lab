/* ============================================================================
   Freins contre les envois en rafale.

   Un compteur par cle (adresse IP ou compte) sur une fenetre glissante. Il
   vit en memoire : il repart de zero au redemarrage et ne suivrait pas
   plusieurs instances. C'est un ralentisseur — assez pour rendre le
   tatonnement d'un mot de passe ou le spam d'un formulaire inutilisable.
   ========================================================================== */

type Compteur = { debut: number; nombre: number };
type Registres = Map<string, Map<string, Compteur>>;

// globalThis : survit au rechargement a chaud du serveur de developpement.
const memoire = globalThis as unknown as { __hklLimiteurs?: Registres };
const registres: Registres = memoire.__hklLimiteurs ?? (memoire.__hklLimiteurs = new Map());

/** Retourne une fonction qui repond true quand la cle a depasse son quota. */
export function creerLimiteur(nom: string, fenetreMs: number, maximum: number) {
  const registre = registres.get(nom) ?? new Map<string, Compteur>();
  registres.set(nom, registre);

  return function depasse(cle: string): boolean {
    const maintenant = Date.now();
    const c = registre.get(cle);
    if (!c || maintenant - c.debut > fenetreMs) {
      registre.set(cle, { debut: maintenant, nombre: 1 });
      if (registre.size > 5000) registre.clear(); // garde-fou memoire
      return false;
    }
    c.nombre++;
    return c.nombre > maximum;
  };
}

/**
 * Adresse du visiteur. Derriere l'hebergeur, la connexion vient du proxy :
 * la vraie adresse est dans les en-tetes qu'il ajoute. On prefere ceux que
 * le client ne peut pas forger (poses par le CDN), puis X-Forwarded-For.
 */
export function ipClient(requete: Request): string {
  const h = requete.headers;
  return (
    h.get("cf-connecting-ip")?.trim() ||
    h.get("true-client-ip")?.trim() ||
    h.get("x-forwarded-for")?.split(",")[0].trim() ||
    h.get("x-real-ip")?.trim() ||
    "inconnue"
  );
}
