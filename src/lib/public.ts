/**
 * Reglages visibles du navigateur (inscrits dans le site a la construction).
 *
 * Le paiement se fait par carte, via Stripe : c'est le seul chemin, et il
 * ouvre l'acces immediatement. Le support client passe par email.
 */

/** Adresse de support montree aux clients (NEXT_PUBLIC_EMAIL_SUPPORT pour la changer). */
export const EMAIL_SUPPORT = process.env.NEXT_PUBLIC_EMAIL_SUPPORT?.trim() || "support@hooked-lab.com";
