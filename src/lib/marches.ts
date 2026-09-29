import { locale, type Langue } from "./langue";

/* ============================================================================
   Marches cibles.

   Une meme creative ne se lance pas de la meme facon a Alger et a Chicago :
   paiement a la livraison ou carte bancaire, devise, langue des annonces,
   taxes a l'import, delais, regles publicitaires. Chaque analyse est faite
   POUR un marche : c'est lui qui oriente le dossier de lancement produit
   par l'IA et les parametres de depart du calcul de rentabilite.

   Les montants par defaut sont des ordres de grandeur observes, pas des
   tarifs officiels : tout est ajustable dans l'onglet Rentabilite.
   ========================================================================== */

export type MarcheId = "us" | "uk" | "fr" | "eu" | "au" | "dz";
export type DeviseMarche = "USD" | "GBP" | "EUR" | "AUD" | "DZD";
export type ModelePaiement = "prepaye" | "cod";

export interface Marche {
  id: MarcheId;
  drapeau: string;
  nom: Record<Langue, string>;
  devise: DeviseMarche;
  modele: ModelePaiement;
  /** Langue dans laquelle l'IA ecrit les annonces et la page de vente. */
  langueAnnonces: Record<Langue, string>;
  /** Consigne de langue donnee au modele pour les textes publicitaires. */
  consigneLangueAnnonces: string;
  /**
   * Libelle de la seconde version des textes de vente : l'arabe algerien
   * pour l'Algerie, une variante B (test A/B) partout ailleurs.
   */
  secondeVersion: Record<Langue, string>;
  /** Comment on appelle les zones de ciblage : wilayas, Etats, regions... */
  regions: Record<Langue, string>;
  /** Contexte transmis au modele pour ancrer le dossier dans la realite du marche. */
  contexte: string;
}

export const MARCHES: Marche[] = [
  {
    id: "us",
    drapeau: "🇺🇸",
    nom: { fr: "États-Unis", en: "United States" },
    devise: "USD",
    modele: "prepaye",
    langueAnnonces: { fr: "anglais américain", en: "American English" },
    consigneLangueAnnonces: "American English (US spelling, US idioms, prices in $)",
    secondeVersion: { fr: "Variante B", en: "Variant B" },
    regions: { fr: "États et villes", en: "States and cities" },
    contexte: `- Prepaid e-commerce: card, PayPal, Shop Pay, Apple Pay. Cash on delivery practically does not exist.
- Traffic: Meta (Facebook/Instagram), TikTok, YouTube Shorts; Google Shopping for search demand.
- Since the end of the de minimis exemption (2025), goods shipped from China pay import duties and fees: include them in the landed cost.
- Shoppers expect 5 to 10 day delivery; a US warehouse (3PL) converts noticeably better than 2-3 week shipping from China.
- Refunds, lost parcels and chargebacks typically cost 3 to 6 % of orders.
- FTC rules: no unsubstantiated health, weight-loss or income claims; testimonials must be genuine.
- Typical retail price: 2.5 to 4 times the landed cost; free-shipping thresholds are common.`,
  },
  {
    id: "uk",
    drapeau: "🇬🇧",
    nom: { fr: "Royaume-Uni", en: "United Kingdom" },
    devise: "GBP",
    modele: "prepaye",
    langueAnnonces: { fr: "anglais britannique", en: "British English" },
    consigneLangueAnnonces: "British English (UK spelling: colour, favourite; prices in £)",
    secondeVersion: { fr: "Variante B", en: "Variant B" },
    regions: { fr: "Régions et villes", en: "Regions and cities" },
    contexte: `- Prepaid e-commerce: card, PayPal, Apple Pay, Klarna. No cash on delivery.
- Traffic: Meta, TikTok, YouTube; Google Shopping.
- 20 % VAT applies to goods imported for consumers (collected by the seller under £135): include it in the landed cost.
- Carriers: Royal Mail, Evri, DPD. Shoppers expect 2 to 7 day delivery.
- Consumer Contracts Regulations: 14-day right to cancel online purchases.
- ASA/CAP advertising code: claims must be substantiated; no misleading scarcity.
- Refunds and returns typically cost 4 to 8 % of orders.`,
  },
  {
    id: "fr",
    drapeau: "🇫🇷",
    nom: { fr: "France & Belgique", en: "France & Belgium" },
    devise: "EUR",
    modele: "prepaye",
    langueAnnonces: { fr: "français", en: "French" },
    consigneLangueAnnonces: "français de France, correct et entièrement accentué (prix en €)",
    secondeVersion: { fr: "Variante B", en: "Variant B" },
    regions: { fr: "Régions et villes", en: "Regions and cities" },
    contexte: `- Prepaid e-commerce: bank card (CB), PayPal, Apple Pay, split payment (Alma, Klarna). Cash on delivery is marginal.
- Traffic: Meta, TikTok, Snapchat among under-25s; Google Shopping.
- EU VAT (20 % in France, 21 % in Belgium) is due on imports through the IOSS scheme: include it in the landed cost.
- Carriers: Colissimo, Mondial Relay (pick-up points are very popular), Chronopost, bpost.
- EU consumer law: 14-day right of withdrawal; 2-year legal guarantee of conformity.
- French shoppers are wary of dropshipping: long delays and vague product pages kill conversion. Show a real business, clear delivery times and easy returns.
- Refunds and returns typically cost 5 to 10 % of orders.`,
  },
  {
    id: "eu",
    drapeau: "🇪🇺",
    nom: { fr: "Europe (autres pays)", en: "Europe (other countries)" },
    devise: "EUR",
    modele: "prepaye",
    langueAnnonces: { fr: "anglais international", en: "International English" },
    consigneLangueAnnonces:
      "clear international English that works across Germany, the Netherlands, Scandinavia, Spain and Italy (prices in €)",
    secondeVersion: { fr: "Variante B", en: "Variant B" },
    regions: { fr: "Pays à cibler", en: "Countries to target" },
    contexte: `- Prepaid e-commerce: cards, PayPal, and local methods (iDEAL in the Netherlands, Klarna in Germany and the Nordics, Bizum in Spain).
- Traffic: Meta, TikTok, YouTube; Google Shopping. Each country prefers ads in its own language: English works as a first test, localisation scales.
- EU VAT (19 to 25 % depending on the country) is due on imports through IOSS: include it in the landed cost.
- EU consumer law: 14-day right of withdrawal; 2-year legal guarantee.
- Germany and the Nordics have high return rates for apparel; electronics need CE marking.
- Refunds and returns typically cost 5 to 12 % of orders.`,
  },
  {
    id: "au",
    drapeau: "🇦🇺",
    nom: { fr: "Australie", en: "Australia" },
    devise: "AUD",
    modele: "prepaye",
    langueAnnonces: { fr: "anglais australien", en: "Australian English" },
    consigneLangueAnnonces: "Australian English (UK spelling, relaxed and direct tone, prices in A$)",
    secondeVersion: { fr: "Variante B", en: "Variant B" },
    regions: { fr: "États et villes", en: "States and cities" },
    contexte: `- Prepaid e-commerce: card, PayPal, Afterpay (buy now, pay later is very widespread), Apple Pay.
- Traffic: Meta, TikTok, YouTube.
- 10 % GST applies to low-value imported goods (collected by the seller): include it in the landed cost.
- Shipping from China takes 10 to 20 days; an Australian warehouse converts much better. Australia Post, Sendle, Aramex.
- Australian Consumer Law (ACCC): guarantees cannot be excluded; no misleading claims.
- Higher average order values than Europe; shoppers are sensitive to long delivery times.
- Refunds and returns typically cost 4 to 8 % of orders.`,
  },
  {
    id: "dz",
    drapeau: "🇩🇿",
    nom: { fr: "Algérie (COD)", en: "Algeria (COD)" },
    devise: "DZD",
    modele: "cod",
    langueAnnonces: { fr: "français et darija", en: "French and Algerian darija" },
    consigneLangueAnnonces:
      "français correct et entièrement accentué pour la version principale ; darija algérienne en caractères arabes pour la seconde version",
    secondeVersion: { fr: "Arabe algérien (darija)", en: "Algerian Arabic (darija)" },
    regions: { fr: "Wilayas prioritaires", en: "Priority wilayas" },
    contexte: `- Le paiement se fait a la livraison (COD). Le taux de livraison reussie tourne autour de 55 a 75 %. Les retours coutent cher : la marge doit absorber les colis non livres.
- La livraison passe par Yalidine, ZR Express, Maystro, Noest. Domicile : environ 500 a 900 DZD. Stopdesk : environ 350 a 600 DZD. Les wilayas du sud coutent nettement plus cher.
- Les importateurs achetent le plus souvent leurs devises au marche parallele (square), autour de 250 DZD pour 1 USD, contre environ 132 DZD au taux officiel. Raisonne au taux parallele et precise-le dans tes hypotheses.
- La communication qui convertit est en darija algerienne, parfois melangee de francais. L'arabe litteraire sonne institutionnel et convertit moins.
- Le trafic vient surtout de Facebook et TikTok. Instagram est secondaire.
- Le client type se mefie de la qualite, veut voir le produit en vrai et veut pouvoir appeler un numero de telephone.`,
  },
];

export const MARCHE_PAR_DEFAUT: MarcheId = "us";

export function estMarche(v: unknown): v is MarcheId {
  return typeof v === "string" && MARCHES.some((m) => m.id === v);
}

export function marche(id: MarcheId | undefined | null): Marche {
  // Les rapports produits avant l'arrivee des marches visaient l'Algerie.
  return MARCHES.find((m) => m.id === (id ?? "dz")) ?? MARCHES[MARCHES.length - 1];
}

/* ------------------------------------------------------------ devises */

/** Taux de change depuis le dollar, reglables sans toucher au code. */
function taux(variable: string, defaut: number): number {
  const n = Number(process.env[variable]);
  return Number.isFinite(n) && n > 0 ? n : defaut;
}

export function tauxDepuisUsd(devise: DeviseMarche): number {
  switch (devise) {
    case "USD":
      return 1;
    case "EUR":
      return taux("USD_TO_EUR", 0.92);
    case "GBP":
      return taux("USD_TO_GBP", 0.79);
    case "AUD":
      return taux("USD_TO_AUD", 1.52);
    case "DZD":
      return taux("USD_TO_DZD_PARALLEL", 252);
  }
}

/** "4 900 DA", "$49", "49 €", "£49", "A$79" selon la devise et la langue. */
export function formatMontant(n: number, devise: DeviseMarche, langue: Langue = "fr"): string {
  if (!Number.isFinite(n)) return "—";
  if (devise === "DZD") return `${Math.round(n).toLocaleString(locale(langue))} DA`;
  const decimales = Math.abs(n) >= 100 || Number.isInteger(n) ? 0 : 2;
  return new Intl.NumberFormat(locale(langue), {
    style: "currency",
    currency: devise,
    // AUD : "A$79" en anglais, "79 $AU" en francais, jamais un "$" ambigu.
    currencyDisplay: devise === "AUD" ? "symbol" : "narrowSymbol",
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  })
    .format(n)
    .replace(/ /g, " ");
}

/**
 * Marche propose par defaut, devine dans le navigateur : fuseau horaire
 * d'abord (ou est la personne), langue ensuite.
 */
export function marcheDevine(fuseau: string, langue: Langue): MarcheId {
  if (fuseau === "Africa/Algiers") return "dz";
  if (fuseau === "Europe/London") return "uk";
  if (fuseau.startsWith("Australia/")) return "au";
  if (fuseau.startsWith("Europe/")) return langue === "fr" ? "fr" : "eu";
  if (fuseau.startsWith("America/")) return "us";
  return langue === "fr" ? "fr" : "us";
}
