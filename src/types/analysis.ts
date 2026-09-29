/* ============================================================================
   Contrat de donnees partage entre le pipeline serveur et l'interface.
   Les champs marques "IA" sont produits par Claude via tool-use structure.
   ========================================================================== */

export type Platform = "tiktok" | "instagram" | "facebook" | "youtube" | "fichier" | "image" | "autre";

/**
 * Origine de la video a analyser. Le pipeline ne connait que cette union :
 * une fois le fichier sur disque, toutes les etapes suivantes sont identiques.
 */
export type SourceEntree =
  | { type: "url"; url: string }
  | { type: "fichier"; cheminTemporaire: string; nomOriginal: string; taille: number };

export type JobStatus = "en_attente" | "en_cours" | "termine" | "erreur";

export type StepId =
  | "acquisition"
  | "media"
  | "transcription"
  | "analyse_creative"
  | "sourcing_dz"
  | "finalisation";

export interface JobStep {
  id: StepId;
  label: string;
  status: "attente" | "en_cours" | "ok" | "echec" | "ignore";
  detail?: string;
  startedAt?: number;
  endedAt?: number;
}

export interface Job {
  id: string;
  /** URL d'origine, ou nom du fichier depose. */
  url: string;
  /** Distingue une analyse par lien d'une analyse par fichier depose. */
  origine: "url" | "fichier";
  status: JobStatus;
  steps: JobStep[];
  createdAt: number;
  updatedAt: number;
  error?: string;
  /**
   * true quand l'echec vient de la recuperation de la video depuis la
   * plateforme : l'interface propose alors de deposer le fichier a la place.
   */
  echecTelechargement?: boolean;
  /** Renseigne des que le rapport est ecrit sur disque. */
  reportReady?: boolean;
  /** Compte abonne qui a lance l'analyse ; absent quand c'est le proprietaire. */
  proprietaireId?: string;
  /** Langue de l'interface au lancement : libelles de progression. */
  langue?: import("@/lib/langue").Langue;
}

/* --------------------------------------------------------------- Ingestion */

export interface SourceMeta {
  platform: Platform;
  url: string;
  id?: string;
  titre?: string;
  description?: string;
  auteur?: string;
  auteurUrl?: string;
  datePublication?: string;
  dureeSecondes: number;
  largeur?: number;
  hauteur?: number;
  fps?: number;
  vues?: number;
  likes?: number;
  commentaires?: number;
  partages?: number;
  hashtags: string[];
  musique?: string;
  miniature?: string;
  /** true pour une creative statique (image publicitaire, pas une video). */
  estStatique?: boolean;
}

export interface Frame {
  /** Nom de fichier relatif au dossier de l'analyse, ex "frames/f003.jpg". */
  file: string;
  /** Position dans la video, en secondes. */
  t: number;
  /** true si la frame vient d'un changement de plan detecte. */
  coupe: boolean;
}

export interface MediaAssets {
  video?: string;
  audio?: string;
  frames: Frame[];
  /** Timestamps des changements de plan detectes par ffmpeg. */
  coupes: number[];
}

export interface TranscriptSegment {
  start: number;
  end: number;
  texte: string;
}

export interface Transcript {
  source: "sous-titres" | "whisper-local" | "groq" | "openai" | "vision" | "aucune";
  langue?: string;
  texte: string;
  segments: TranscriptSegment[];
  note?: string;
}

/* ------------------------------------------------- Analyse creative (IA #1) */

export interface ProduitIdentifie {
  nom_fr: string;
  nom_en: string;
  nom_ar: string;
  categorie: string;
  description: string;
  caracteristiques: string[];
  variantes: string[];
  materiaux_supposes: string[];
  poids_estime_g: number;
  fragile: boolean;
  saisonnalite: string;
  confiance: number;
}

export interface ScriptSegment {
  start: number;
  end: number;
  texte: string;
  type: "voix_off" | "texte_ecran" | "dialogue" | "son_ambiant";
}

export interface ScriptExtrait {
  langue_detectee: string;
  texte_complet: string;
  segments: ScriptSegment[];
  /** Traduction francaise si le script est en arabe/darija/anglais/chinois. */
  traduction_fr?: string;
}

export interface SequenceCle {
  start: number;
  end: number;
  titre: string;
  role:
    | "hook"
    | "probleme"
    | "agitation"
    | "solution"
    | "demonstration"
    | "preuve_sociale"
    | "benefice"
    | "offre"
    | "cta"
    | "autre";
  description: string;
  elements_visuels: string[];
  texte_ecran: string;
  pourquoi_ca_marche: string;
}

export interface Hook {
  texte: string;
  duree_s: number;
  type: string;
  force_sur_10: number;
  analyse: string;
  variantes_proposees: string[];
}

export interface AngleMarketing {
  nom: string;
  angle: string;
  emotion_ciblee: string;
  promesse: string;
  preuve_utilisee: string;
  public_cible: string;
  score_sur_10: number;
  pertinence_dz: string;
}

export interface MotsCles {
  produit: string[];
  emotionnels: string[];
  hashtags: string[];
  seo_fr: string[];
  seo_ar: string[];
  ciblage_pub: string[];
}

export interface AnalyseAudio {
  presence_voix: boolean;
  type_voix: string;
  type_musique: string;
  ambiance: string;
  rythme: string;
  role_du_son: string;
}

export interface StructureCreative {
  duree_totale: number;
  nb_plans_estime: number;
  rythme_coupe: string;
  format: string;
  style_tournage: string;
  ugc_ou_pro: "ugc" | "semi_pro" | "pro";
  sous_titres_brules: boolean;
  points_de_retention: string[];
  points_de_decrochage: string[];
}

export interface CreativeAnalysis {
  produit: ProduitIdentifie;
  script: ScriptExtrait;
  sequences: SequenceCle[];
  hook: Hook;
  angles_marketing: AngleMarketing[];
  mots_cles: MotsCles;
  audio: AnalyseAudio;
  structure: StructureCreative;
  resume_executif: string;
  ce_qui_marche: string[];
  ce_qui_manque: string[];
}

/* --------------------------------------- Sourcing + pack Algerie (IA #2) */

export interface RequetesSourcing {
  en: string[];
  zh: string[];
  /** Synonymes/appellations chinoises alternatives du produit. */
  alias_zh: string[];
}

export interface LienSourcing {
  plateforme: "Alibaba" | "1688" | "AliExpress" | "Taobao" | "Made-in-China" | "Google Images";
  label: string;
  url: string;
  langue: "en" | "zh";
}

export interface EstimationPrix {
  prix_achat_unitaire_usd_min: number;
  prix_achat_unitaire_usd_max: number;
  moq_estime: number;
  frais_port_unitaire_usd_min: number;
  frais_port_unitaire_usd_max: number;
  prix_vente_dz_dzd_min: number;
  prix_vente_dz_dzd_max: number;
  hypotheses: string[];
  fiabilite: "faible" | "moyenne" | "bonne";
}

export interface Sourcing {
  requetes: RequetesSourcing;
  liens: LienSourcing[];
  estimation: EstimationPrix;
  conseils_negociation: string[];
  risques_import: string[];
}

export interface ScoreDZ {
  global_sur_100: number;
  demande: number;
  concurrence: number;
  marge: number;
  logistique: number;
  facilite_creative: number;
  verdict: string;
  justification: string;
}

export interface CopyLanding {
  titre: string;
  sous_titre: string;
  bullets: string[];
  offre: string;
  garantie: string;
  faq: { question: string; reponse: string }[];
  cta: string;
}

export interface AnnoncePub {
  plateforme: "facebook" | "tiktok" | "instagram";
  accroche: string;
  texte: string;
  cta: string;
  angle_utilise: string;
}

/**
 * Jeu d'annonce au format exact du gestionnaire de publicites Meta.
 * Les trois champs correspondent aux trois zones de saisie de l'interface :
 * texte principal, titre, description. Les longueurs suivent les limites
 * d'affichage de Meta pour eviter la troncature.
 */
export interface MetaAd {
  nom_variante: string;
  angle_utilise: string;
  /** Primary text — corps de l'annonce, coupe vers 125 caracteres. */
  texte_principal: string;
  /** Headline — titre affiche sous l'image, environ 40 caracteres. */
  titre: string;
  /** Description — ligne secondaire, environ 30 caracteres. */
  description: string;
  /** Libelle du bouton Meta : Acheter, En savoir plus, Envoyer un message... */
  bouton_cta: string;
  /** Version arabe algerienne du meme jeu, prete a coller. */
  texte_principal_ar: string;
  titre_ar: string;
  description_ar: string;
}

/**
 * Piste de video reutilisable pour le montage. L'application ne peut pas
 * garantir qu'une video precise existe : elle fournit la requete exacte et le
 * lien de recherche qui menent aux videos du produit, en privilegiant les
 * sources ou le produit apparait a l'identique.
 */
export interface PisteVideo {
  source:
    | "1688"
    | "AliExpress"
    | "Alibaba"
    | "TikTok"
    | "Instagram"
    | "YouTube Shorts"
    | "Pinterest"
    | "Banque libre";
  titre: string;
  /** Requete a coller telle quelle dans la recherche de la plateforme. */
  requete: string;
  /** Ce qu'on y trouve concretement. */
  contenu: string;
  /** Comment l'utiliser dans le montage. */
  usage: string;
  /** true si le produit y apparait a l'identique, false pour un plan d'ambiance. */
  produit_identique: boolean;
  /** true si les videos y sont generalement sans texte incruste. */
  sans_texte: boolean;
}

export interface IdeeCreative {
  titre: string;
  hook: string;
  deroule: string[];
  materiel_necessaire: string;
  difficulte: "facile" | "moyenne" | "difficile";
}

export interface CiblageDZ {
  wilayas_prioritaires: string[];
  tranche_age: string;
  genre: string;
  interets: string[];
  moments_de_diffusion: string[];
  budget_test_conseille_dzd: number;
}

export interface PackDZ {
  score: ScoreDZ;
  script_darija: { texte: string; notes: string[] };
  angles_pub_dz: AngleMarketing[];
  copy_landing_fr: CopyLanding;
  copy_landing_ar: CopyLanding;
  annonces: AnnoncePub[];
  objections: { objection: string; reponse: string }[];
  ciblage: CiblageDZ;
  idees_creatives: IdeeCreative[];
  concurrence_dz: string[];
  risques: string[];
  plan_de_lancement: string[];
  /** Annonces pretes a coller dans le gestionnaire de publicites Meta. */
  meta_ads: MetaAd[];
  /** Pistes de videos reutilisables pour monter sa propre creative. */
  banque_videos: PisteVideo[];
}

/* ------------------------------------------------------ Calculs deterministes */

export interface RentabiliteCOD {
  /** Parametres d'entree, modifiables depuis l'interface. */
  params: import("@/lib/dz").ParamsCOD;
  /** Resultats pour 100 commandes confirmees. */
  resultats: {
    cout_revient_unitaire_dzd: number;
    /** Prospects a generer pour obtenir 100 commandes confirmees. */
    leads_necessaires: number;
    commandes_livrees: number;
    commandes_retournees: number;
    ca_dzd: number;
    cout_marchandise_dzd: number;
    cout_livraison_dzd: number;
    cout_retours_dzd: number;
    cout_emballage_dzd: number;
    cout_confirmation_dzd: number;
    cout_plateforme_dzd: number;
    cout_production_dzd: number;
    cout_pub_dzd: number;
    profit_net_dzd: number;
    profit_par_commande_dzd: number;
    marge_pct: number;
    seuil_rentabilite_taux_livraison: number;
    cpa_max_dzd: number;
  };
};

/* ------------------------------------------------------------- Rapport final */

export interface Report {
  id: string;
  version: number;
  createdAt: number;
  url: string;
  source: SourceMeta;
  media: MediaAssets;
  transcript: Transcript;
  creative: CreativeAnalysis;
  sourcing: Sourcing;
  dz: PackDZ;
  rentabilite: RentabiliteCOD;
  /** Diagnostics du pipeline : etapes degradees, avertissements. */
  avertissements: string[];
  cout_ia?: { input_tokens: number; output_tokens: number; usd_estime: number };
  /**
   * Compte abonne qui a commande l'analyse. Absent quand c'est le
   * proprietaire : le rapport n'est alors visible que de l'administration.
   */
  proprietaireId?: string;
  /** Choisi par l'administration : l'analyse sert d'exemple aux visiteurs. */
  demo?: boolean;
  /** Marche vise par le dossier de lancement. Absent = Algerie (rapports anciens). */
  marche?: import("@/lib/marches").MarcheId;
  /** Langue dans laquelle l'analyse a ete redigee. Absent = francais. */
  langue?: import("@/lib/langue").Langue;
}

/** Une ligne de la page de diagnostic de l'installation. */
export interface Verification {
  nom: string;
  ok: boolean;
  detail: string;
  correction?: string;
}

export interface ReportSummary {
  id: string;
  createdAt: number;
  url: string;
  platform: Platform;
  titre: string;
  produit: string;
  miniature?: string;
  score: number;
  proprietaireId?: string;
  demo?: boolean;
  marche?: import("@/lib/marches").MarcheId;
}
