import { estConnecte } from "./admin-auth";
import { crediter, debiter, type Utilisateur } from "./comptes";
import { utilisateurCourant } from "./session";
import { COUT_CREDITS } from "./tarifs";

/* ============================================================================
   Controle d'acces aux analyses.

   C'est le seul endroit qui autorise une depense d'API. Tout ce qui appelle
   Claude passe d'abord par ici, sinon la cle paie pour des inconnus.

   Le cout depend de la duree de la video, qu'on ne connait pas encore au
   moment de lancer : on debite donc le tarif moyen a l'entree, puis on
   ajuste des que la duree est mesuree. Si l'ajustement a la hausse depasse
   le solde, on prend ce qui reste et on laisse l'analyse aller au bout —
   perdre deux credits une fois coute moins cher que couper le travail d'un
   client en cours de route.

   L'administrateur connecte passe sans debit : il doit pouvoir tester son
   propre produit sans se facturer.
   ========================================================================== */

export type TypeAnalyse = "image" | "video";

/** Ce qu'on prend a l'entree, avant de connaitre la duree reelle. */
export const COUT_PROVISOIRE: Record<TypeAnalyse, number> = {
  image: COUT_CREDITS.image,
  video: COUT_CREDITS.videoMoyenne,
};

export function coutReel(type: TypeAnalyse, dureeSecondes: number): number {
  if (type === "image") return COUT_CREDITS.image;
  if (dureeSecondes < 30) return COUT_CREDITS.videoCourte;
  if (dureeSecondes <= 60) return COUT_CREDITS.videoMoyenne;
  return COUT_CREDITS.videoLongue;
}

export interface Acces {
  autorise: boolean;
  /** Message destine a l'utilisateur, deja en francais. */
  message?: string;
  /** Code HTTP a renvoyer quand l'acces est refuse. */
  statut?: number;
  /** Vide quand c'est l'administrateur : rien ne sera debite ni ajuste. */
  utilisateurId?: string;
  utilisateur?: Utilisateur;
}

/**
 * Verifie le droit de lancer une analyse et prend le cout provisoire.
 * Retourne l'identifiant a transmettre au pipeline pour l'ajustement final.
 */
export async function autoriserAnalyse(type: TypeAnalyse): Promise<Acces> {
  // Le proprietaire passe toujours : c'est sa cle, c'est son produit.
  if (await estConnecte()) return { autorise: true };

  const u = await utilisateurCourant();
  if (!u) {
    return {
      autorise: false,
      statut: 401,
      message: "Connecte-toi pour lancer une analyse.",
    };
  }

  const resultat = debiter(u.id, COUT_PROVISOIRE[type]);
  if (!resultat.ok) {
    // debiter() distingue deja abonnement expire, solde insuffisant et compte
    // suspendu : on transmet son message tel quel.
    return { autorise: false, statut: 402, message: resultat.message };
  }

  return { autorise: true, utilisateurId: u.id, utilisateur: resultat.utilisateur };
}

/**
 * Corrige le debit une fois la duree connue et retourne le total reellement
 * preleve. L'appelant garde cette valeur : c'est elle qu'il faudra rendre si
 * l'analyse echoue plus loin, et non le forfait de depart.
 *
 * Sans effet pour l'administrateur, dont l'identifiant est absent.
 */
export function ajusterCout(
  utilisateurId: string | undefined,
  type: TypeAnalyse,
  dureeSecondes: number,
): number {
  const provisoire = COUT_PROVISOIRE[type];
  if (!utilisateurId) return provisoire;

  const reel = coutReel(type, dureeSecondes);
  if (reel === provisoire) return provisoire;

  if (reel < provisoire) {
    crediter(utilisateurId, provisoire - reel);
    return reel;
  }

  // Hausse : si le solde ne suit pas, on garde ce qui a deja ete pris plutot
  // que de couper une analyse en cours (voir l'entete du fichier).
  const complement = debiter(utilisateurId, reel - provisoire);
  return complement.ok ? reel : provisoire;
}

/**
 * Rend les credits quand l'analyse echoue : le client n'a rien recu.
 * `montant` est ce qui a ete reellement preleve, retourne par ajusterCout.
 */
export function rembourser(utilisateurId: string | undefined, montant: number): void {
  if (!utilisateurId || montant <= 0) return;
  crediter(utilisateurId, montant);
}
