/**
 * Reglages visibles du navigateur (inscrits dans le site a la construction).
 *
 * NEXT_PUBLIC_PAIEMENT_CARTE=1 une fois les cles Stripe saisies chez
 * l'hebergeur : tant qu'il vaut autre chose, aucun texte du site ne promet
 * le paiement par carte — seulement BaridiMob et CCP.
 */
export const CARTE_ACTIVE = process.env.NEXT_PUBLIC_PAIEMENT_CARTE === "1";

/** Formule courte des moyens de paiement, pour les textes d'accroche. */
export const MOYENS_PAIEMENT = CARTE_ACTIVE
  ? "Carte, RedotPay, BaridiMob ou CCP"
  : "Paiement BaridiMob ou CCP";
