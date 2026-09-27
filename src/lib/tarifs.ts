/* ============================================================================
   Grille tarifaire.

   Construite a partir du cout reel mesure sur des analyses completes :
     analyse video  ~ 0,25 a 0,45 $ d'API (claude-sonnet-5 : 2 $ / 10 $ par
                      million de tokens) — on planifie a 0,35 $
     analyse image  ~ la meme chose ou presque : le rapport ecrit est aussi
                      long, seules les images en entree sont moins nombreuses

   Le cout depend du nombre d'images envoyees et de la longueur du rapport,
   presque pas de la duree de la video : une video de 10 s coute autant
   qu'une video d'une minute. D'ou un tarif unique par video, plus simple
   a comprendre pour le client.

   Deux grilles :
   - Dinars (Algerie, BaridiMob / CCP, code d'activation). Parite de pouvoir
     d'achat, marge ~40 a 50 % a consommation pleine au taux parallele.
   - Dollars ou euros (carte bancaire, y compris RedotPay). Marge ~60 a 70 %
     a consommation pleine, avant les frais de paiement (~3 %).

   En pratique, un abonne consomme rarement tous ses credits : la marge
   reelle est nettement superieure. Pas d'offre gratuite : elle serait videe
   par des comptes jetables.
   ========================================================================== */

export type Devise = "DZD" | "EUR" | "USD";

export interface Palier {
  nom: string;
  creditsMensuels: number;
  /** Prix mensuel sans engagement, en dinars. */
  base: number;
  /** Prix mensuel sans engagement, en dollars ou en euros (meme chiffre). */
  baseInternational: number;
  cible: string;
  avantages: string[];
  populaire?: boolean;
}

/** Ce que consomme une analyse, en credits. */
export const COUT_CREDITS = {
  image: 2,
  video: 3,
  // Conserves pour la compatibilite : toutes les durees coutent desormais pareil.
  videoCourte: 3,
  videoMoyenne: 3,
  videoLongue: 3,
} as const;

/**
 * Trois paliers seulement. Au-dela, le visiteur compare au lieu de choisir —
 * et le palier du milieu perd son role de reference.
 */
export const PALIERS: Palier[] = [
  {
    nom: "Essentiel",
    creditsMensuels: 45,
    base: 2900,
    baseInternational: 19,
    cible: "Pour tester des produits en solo",
    avantages: [
      "15 analyses vidéo par mois",
      "Rapport complet, sourcing et rentabilité",
      "Annonces en français et en arabe",
      "Historique illimité",
    ],
  },
  {
    nom: "Pro",
    creditsMensuels: 150,
    base: 7900,
    baseInternational: 49,
    cible: "Pour un e-commerçant qui scale",
    populaire: true,
    avantages: [
      "50 analyses vidéo par mois",
      "Tout l'Essentiel",
      "Plusieurs analyses lancées à la suite",
      "Support prioritaire sur WhatsApp",
    ],
  },
  {
    nom: "Agence",
    creditsMensuels: 420,
    base: 19900,
    baseInternational: 129,
    cible: "Pour les media buyers et agences",
    avantages: [
      "140 analyses vidéo par mois",
      "Tout le Pro",
      "Un compte utilisable par toute ton équipe",
      "Accompagnement au démarrage par téléphone",
    ],
  },
];

/**
 * Remises par duree d'engagement. Plus de mois de credits offerts : cumules
 * a la remise, ils faisaient passer l'engagement d'un an sous le cout reel.
 */
export const ENGAGEMENTS = [
  { mois: 1, libelle: "Mensuel", remise: 0, moisBonus: 0 },
  { mois: 6, libelle: "6 mois", remise: 0.1, moisBonus: 0 },
  { mois: 12, libelle: "1 an", remise: 0.2, moisBonus: 0 },
] as const;

/** Credits offerts en une fois a la souscription (aucun dans la grille actuelle). */
export function creditsBonus(creditsMensuels: number, moisBonus: number): number {
  return creditsMensuels * moisBonus;
}

/** Arrondit a la centaine de dinars la plus proche : un prix se lit mieux. */
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
  { credits: 15, prix: 1500, prixInternational: 9, libelle: "Dépannage" },
  { credits: 45, prix: 3900, prixInternational: 24, libelle: "Le plus pris", populaire: true },
  { credits: 120, prix: 8900, prixInternational: 55, libelle: "Grosse campagne" },
] as const;

export function prixParCredit(prix: number, credits: number): number {
  return Math.round(prix / credits);
}

/* --------------------------------------------------------- multi-devises */

/** Prix mensuel d'un palier dans une devise, remise d'engagement comprise. */
export function prixPalier(p: Palier, devise: Devise, remise: number): number {
  if (devise === "DZD") return prixMensuelAvecRemise(p.base, remise);
  return Math.round(p.baseInternational * (1 - remise));
}

/** Montant total paye d'avance pour la duree d'engagement. */
export function totalPalier(p: Palier, devise: Devise, remise: number, mois: number): number {
  return prixPalier(p, devise, remise) * mois;
}

export function prixRecharge(r: (typeof RECHARGES)[number], devise: Devise): number {
  return devise === "DZD" ? r.prix : r.prixInternational;
}

/** "2 900 DA", "19 $", "19 €" — la forme que le client attend dans sa devise. */
export function formatPrix(montant: number, devise: Devise): string {
  const n = montant.toLocaleString("fr-FR", { maximumFractionDigits: 2 });
  if (devise === "DZD") return `${n} DA`;
  return devise === "EUR" ? `${n} €` : `${n} $`;
}

/** Prix d'un credit, pour comparer les formules entre elles. */
export function formatPrixCredit(montant: number, credits: number, devise: Devise): string {
  const unitaire = montant / credits;
  if (devise === "DZD") return `${Math.round(unitaire)} DA`;
  const n = unitaire.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return devise === "EUR" ? `${n} €` : `${n} $`;
}

/** Nombre d'analyses video que permet un volume de credits. */
export function videosPour(credits: number): number {
  return Math.floor(credits / COUT_CREDITS.video);
}
