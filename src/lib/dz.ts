import type { EstimationPrix, RentabiliteCOD } from "@/types/analysis";

/* ============================================================================
   Constantes du marche algerien.

   Ordres de grandeur observes en 2025-2026, pas des tarifs officiels. Ils sont
   ajustables depuis l'interface, et modifiables ici pour changer les valeurs
   par defaut de toutes les analyses.
   ========================================================================== */

export const MARCHE_DZ = {
  /** Livraison a domicile, moyenne nord/centre du pays, en DZD. */
  livraisonDomicile: 700,
  /** Livraison en point relais (stopdesk), en DZD. */
  livraisonStopdesk: 450,
  /** Part des commandes livrees en stopdesk. */
  partStopdesk: 0.5,
  /**
   * Part des prospects qui confirment par telephone. Le reste ne repond pas,
   * annule, ou donne un faux numero — et la publicite est deja payee.
   */
  tauxConfirmation: 0.75,
  /** Part des commandes confirmees qui aboutissent a une livraison payee. */
  tauxLivraison: 0.65,
  /** Cout d'un colis retourne : transport aller perdu + frais de retour. */
  coutRetour: 350,
  /** Cout publicitaire pour obtenir un prospect (formulaire rempli), en DZD. */
  coutParLead: 450,
  /** Appels de confirmation : credit telephonique, temps ou agent, par prospect. */
  coutConfirmation: 40,
  /** Emballage et preparation, par colis expedie. */
  fraisEmballage: 60,
  /** Casse, invendus et retours abimes, en part du stock. */
  tauxCasse: 0.04,
  /** Droits de douane et dedouanement, en part de la valeur importee. */
  tauxDouane: 0.3,
  /** Transit et acheminement local depuis le port, par unite. */
  fraisTransit: 40,
  /** Commission des plateformes de vente COD (Youcan, Shopify...), en part du CA. */
  tauxPlateforme: 0,
} as const;

/** Cout indicatif de production d'une creative, en DZD. */
export const COUTS_PRODUCTION = {
  soiMeme: 0,
  ugcDebutant: 3000,
  ugcConfirme: 8000,
  studio: 20000,
} as const;

export const WILAYAS_SURCOUT = [
  "Adrar",
  "Tamanrasset",
  "Illizi",
  "Tindouf",
  "Bechar",
  "Djanet",
  "In Salah",
  "In Guezzam",
  "Bordj Badji Mokhtar",
  "Timimoun",
  "Ouled Djellal",
  "Beni Abbes",
  "El Meniaa",
];

/* -------------------------------------------------------------- calculs */

export type ModeApprovisionnement = "import" | "local";

export interface ParamsCOD {
  /* --- Approvisionnement --- */
  mode_approvisionnement: ModeApprovisionnement;
  /** Import : prix fournisseur en USD. */
  cout_produit_usd: number;
  fret_unitaire_usd: number;
  taux_change: number;
  taux_douane_pct: number;
  frais_transit_dzd: number;
  /** Achat local : prix chez le grossiste algerien, en DZD. */
  prix_achat_local_dzd: number;
  taux_casse_pct: number;

  /* --- Vente --- */
  prix_vente_dzd: number;
  taux_plateforme_pct: number;

  /* --- Logistique --- */
  frais_livraison_dzd: number;
  part_stopdesk: number;
  taux_confirmation: number;
  taux_livraison: number;
  cout_retour_dzd: number;
  frais_emballage_dzd: number;

  /* --- Acquisition et production --- */
  cout_par_lead_dzd: number;
  cout_confirmation_dzd: number;
  /** Budget total de production des creatives (tournage, UGC, montage). */
  cout_production_creatives_dzd: number;
  /** Nombre de commandes sur lequel ce budget est amorti. */
  commandes_amortissement: number;
}

const round = (n: number) => Math.round(n * 100) / 100;

/** Prix de revient d'une unite rendue en Algerie, selon le mode d'approvisionnement. */
export function coutRevientUnitaire(p: ParamsCOD): number {
  if (p.mode_approvisionnement === "local") {
    return p.prix_achat_local_dzd * (1 + p.taux_casse_pct);
  }
  const valeurDevise = (p.cout_produit_usd + p.fret_unitaire_usd) * p.taux_change;
  const avecDouane = valeurDevise * (1 + p.taux_douane_pct);
  return (avecDouane + p.frais_transit_dzd) * (1 + p.taux_casse_pct);
}

/**
 * Rentabilite d'une operation COD, sur une base de 100 commandes CONFIRMEES.
 *
 * La chaine reelle est : prospects -> confirmation telephonique -> livraison.
 * Une partie de la publicite est donc payee pour des prospects qui ne
 * confirmeront jamais : c'est ce que le taux de confirmation capture, et
 * c'est ce qui manquait au calcul precedent.
 *
 * Les colis retournes reviennent en stock : leur marchandise n'est pas perdue,
 * seuls le transport aller-retour et la casse le sont.
 */
export function calculerRentabilite(params: ParamsCOD): RentabiliteCOD {
  const BASE = 100;

  const coutRevient = coutRevientUnitaire(params);

  // Il faut plus de 100 prospects pour obtenir 100 commandes confirmees.
  const confirmation = Math.max(0.05, Math.min(1, params.taux_confirmation));
  const leads = BASE / confirmation;

  const livrees = BASE * params.taux_livraison;
  const retournees = BASE - livrees;

  const ca = livrees * params.prix_vente_dzd;
  const coutMarchandise = livrees * coutRevient;
  const coutLivraison = livrees * params.frais_livraison_dzd;
  const coutRetours = retournees * params.cout_retour_dzd;
  const coutEmballage = BASE * params.frais_emballage_dzd; // on emballe tout ce qu'on expedie
  const coutPub = leads * params.cout_par_lead_dzd;
  const coutConfirmation = leads * params.cout_confirmation_dzd;
  const coutPlateforme = ca * params.taux_plateforme_pct;

  // La production des creatives est un investissement ponctuel : on l'amortit.
  const amortissement = Math.max(1, params.commandes_amortissement);
  const coutProduction = (params.cout_production_creatives_dzd / amortissement) * BASE;

  const profit =
    ca -
    coutMarchandise -
    coutLivraison -
    coutRetours -
    coutEmballage -
    coutPub -
    coutConfirmation -
    coutPlateforme -
    coutProduction;

  // Marge d'une commande livree, hors acquisition et hors retours.
  const margeUnitaire =
    params.prix_vente_dzd * (1 - params.taux_plateforme_pct) -
    coutRevient -
    params.frais_livraison_dzd;

  // Cout d'acquisition et de traitement rapporte a une commande confirmee.
  const coutParCommandeConfirmee =
    (coutPub + coutConfirmation + coutEmballage + coutProduction) / BASE;

  // Taux de livraison a partir duquel l'operation devient rentable.
  const denominateur = margeUnitaire + params.cout_retour_dzd;
  const seuil =
    denominateur > 0
      ? (params.cout_retour_dzd + coutParCommandeConfirmee) / denominateur
      : Number.POSITIVE_INFINITY;

  // Budget publicitaire maximum par prospect avant de perdre de l'argent.
  const margeAvantPub =
    params.taux_livraison * margeUnitaire -
    (1 - params.taux_livraison) * params.cout_retour_dzd -
    params.frais_emballage_dzd -
    params.cout_confirmation_dzd / confirmation -
    coutProduction / BASE;
  const cpaMax = margeAvantPub * confirmation;

  return {
    params,
    resultats: {
      cout_revient_unitaire_dzd: round(coutRevient),
      leads_necessaires: round(leads),
      commandes_livrees: round(livrees),
      commandes_retournees: round(retournees),
      ca_dzd: round(ca),
      cout_marchandise_dzd: round(coutMarchandise),
      cout_livraison_dzd: round(coutLivraison),
      cout_retours_dzd: round(coutRetours),
      cout_emballage_dzd: round(coutEmballage),
      cout_confirmation_dzd: round(coutConfirmation),
      cout_plateforme_dzd: round(coutPlateforme),
      cout_production_dzd: round(coutProduction),
      cout_pub_dzd: round(coutPub),
      profit_net_dzd: round(profit),
      profit_par_commande_dzd: round(profit / BASE),
      marge_pct: ca > 0 ? round((profit / ca) * 100) : 0,
      seuil_rentabilite_taux_livraison: Number.isFinite(seuil) ? round(Math.min(seuil, 1.5)) : 999,
      cpa_max_dzd: round(cpaMax),
    },
  };
}

/** Parametres de depart deduits de l'estimation de prix produite par Claude. */
export function paramsParDefaut(estimation: EstimationPrix, tauxChange: number): ParamsCOD {
  const moyenne = (a: number, b: number) => (Number(a) + Number(b)) / 2;

  const prixVente = Math.round(
    moyenne(estimation.prix_vente_dz_dzd_min, estimation.prix_vente_dz_dzd_max),
  );
  const coutProduit = moyenne(
    estimation.prix_achat_unitaire_usd_min,
    estimation.prix_achat_unitaire_usd_max,
  );
  const fret = moyenne(
    estimation.frais_port_unitaire_usd_min,
    estimation.frais_port_unitaire_usd_max,
  );

  const fraisLivraison = Math.round(
    MARCHE_DZ.livraisonStopdesk * MARCHE_DZ.partStopdesk +
      MARCHE_DZ.livraisonDomicile * (1 - MARCHE_DZ.partStopdesk),
  );

  const coutUsd = Number.isFinite(coutProduit) && coutProduit > 0 ? round(coutProduit) : 3;
  const fretUsd = Number.isFinite(fret) && fret >= 0 ? round(fret) : 1.5;

  return {
    mode_approvisionnement: "import",
    cout_produit_usd: coutUsd,
    fret_unitaire_usd: fretUsd,
    taux_change: tauxChange,
    taux_douane_pct: MARCHE_DZ.tauxDouane,
    frais_transit_dzd: MARCHE_DZ.fraisTransit,
    // Repli local : un grossiste algerien revend autour du double du prix rendu.
    prix_achat_local_dzd: Math.round((coutUsd + fretUsd) * tauxChange * 2),
    taux_casse_pct: MARCHE_DZ.tauxCasse,

    prix_vente_dzd: Number.isFinite(prixVente) && prixVente > 0 ? prixVente : 3500,
    taux_plateforme_pct: MARCHE_DZ.tauxPlateforme,

    frais_livraison_dzd: fraisLivraison,
    part_stopdesk: MARCHE_DZ.partStopdesk,
    taux_confirmation: MARCHE_DZ.tauxConfirmation,
    taux_livraison: MARCHE_DZ.tauxLivraison,
    cout_retour_dzd: MARCHE_DZ.coutRetour,
    frais_emballage_dzd: MARCHE_DZ.fraisEmballage,

    cout_par_lead_dzd: MARCHE_DZ.coutParLead,
    cout_confirmation_dzd: MARCHE_DZ.coutConfirmation,
    cout_production_creatives_dzd: COUTS_PRODUCTION.ugcDebutant,
    commandes_amortissement: 100,
  };
}

/**
 * Complete les parametres d'un rapport ancien avec les champs ajoutes depuis.
 * Sans cela, un rapport produit avant cette version afficherait des NaN.
 */
export function normaliserParams(params: Partial<ParamsCOD>, tauxChange = 252): ParamsCOD {
  const nombre = (v: unknown, defaut: number) =>
    typeof v === "number" && Number.isFinite(v) ? v : defaut;

  const coutUsd = nombre(params.cout_produit_usd, 3);
  const fretUsd = nombre(params.fret_unitaire_usd, 1.5);
  const change = nombre(params.taux_change, tauxChange);

  return {
    mode_approvisionnement: params.mode_approvisionnement === "local" ? "local" : "import",
    cout_produit_usd: coutUsd,
    fret_unitaire_usd: fretUsd,
    taux_change: change,
    taux_douane_pct: nombre(params.taux_douane_pct, MARCHE_DZ.tauxDouane),
    frais_transit_dzd: nombre(params.frais_transit_dzd, MARCHE_DZ.fraisTransit),
    prix_achat_local_dzd: nombre(
      params.prix_achat_local_dzd,
      Math.round((coutUsd + fretUsd) * change * 2),
    ),
    taux_casse_pct: nombre(params.taux_casse_pct, MARCHE_DZ.tauxCasse),

    prix_vente_dzd: nombre(params.prix_vente_dzd, 3500),
    taux_plateforme_pct: nombre(params.taux_plateforme_pct, MARCHE_DZ.tauxPlateforme),

    frais_livraison_dzd: nombre(params.frais_livraison_dzd, 575),
    part_stopdesk: nombre(params.part_stopdesk, MARCHE_DZ.partStopdesk),
    taux_confirmation: nombre(params.taux_confirmation, MARCHE_DZ.tauxConfirmation),
    taux_livraison: nombre(params.taux_livraison, MARCHE_DZ.tauxLivraison),
    cout_retour_dzd: nombre(params.cout_retour_dzd, MARCHE_DZ.coutRetour),
    frais_emballage_dzd: nombre(
      params.frais_emballage_dzd,
      // L'ancien modele nommait ce poste "frais divers".
      nombre((params as Record<string, unknown>).frais_divers_dzd as number, MARCHE_DZ.fraisEmballage),
    ),

    cout_par_lead_dzd: nombre(
      params.cout_par_lead_dzd,
      // L'ancien modele comptait la pub par commande confirmee.
      Math.round(
        nombre((params as Record<string, unknown>).cout_pub_par_commande_dzd as number, MARCHE_DZ.coutParLead) *
          MARCHE_DZ.tauxConfirmation,
      ),
    ),
    cout_confirmation_dzd: nombre(params.cout_confirmation_dzd, MARCHE_DZ.coutConfirmation),
    cout_production_creatives_dzd: nombre(
      params.cout_production_creatives_dzd,
      COUTS_PRODUCTION.ugcDebutant,
    ),
    commandes_amortissement: nombre(params.commandes_amortissement, 100),
  };
}

export function formatDZD(n: number): string {
  return `${Math.round(n).toLocaleString("fr-FR")} DA`;
}

export function formatUSD(n: number): string {
  return `${n.toFixed(2)} $`;
}
