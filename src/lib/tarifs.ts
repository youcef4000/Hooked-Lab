/* ============================================================================
   Grille tarifaire.

   Construite a partir du cout reel mesure sur des analyses completes :
     analyse video  ~ 0,25 a 0,45 $ d'API (claude-sonnet-5 : 2 $ / 10 $ par
                      million de tokens) — mesure : 0,25 $ ; on planifie a 0,35 $
     analyse image  ~ la meme chose ou presque : le rapport ecrit est aussi
                      long, seules les images en entree sont moins nombreuses

   Le cout depend du nombre d'images envoyees et de la longueur du rapport,
   presque pas de la duree de la video : une video de 10 s coute autant
   qu'une video d'une minute. D'ou un tarif unique par video.

   Une seule grille, en dollars, euros ou livres (meme chiffre) : c'est la
   convention des logiciels vendus a l'international, et en Algerie aussi
   on paie en devises (carte RedotPay, marche parallele). Marge ~60 a 70 %
   a consommation pleine, avant frais de paiement (~3 %). En pratique, un
   abonne consomme rarement tous ses credits.
   ========================================================================== */

import { formatMontant } from "./marches";
import type { Langue } from "./langue";

export type Devise = "USD" | "EUR" | "GBP";
export const DEVISES: Devise[] = ["USD", "EUR", "GBP"];

export interface Palier {
  nom: string;
  creditsMensuels: number;
  /** Prix mensuel sans engagement, identique en $, € et £. */
  prix: number;
  cible: Record<Langue, string>;
  avantages: Record<Langue, string[]>;
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
    nom: "Starter",
    creditsMensuels: 45,
    prix: 19,
    cible: { fr: "Pour tester des produits en solo", en: "For testing products on your own" },
    avantages: {
      fr: [
        "15 analyses vidéo par mois",
        "Rapport complet : script, angles, sourcing, rentabilité",
        "Annonces Meta prêtes à coller, variante B incluse",
        "6 marchés : US, UK, Europe, France, Australie, Algérie",
      ],
      en: [
        "15 video analyses per month",
        "Full report: script, angles, sourcing, profitability",
        "Ready-to-paste Meta ads, variant B included",
        "6 markets: US, UK, Europe, France, Australia, Algeria",
      ],
    },
  },
  {
    nom: "Pro",
    creditsMensuels: 150,
    prix: 49,
    populaire: true,
    cible: { fr: "Pour un e-commerçant qui scale", en: "For a store that is scaling" },
    avantages: {
      fr: [
        "50 analyses vidéo par mois",
        "Tout le Starter",
        "Plusieurs analyses lancées à la suite",
        "Support prioritaire par email",
      ],
      en: [
        "50 video analyses per month",
        "Everything in Starter",
        "Queue several analyses in a row",
        "Priority email support",
      ],
    },
  },
  {
    nom: "Agency",
    creditsMensuels: 420,
    prix: 129,
    cible: { fr: "Pour les media buyers et agences", en: "For media buyers and agencies" },
    avantages: {
      fr: [
        "140 analyses vidéo par mois",
        "Tout le Pro",
        "Un compte utilisable par toute ton équipe",
        "Onboarding personnalisé",
      ],
      en: [
        "140 video analyses per month",
        "Everything in Pro",
        "One account for your whole team",
        "Personal onboarding",
      ],
    },
  },
];

/** Mensuel ou annuel : les deux choix que tout le monde comprend. */
export const ENGAGEMENTS = [
  { mois: 1, libelle: { fr: "Mensuel", en: "Monthly" }, remise: 0 },
  { mois: 12, libelle: { fr: "Annuel", en: "Yearly" }, remise: 0.2 },
] as const;

/** Prix mensuel d'un palier, remise d'engagement comprise (arrondi a l'unite). */
export function prixPalier(p: Palier, remise: number): number {
  return Math.round(p.prix * (1 - remise));
}

/** Montant total paye d'avance pour la duree d'engagement. */
export function totalPalier(p: Palier, remise: number, mois: number): number {
  return prixPalier(p, remise) * mois;
}

/**
 * Recharges ponctuelles, quand les credits du mois sont epuises.
 * Volontairement plus cheres au credit que l'abonnement : la recharge depanne,
 * elle ne doit pas devenir une facon de contourner l'abonnement.
 */
export const RECHARGES = [
  { credits: 15, prix: 9, libelle: { fr: "Dépannage", en: "Quick top-up" } },
  { credits: 45, prix: 24, libelle: { fr: "Le plus pris", en: "Most popular" }, populaire: true },
  { credits: 120, prix: 55, libelle: { fr: "Grosse campagne", en: "Big campaign" } },
] as const;

export type Recharge = (typeof RECHARGES)[number];

/** "19 $", "$19", "19 €", "£19" selon la devise et la langue. */
export function formatPrix(montant: number, devise: Devise, langue: Langue = "fr"): string {
  return formatMontant(montant, devise, langue);
}

/** Prix d'un credit, pour comparer les formules entre elles. */
export function formatPrixCredit(montant: number, credits: number, devise: Devise, langue: Langue = "fr"): string {
  const unitaire = Math.round((montant / credits) * 100) / 100;
  return formatMontant(unitaire, devise, langue);
}

/** Nombre d'analyses video que permet un volume de credits. */
export function videosPour(credits: number): number {
  return Math.floor(credits / COUT_CREDITS.video);
}

/** Prix d'entree affiche en accroche : le moins cher, a la meilleure remise. */
export function prixPlancher(): number {
  const remiseMax = Math.max(...ENGAGEMENTS.map((e) => e.remise));
  return Math.min(...PALIERS.map((p) => prixPalier(p, remiseMax)));
}
