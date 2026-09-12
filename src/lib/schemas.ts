/* ============================================================================
   Schemas JSON qui contraignent les sorties de Claude (structured outputs).

   Contraintes de l'API a respecter :
     - chaque objet porte additionalProperties: false
     - `required` liste TOUTES les proprietes
     - pas de minimum/maximum/minLength/maxLength (non supportes)
   Les helpers ci-dessous garantissent ces regles.

   IMPORTANT — pourquoi le rapport est produit en cinq appels et non en un seul.
   L'API compile chaque schema en grammaire, et refuse (400 "compiled grammar is
   too large") au-dela d'une certaine complexite. Mesure faite sur ce projet :
   la limite tient au NOMBRE DE CHAMPS, pas au volume de texte — supprimer
   toutes les descriptions divise le JSON par deux sans rien changer au verdict.
   Les cinq schemas ci-dessous sont chacun sous le seuil ; les regrouper le
   depasse. Ne pas les fusionner sans reverifier.
   ========================================================================== */

type Schema = Record<string, unknown>;

const str = (description: string): Schema => ({ type: "string", description });
const num = (description: string): Schema => ({ type: "number", description });
const bool = (description: string): Schema => ({ type: "boolean", description });
const arr = (items: Schema, description: string): Schema => ({ type: "array", items, description });
const enumStr = (values: string[], description: string): Schema => ({
  type: "string",
  enum: values,
  description,
});

function obj(properties: Record<string, Schema>, description?: string): Schema {
  return {
    type: "object",
    properties,
    required: Object.keys(properties),
    additionalProperties: false,
    ...(description ? { description } : {}),
  };
}

const strList = (description: string) => arr({ type: "string" }, description);

/* --------------------------------------------------- 1. Analyse creative */

const produit = obj(
  {
    nom_fr: str("Nom commercial du produit en francais"),
    nom_en: str("Nom du produit en anglais, tel qu'un fournisseur le nommerait"),
    nom_ar: str("Nom du produit en arabe (dialecte algerien si pertinent)"),
    categorie: str("Categorie e-commerce, ex: cuisine, beaute, auto, bebe, fitness"),
    description: str("Description factuelle du produit en 2 a 3 phrases"),
    caracteristiques: strList("Caracteristiques concretes visibles dans la video"),
    variantes: strList("Variantes visibles ou probables : couleurs, tailles, modeles"),
    materiaux_supposes: strList("Materiaux probables : plastique ABS, inox, silicone..."),
    poids_estime_g: num("Poids unitaire estime en grammes, emballage inclus"),
    fragile: bool("true si le produit casse facilement en livraison"),
    saisonnalite: str("Saisonnalite : toute l'annee, ete, hiver, ramadan, rentree scolaire..."),
    confiance: num("Confiance dans l'identification du produit, de 0 a 1"),
  },
  "Produit identifie dans la creative",
);

const script = obj(
  {
    langue_detectee: str("Langue dominante : darija algerienne, arabe, francais, anglais..."),
    texte_complet: str("Script complet reconstitue : voix off et textes a l'ecran, dans l'ordre"),
    segments: arr(
      obj({
        start: num("Debut du segment en secondes"),
        end: num("Fin du segment en secondes"),
        texte: str("Texte prononce ou affiche"),
        type: enumStr(
          ["voix_off", "texte_ecran", "dialogue", "son_ambiant"],
          "Nature du segment",
        ),
      }),
      "Decoupage temporel du script",
    ),
    traduction_fr: str("Traduction francaise du script, ou chaine vide s'il est deja en francais"),
  },
  "Script extrait de la creative",
);

const sequences = arr(
  obj({
    start: num("Debut de la sequence en secondes"),
    end: num("Fin de la sequence en secondes"),
    titre: str("Titre court de la sequence"),
    role: enumStr(
      [
        "hook",
        "probleme",
        "agitation",
        "solution",
        "demonstration",
        "preuve_sociale",
        "benefice",
        "offre",
        "cta",
        "autre",
      ],
      "Fonction de la sequence dans la structure de vente",
    ),
    description: str("Ce qui se passe a l'image"),
    elements_visuels: strList("Elements visuels marquants : gros plan, avant/apres, texte anime..."),
    texte_ecran: str("Texte affiche a l'ecran pendant la sequence, ou chaine vide"),
    pourquoi_ca_marche: str("Mecanisme psychologique ou publicitaire exploite"),
  }),
  "Sequences cles de la video, dans l'ordre chronologique",
);

const hook = obj(
  {
    texte: str("Le hook exact : premiers mots prononces ou affiches"),
    duree_s: num("Duree du hook en secondes"),
    type: str("Type de hook : question, choc visuel, probleme, curiosite, resultat, prix..."),
    force_sur_10: num("Note de 0 a 10 du pouvoir d'arret du scroll"),
    analyse: str("Pourquoi ce hook fonctionne ou echoue"),
    variantes_proposees: strList("3 a 5 hooks alternatifs adaptes au public algerien"),
  },
  "Analyse des 3 premieres secondes",
);

const angle = obj({
  nom: str("Nom court de l'angle"),
  angle: str("Formulation de l'angle marketing en une phrase"),
  emotion_ciblee: str("Emotion ou motivation visee"),
  promesse: str("Promesse faite au client"),
  preuve_utilisee: str("Preuve apportee dans la video : demonstration, temoignage, chiffre..."),
  public_cible: str("Segment de clientele vise"),
  score_sur_10: num("Potentiel de l'angle de 0 a 10"),
  pertinence_dz: str("Adaptation necessaire pour le marche algerien"),
});

/** Appel A — lecture de la video : ce qui est montre et dit. */
export const SCHEMA_VISUEL: Schema = obj({
  produit,
  script,
  sequences,
  hook,
});

/** Appel B — lecture strategique : pourquoi la creative fonctionne. */
export const SCHEMA_STRATEGIE: Schema = obj({
  angles_marketing: arr(angle, "Angles marketing exploites ou exploitables, du plus fort au plus faible"),
  mots_cles: obj({
    produit: strList("Mots-cles decrivant le produit"),
    emotionnels: strList("Mots-cles emotionnels utilises dans le script"),
    hashtags: strList("Hashtags pertinents pour TikTok et Instagram en Algerie"),
    seo_fr: strList("Mots-cles de recherche en francais"),
    seo_ar: strList("Mots-cles de recherche en arabe / darija"),
    ciblage_pub: strList("Interets et comportements pour le ciblage Facebook et TikTok Ads"),
  }),
  audio: obj({
    presence_voix: bool("true si une voix humaine est presente"),
    type_voix: str("Type de voix : homme, femme, jeune, voix off pro, voix IA, aucune"),
    type_musique: str("Style de musique : trending, orientale, energique, aucune..."),
    ambiance: str("Ambiance sonore generale"),
    rythme: str("Rythme percu : lent, moyen, rapide, tres rapide"),
    role_du_son: str("Role du son dans la persuasion"),
  }),
  structure: obj({
    duree_totale: num("Duree totale de la video en secondes"),
    nb_plans_estime: num("Nombre de plans distincts estime"),
    rythme_coupe: str("Cadence de montage : lente, moyenne, rapide"),
    format: str("Format : vertical 9:16, carre, horizontal"),
    style_tournage: str("Style : smartphone, studio, ecran enregistre, animation, stock"),
    ugc_ou_pro: enumStr(["ugc", "semi_pro", "pro"], "Niveau de production percu"),
    sous_titres_brules: bool("true si des sous-titres sont incrustes dans l'image"),
    points_de_retention: strList("Moments qui retiennent l'attention"),
    points_de_decrochage: strList("Moments ou le spectateur risque de scroller"),
  }),
  resume_executif: str("Synthese en 4 a 6 phrases : quel produit, quel angle, pourquoi ca convertit"),
  ce_qui_marche: strList("Points forts de la creative"),
  ce_qui_manque: strList("Faiblesses et opportunites d'amelioration"),
});

/* ------------------------------------------ 2. Sourcing + pack Algerie */

const copyLanding = (langue: string) =>
  obj(
    {
      titre: str(`Titre principal de la page de vente, en ${langue}`),
      sous_titre: str(`Sous-titre, en ${langue}`),
      bullets: strList(`5 a 7 benefices en puces, en ${langue}`),
      offre: str(`Formulation de l'offre et du prix, en ${langue}`),
      garantie: str(`Garantie ou reassurance adaptee au paiement a la livraison, en ${langue}`),
      faq: arr(
        obj({
          question: str(`Question frequente, en ${langue}`),
          reponse: str(`Reponse, en ${langue}`),
        }),
        `4 a 6 questions frequentes, en ${langue}`,
      ),
      cta: str(`Texte du bouton d'achat, en ${langue}`),
    },
    `Texte de page de vente en ${langue}`,
  );

/** Appel C — sourcing fournisseur et economie du produit. */
export const SCHEMA_SOURCING: Schema = obj({
  sourcing: obj({
    requetes: obj({
      en: strList("3 a 6 requetes de recherche fournisseur en anglais"),
      zh: strList("3 a 6 requetes de recherche en chinois simplifie, pour 1688 et Taobao"),
      alias_zh: strList("Appellations chinoises alternatives du produit"),
    }),
    estimation: obj({
      prix_achat_unitaire_usd_min: num("Prix d'achat unitaire minimum estime en USD, depart Chine"),
      prix_achat_unitaire_usd_max: num("Prix d'achat unitaire maximum estime en USD"),
      moq_estime: num("Quantite minimum de commande typique chez ce type de fournisseur"),
      frais_port_unitaire_usd_min: num("Fret unitaire minimum estime vers l'Algerie, en USD"),
      frais_port_unitaire_usd_max: num("Fret unitaire maximum estime vers l'Algerie, en USD"),
      prix_vente_dz_dzd_min: num("Prix de vente pratique en Algerie, bas de fourchette, en DZD"),
      prix_vente_dz_dzd_max: num("Prix de vente pratique en Algerie, haut de fourchette, en DZD"),
      hypotheses: strList("Hypotheses retenues pour ces estimations"),
      fiabilite: enumStr(["faible", "moyenne", "bonne"], "Fiabilite de l'estimation"),
    }),
    conseils_negociation: strList("Conseils concrets pour negocier avec le fournisseur chinois"),
    risques_import: strList("Risques d'importation vers l'Algerie : douane, delais, qualite"),
  }),
});

/** Appel D — verdict marche et textes de vente. */
export const SCHEMA_DZ_OFFRE: Schema = obj({
  score: obj({
    global_sur_100: num("Score global du potentiel du produit en Algerie, de 0 a 100"),
    demande: num("Note de la demande locale, de 0 a 20"),
    concurrence: num("Note de la concurrence, de 0 a 20, ou 20 signifie peu de concurrence"),
    marge: num("Note du potentiel de marge, de 0 a 20"),
    logistique: num("Note de la facilite logistique, de 0 a 20"),
    facilite_creative: num("Note de la facilite a produire des creatives, de 0 a 20"),
    verdict: str("Verdict en une phrase : a tester, a eviter, fort potentiel..."),
    justification: str("Justification du score en 3 a 5 phrases"),
  }),
  script_darija: obj({
    texte: str("Script video complet reecrit en darija algerienne, pret a tourner"),
    notes: strList("Notes de tournage et d'intonation"),
  }),
  copy_landing_fr: copyLanding("francais"),
  copy_landing_ar: copyLanding("arabe algerien"),
});

/** Appel E1 — communication publicitaire. */
export const SCHEMA_DZ_COMMUNICATION: Schema = obj({
  angles_pub_dz: arr(angle, "3 a 5 angles publicitaires reecrits pour le marche algerien"),
  annonces: arr(
    obj({
      plateforme: enumStr(["facebook", "tiktok", "instagram"], "Plateforme visee"),
      accroche: str("Premiere ligne de l'annonce"),
      texte: str("Corps de l'annonce, en francais ou darija selon la cible"),
      cta: str("Appel a l'action"),
      angle_utilise: str("Angle marketing exploite"),
    }),
    "4 a 6 annonces pretes a publier",
  ),
  objections: arr(
    obj({
      objection: str("Objection frequente du client algerien"),
      reponse: str("Reponse a apporter, prete a utiliser au telephone ou en commentaire"),
    }),
    "5 a 8 objections et leurs reponses",
  ),
});

/** Appel E2 — ciblage, production et plan de lancement. */
export const SCHEMA_DZ_EXECUTION: Schema = obj({
  ciblage: obj({
    wilayas_prioritaires: strList("Wilayas a cibler en priorite"),
    tranche_age: str("Tranche d'age a cibler"),
    genre: str("Genre a cibler : hommes, femmes, tous"),
    interets: strList("Interets a cibler en publicite"),
    moments_de_diffusion: strList("Creneaux horaires les plus rentables"),
    budget_test_conseille_dzd: num("Budget de test quotidien conseille en DZD"),
  }),
  idees_creatives: arr(
    obj({
      titre: str("Titre de l'idee de video"),
      hook: str("Hook des 3 premieres secondes"),
      deroule: strList("Deroule plan par plan"),
      materiel_necessaire: str("Materiel necessaire pour tourner"),
      difficulte: enumStr(["facile", "moyenne", "difficile"], "Difficulte de production"),
    }),
    "3 a 5 idees de creatives a tourner localement",
  ),
  concurrence_dz: strList("Etat de la concurrence sur ce produit en Algerie"),
  risques: strList("Risques specifiques a ce produit sur le marche algerien"),
  plan_de_lancement: strList("Plan de lancement etape par etape, de la commande au scaling"),
});

/**
 * Appel F — annonces au format Meta.
 *
 * Schema separe volontairement : le fusionner avec la campagne ferait depasser
 * la limite de grammaire (voir l'entete de ce fichier). Les longueurs indiquees
 * sont celles au-dela desquelles Meta tronque l'affichage.
 */
export const SCHEMA_META_ADS: Schema = obj({
  meta_ads: arr(
    obj({
      nom_variante: str("Nom court de la variante, pour la reperer dans le gestionnaire"),
      angle_utilise: str("Angle marketing exploite par cette annonce"),
      texte_principal: str(
        "Texte principal de l'annonce Meta, en francais. Environ 125 caracteres avant la coupure " +
          "« voir plus » : place le benefice et le prix dans les deux premieres lignes. Emojis autorises avec parcimonie.",
      ),
      titre: str("Titre de l'annonce Meta, en francais. Maximum 40 caracteres, sinon Meta le coupe."),
      description: str(
        "Description de l'annonce Meta, en francais. Maximum 30 caracteres. Sert la reassurance : livraison, paiement, garantie.",
      ),
      bouton_cta: enumStr(
        [
          "Acheter",
          "En savoir plus",
          "Envoyer un message",
          "Commander maintenant",
          "S'inscrire",
          "Contactez-nous",
        ],
        "Libelle du bouton d'appel a l'action propose par Meta",
      ),
      texte_principal_ar: str(
        "Le meme texte principal en arabe algerien (darija en caracteres arabes), pas en arabe litteraire.",
      ),
      titre_ar: str("Le meme titre en arabe algerien. Maximum 40 caracteres."),
      description_ar: str("La meme description en arabe algerien. Maximum 30 caracteres."),
    }),
    "4 a 6 jeux d'annonces Meta complets, chacun sur un angle different",
  ),
});

/**
 * Appel G — banque de videos reutilisables.
 *
 * On ne demande pas des URL de videos precises : le modele les inventerait.
 * On demande des requetes exactes, que l'application transforme en liens de
 * recherche. Les sources fournisseur (1688, AliExpress) sont prioritaires car
 * leurs videos montrent le produit a l'identique, sans texte incruste, et sont
 * telechargeables.
 */
export const SCHEMA_BANQUE_VIDEOS: Schema = obj({
  banque_videos: arr(
    obj({
      source: enumStr(
        ["1688", "AliExpress", "Alibaba", "TikTok", "Instagram", "YouTube Shorts", "Pinterest", "Banque libre"],
        "Plateforme ou chercher",
      ),
      titre: str("Intitule court de la piste, ex : « Video fournisseur du produit sur 1688 »"),
      requete: str(
        "Requete exacte a coller dans la recherche de cette plateforme. En chinois pour 1688 et " +
          "Taobao, en anglais pour AliExpress et Alibaba, en francais ou arabe pour TikTok et Instagram.",
      ),
      contenu: str("Ce qu'on trouve concretement avec cette requete, en une phrase"),
      usage: str("Comment reutiliser ces plans dans le montage : hook, demonstration, plan de coupe..."),
      produit_identique: bool(
        "true si le produit analyse y apparait a l'identique, false pour un plan d'ambiance ou generique",
      ),
      sans_texte: bool(
        "true si les videos de cette source sont generalement sans texte incruste, donc reutilisables directement",
      ),
    }),
    "6 a 8 pistes, classees de la plus utile a la moins utile. Privilegie les sources ou le " +
      "produit apparait a l'identique et sans texte incruste.",
  ),
});
