/* ============================================================================
   Grille tarifaire.

   Construite a partir du cout reel mesure, pas au doigt mouille :
     analyse video  ~ 33 DA de cout API (claude-sonnet-5, taux parallele 252)
     analyse image  ~ 15 DA

   Le credit est vendu autour de 40 DA en abonnement, soit une marge d'environ
   x3,7 sur une video — de quoi absorber l'hebergement, les impayes et les
   analyses qui echouent, tout en restant abordable pour un e-commercant.

   Pas d'offre gratuite : elle serait videe par des comptes jetables. La
   demonstration se fait avec un rapport d'exemple consultable sans compte.
   ========================================================================== */

export interface Formule {
  id: string;
  nom: string;
  /** Prix mensuel affiche, en dinars. */
  prixMensuel: number;
  /** Credits crediteds chaque mois. */
  credits: number;
  /** Engagement en mois : 1, 6 ou 12. */
  engagement: number;
  /** Montant total preleve en une fois pour la duree d'engagement. */
  prixTotal: number;
  /** Economie affichee par rapport au mensuel sans engagement. */
  economiePct: number;
  populaire?: boolean;
}

export interface Palier {
  nom: string;
  creditsMensuels: number;
  /** Prix mensuel sans engagement, en dinars. */
  base: number;
  cible: string;
  avantages: string[];
  populaire?: boolean;
}

/** Ce que consomme une analyse, en credits. */
export const COUT_CREDITS = {
  image: 1,
  videoCourte: 2, // moins de 30 s
  videoMoyenne: 3, // 30 a 60 s
  videoLongue: 5, // plus de 60 s
} as const;

/**
 * Trois paliers seulement. Au-dela, le visiteur compare au lieu de choisir —
 * et le palier du milieu perd son role de reference.
 */
export const PALIERS: Palier[] = [
  {
    nom: "Essentiel",
    creditsMensuels: 60,
    base: 2400,
    cible: "Pour tester des produits en solo",
    avantages: [
      "Environ 20 analyses vidéo par mois",
      "Rapport complet, sourcing et rentabilité",
      "Annonces Meta en français et en arabe",
      "Historique illimité",
    ],
  },
  {
    nom: "Pro",
    creditsMensuels: 180,
    base: 5900,
    cible: "Pour un e-commerçant qui scale",
    populaire: true,
    avantages: [
      "Environ 60 analyses vidéo par mois",
      "Tout l'Essentiel, sans limite de durée vidéo",
      "Analyses lancées en parallèle",
      "Recharges à tarif réduit",
      "Support prioritaire",
    ],
  },
  {
    nom: "Agence",
    creditsMensuels: 500,
    base: 13900,
    cible: "Pour les media buyers et agences",
    avantages: [
      "Environ 165 analyses vidéo par mois",
      "Tout le Pro",
      "Jusqu'à 5 analyses simultanées",
      "Crédits partagés entre collaborateurs",
      "Accompagnement au démarrage",
    ],
  },
];

/**
 * Remises et bonus par duree d'engagement.
 *
 * Deux leviers combines volontairement : la remise agit sur le prix (rationnel),
 * le bonus offre des credits immediats (sentiment de gain). `moisBonus` exprime
 * le bonus en mois de credits offerts — plus parlant qu'un pourcentage.
 */
export const ENGAGEMENTS = [
  { mois: 1, libelle: "Mensuel", remise: 0, moisBonus: 0 },
  { mois: 6, libelle: "6 mois", remise: 0.15, moisBonus: 1 },
  { mois: 12, libelle: "1 an", remise: 0.25, moisBonus: 3 },
] as const;

/** Credits offerts en une fois a la souscription. */
export function creditsBonus(creditsMensuels: number, moisBonus: number): number {
  return creditsMensuels * moisBonus;
}

/** Arrondit au centaine de dinars la plus proche : un prix se lit mieux. */
function arrondir(montant: number): number {
  return Math.round(montant / 100) * 100;
}

export function prixMensuelAvecRemise(base: number, remise: number): number {
  return arrondir(base * (1 - remise));
}

export function prixTotalEngagement(base: number, remise: number, mois: number): number {
  return arrondir(base * (1 - remise)) * mois;
}

/**
 * Recharges ponctuelles, quand les credits du mois sont epuises.
 * Volontairement plus cheres au credit que l'abonnement : la recharge depanne,
 * elle ne doit pas devenir une facon de contourner l'abonnement.
 */
export const RECHARGES = [
  { credits: 25, prix: 1400, libelle: "Dépannage" },
  { credits: 70, prix: 3500, libelle: "Le plus pris", populaire: true },
  { credits: 160, prix: 7200, libelle: "Grosse campagne" },
] as const;

export function prixParCredit(prix: number, credits: number): number {
  return Math.round(prix / credits);
}
