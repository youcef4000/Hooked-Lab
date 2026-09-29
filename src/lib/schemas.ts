/* ============================================================================
   Schemas JSON qui contraignent les sorties de Claude (structured outputs).

   Contraintes de l'API a respecter :
     - chaque objet porte additionalProperties: false
     - `required` liste TOUTES les proprietes
     - pas de minimum/maximum/minLength/maxLength (non supportes)
   Les helpers ci-dessous garantissent ces regles.

   IMPORTANT — pourquoi le rapport est produit en plusieurs appels et non en
   un seul. L'API compile chaque schema en grammaire, et refuse (400
   "compiled grammar is too large") au-dela d'une certaine complexite. Mesure
   faite sur ce projet : la limite tient au NOMBRE DE CHAMPS, pas au volume de
   texte. Chaque schema ci-dessous est sous le seuil ; les regrouper le
   depasse. Ne pas les fusionner sans reverifier.

   Les schemas sont construits POUR un marche et une langue : les noms de
   champs ne changent jamais (les rapports restent lisibles d'une version a
   l'autre), seules les consignes changent. Certains noms portent l'histoire
   du produit, ne en Algerie : `script_darija` est le script localise,
   `copy_landing_ar` la seconde version de la page de vente, `*_dzd` des
   montants dans la devise du marche. Voir marches.ts.
   ========================================================================== */

import type { Langue } from "./langue";
import type { Marche } from "./marches";

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

/** Le contexte qui oriente chaque consigne. */
export interface ContexteSchemas {
  marche: Marche;
  langue: Langue;
}

/** Langue des champs d'analyse (ce que lit l'utilisateur de l'application). */
export function langueAnalyse(langue: Langue): string {
  return langue === "fr" ? "French (correct and fully accented)" : "English";
}

/** Libelles des boutons Meta, dans la langue des annonces. */
export function boutonsMeta(m: Marche): string[] {
  const francais = m.id === "fr" || m.id === "dz";
  return francais
    ? ["Acheter", "En savoir plus", "Envoyer un message", "Commander maintenant", "S'inscrire", "Contactez-nous"]
    : ["Shop Now", "Learn More", "Send Message", "Order Now", "Sign Up", "Contact Us"];
}

export function construireSchemas({ marche: m, langue }: ContexteSchemas) {
  const LA = langueAnalyse(langue);
  const ANN = m.consigneLangueAnnonces;
  const NOM = m.nom.en;
  const cod = m.modele === "cod";
  const algerie = m.id === "dz";

  /** Consigne de la seconde version des textes (arabe algerien ou variante B). */
  const seconde = (objet: string) =>
    algerie
      ? `${objet}, in Algerian darija written in Arabic script (not Modern Standard Arabic, not arabizi)`
      : `${objet} — VARIANT B for A/B testing: same language (${ANN}) but a genuinely different hook, angle and framing, not a paraphrase`;

  /* ------------------------------------------------ 1. Analyse creative */

  const produit = obj(
    {
      nom_fr: str(`Commercial product name, written in ${LA} (the field name is historical: write it in ${LA}, whatever the name says)`),
      nom_en: str("Product name in English, the way a Chinese supplier would list it"),
      nom_ar: str(
        algerie
          ? "Product name in Arabic (Algerian dialect if relevant)"
          : `Consumer-facing product name as it would appear in an ad for ${NOM}, written in ${ANN} — NOT in Arabic, whatever the field name says`,
      ),
      categorie: str(`E-commerce category, in ${LA}: kitchen, beauty, car, baby, fitness...`),
      description: str(`Factual description of the product in 2 to 3 sentences, in ${LA}`),
      caracteristiques: strList(`Concrete features visible in the video, in ${LA}`),
      variantes: strList(`Visible or likely variants: colours, sizes, models, in ${LA}`),
      materiaux_supposes: strList(`Likely materials: ABS plastic, stainless steel, silicone..., in ${LA}`),
      poids_estime_g: num("Estimated unit weight in grams, packaging included"),
      fragile: bool("true if the product breaks easily in transit"),
      saisonnalite: str(
        `Seasonality in ${NOM}, in ${LA}: all year, summer, winter, back to school, Black Friday / Christmas${algerie ? ", Ramadan" : ""}...`,
      ),
      confiance: num("Confidence in the product identification, from 0 to 1"),
    },
    "Product identified in the creative",
  );

  const script = obj(
    {
      langue_detectee: str(`Dominant language of the creative, named in ${LA}`),
      texte_complet: str("Full reconstructed script: voice-over and on-screen text, in order, in the ORIGINAL language"),
      segments: arr(
        obj({
          start: num("Segment start in seconds"),
          end: num("Segment end in seconds"),
          texte: str("Spoken or displayed text, in the original language"),
          type: enumStr(["voix_off", "texte_ecran", "dialogue", "son_ambiant"], "Segment type"),
        }),
        "Timed breakdown of the script",
      ),
      traduction_fr: str(
        `Translation of the script into ${LA} (the field name is historical), or an empty string if it is already in that language`,
      ),
    },
    "Script extracted from the creative",
  );

  const sequences = arr(
    obj({
      start: num("Sequence start in seconds"),
      end: num("Sequence end in seconds"),
      titre: str(`Short title of the sequence, in ${LA}`),
      role: enumStr(
        ["hook", "probleme", "agitation", "solution", "demonstration", "preuve_sociale", "benefice", "offre", "cta", "autre"],
        "Role of the sequence in the sales structure",
      ),
      description: str(`What happens on screen, in ${LA}`),
      elements_visuels: strList(`Striking visual elements: close-up, before/after, animated text..., in ${LA}`),
      texte_ecran: str("On-screen text during the sequence, in the original language, or an empty string"),
      pourquoi_ca_marche: str(`Psychological or advertising mechanism at work, in ${LA}`),
    }),
    "Key sequences of the video, in chronological order",
  );

  const hook = obj(
    {
      texte: str("The exact hook: first words spoken or displayed, in the original language"),
      duree_s: num("Hook duration in seconds"),
      type: str(`Hook type, in ${LA}: question, visual shock, problem, curiosity, result, price...`),
      force_sur_10: num("Scroll-stopping power, from 0 to 10"),
      analyse: str(`Why this hook works or fails, in ${LA}`),
      variantes_proposees: strList(`3 to 5 alternative hooks written for shoppers in ${NOM}, in ${ANN}`),
    },
    "Analysis of the first 3 seconds",
  );

  const angle = obj({
    nom: str(`Short name of the angle, in ${LA}`),
    angle: str(`The marketing angle in one sentence, in ${LA}`),
    emotion_ciblee: str(`Targeted emotion or motivation, in ${LA}`),
    promesse: str(`Promise made to the customer, in ${LA}`),
    preuve_utilisee: str(`Proof used: demonstration, testimonial, figure..., in ${LA}`),
    public_cible: str(`Targeted customer segment, in ${LA}`),
    score_sur_10: num("Potential of the angle from 0 to 10"),
    pertinence_dz: str(`How to adapt this angle for ${NOM}, in ${LA}`),
  });

  /** Appel A — lecture de la video : ce qui est montre et dit. */
  const VISUEL = obj({ produit, script, sequences, hook });

  /** Appel B — lecture strategique : pourquoi la creative fonctionne. */
  const STRATEGIE = obj({
    angles_marketing: arr(angle, "Marketing angles used or usable, from strongest to weakest"),
    mots_cles: obj({
      produit: strList(`Keywords describing the product, in ${LA}`),
      emotionnels: strList(`Emotional keywords used in the script, in ${LA}`),
      hashtags: strList(`Relevant TikTok and Instagram hashtags for ${NOM}`),
      seo_fr: strList(`Search keywords shoppers would type, in ${ANN}`),
      seo_ar: strList(
        algerie ? "Search keywords in Arabic / darija" : `Long-tail search phrases shoppers would type, in ${ANN}`,
      ),
      ciblage_pub: strList(`Interests and behaviours for Meta and TikTok Ads targeting in ${NOM}, in ${LA}`),
    }),
    audio: obj({
      presence_voix: bool("true if a human voice is present"),
      type_voix: str(`Voice type, in ${LA}: man, woman, young, professional voice-over, AI voice, none`),
      type_musique: str(`Music style, in ${LA}: trending, energetic, calm, none...`),
      ambiance: str(`Overall sound mood, in ${LA}`),
      rythme: str(`Perceived pace, in ${LA}: slow, medium, fast, very fast`),
      role_du_son: str(`Role of sound in the persuasion, in ${LA}`),
    }),
    structure: obj({
      duree_totale: num("Total video duration in seconds"),
      nb_plans_estime: num("Estimated number of distinct shots"),
      rythme_coupe: str(`Editing pace, in ${LA}: slow, medium, fast`),
      format: str(`Format, in ${LA}: vertical 9:16, square, horizontal`),
      style_tournage: str(`Style, in ${LA}: smartphone, studio, screen recording, animation, stock`),
      ugc_ou_pro: enumStr(["ugc", "semi_pro", "pro"], "Perceived production level"),
      sous_titres_brules: bool("true if subtitles are burned into the image"),
      points_de_retention: strList(`Moments that hold attention, in ${LA}`),
      points_de_decrochage: strList(`Moments where viewers risk scrolling away, in ${LA}`),
    }),
    resume_executif: str(`Summary in 4 to 6 sentences, in ${LA}: which product, which angle, why it converts`),
    ce_qui_marche: strList(`Strengths of the creative, in ${LA}`),
    ce_qui_manque: strList(`Weaknesses and improvement opportunities, in ${LA}`),
  });

  /* ------------------------------------------ 2. Sourcing + dossier marche */

  const copyLanding = (version: string) =>
    obj(
      {
        titre: str(`Main headline of the sales page — ${version}`),
        sous_titre: str(`Sub-headline — ${version}`),
        bullets: strList(`5 to 7 benefit bullet points — ${version}`),
        offre: str(`Offer and price statement, price in ${m.devise} — ${version}`),
        garantie: str(
          `${cod ? "Reassurance adapted to cash on delivery" : "Guarantee and reassurance: secure payment, delivery times, returns"} — ${version}`,
        ),
        faq: arr(
          obj({ question: str(`Frequent question — ${version}`), reponse: str(`Answer — ${version}`) }),
          `4 to 6 frequent questions — ${version}`,
        ),
        cta: str(`Buy button text — ${version}`),
      },
      `Sales page copy — ${version}`,
    );

  const principale = `main version, in ${ANN}`;

  /** Appel C — sourcing fournisseur et economie du produit. */
  const SOURCING = obj({
    sourcing: obj({
      requetes: obj({
        en: strList("3 to 6 supplier search queries in English"),
        zh: strList("3 to 6 search queries in simplified Chinese, as actually used on 1688 and Taobao"),
        alias_zh: strList("Alternative Chinese names of the product"),
      }),
      estimation: obj({
        prix_achat_unitaire_usd_min: num("Minimum estimated unit purchase price in USD, ex-works China"),
        prix_achat_unitaire_usd_max: num("Maximum estimated unit purchase price in USD"),
        moq_estime: num("Typical minimum order quantity for this kind of supplier"),
        frais_port_unitaire_usd_min: num(
          cod
            ? "Minimum estimated unit freight to Algeria (stock import), in USD"
            : `Minimum estimated unit shipping from China to the end customer in ${NOM} (dropshipping line such as YunExpress, CJ Packet), in USD`,
        ),
        frais_port_unitaire_usd_max: num("Maximum estimated unit shipping, in USD"),
        prix_vente_dz_dzd_min: num(`Realistic retail price in ${NOM}, low end, in ${m.devise}`),
        prix_vente_dz_dzd_max: num(`Realistic retail price in ${NOM}, high end, in ${m.devise}`),
        hypotheses: strList(`Assumptions behind these estimates, in ${LA}`),
        fiabilite: enumStr(["faible", "moyenne", "bonne"], "Reliability of the estimate (low, medium, good)"),
      }),
      conseils_negociation: strList(`Concrete tips to negotiate with the Chinese supplier, in ${LA}`),
      risques_import: strList(
        `Risks of importing to and selling in ${NOM}: customs, taxes, delays, quality, platform policies — in ${LA}`,
      ),
    }),
  });

  /** Appel D — verdict marche et textes de vente. */
  const OFFRE = obj({
    score: obj({
      global_sur_100: num(`Overall potential of the product in ${NOM}, from 0 to 100`),
      demande: num(`Demand in ${NOM}, from 0 to 20`),
      concurrence: num("Competition score from 0 to 20, where 20 means little competition"),
      marge: num("Margin potential from 0 to 20"),
      logistique: num("Logistics ease from 0 to 20"),
      facilite_creative: num("Ease of producing creatives from 0 to 20"),
      verdict: str(`Verdict in one sentence, in ${LA}: worth testing, avoid, strong potential...`),
      justification: str(`Justification of the score in 3 to 5 sentences, in ${LA}`),
    }),
    script_darija: obj({
      texte: str(
        algerie
          ? "Complete video script rewritten in Algerian darija (Arabic script), ready to shoot"
          : `Complete video script rewritten for ${NOM}, in ${ANN}, ready to shoot: hook, demonstration, offer, call to action`,
      ),
      notes: strList(`Shooting and delivery notes, in ${LA}`),
    }),
    copy_landing_fr: copyLanding(principale),
    copy_landing_ar: copyLanding(seconde("second version")),
  });

  /** Appel E1 — communication publicitaire. */
  const COMMUNICATION = obj({
    angles_pub_dz: arr(angle, `3 to 5 ad angles rewritten for ${NOM}`),
    annonces: arr(
      obj({
        plateforme: enumStr(["facebook", "tiktok", "instagram"], "Target platform"),
        accroche: str(`First line of the ad, in ${ANN}`),
        texte: str(`Body of the ad, in ${ANN}`),
        cta: str(`Call to action, in ${ANN}`),
        angle_utilise: str(`Marketing angle used, in ${LA}`),
      }),
      "4 to 6 ads ready to publish",
    ),
    objections: arr(
      obj({
        objection: str(`Frequent objection from customers in ${NOM}, in ${LA}`),
        reponse: str(
          `Answer ready to use ${cod ? "on the phone or in comments" : "in comments, DMs or on the product page"}, in ${ANN}`,
        ),
      }),
      "5 to 8 objections and their answers",
    ),
  });

  /** Appel E2 — ciblage, production et plan de lancement. */
  const EXECUTION = obj({
    ciblage: obj({
      wilayas_prioritaires: strList(`${m.regions.en} to target first`),
      tranche_age: str(`Age range to target, in ${LA}`),
      genre: str(`Gender to target, in ${LA}: men, women, all`),
      interets: strList(`Interests to target in ads, in ${LA}`),
      moments_de_diffusion: strList(`Most profitable time slots (local time in ${NOM}), in ${LA}`),
      budget_test_conseille_dzd: num(`Recommended daily test budget, in ${m.devise}`),
    }),
    idees_creatives: arr(
      obj({
        titre: str(`Title of the video idea, in ${LA}`),
        hook: str(`Hook of the first 3 seconds, in ${ANN}`),
        deroule: strList(`Shot-by-shot outline, in ${LA}`),
        materiel_necessaire: str(`Equipment needed to shoot, in ${LA}`),
        difficulte: enumStr(["facile", "moyenne", "difficile"], "Production difficulty (easy, medium, hard)"),
      }),
      "3 to 5 creative ideas to shoot",
    ),
    concurrence_dz: strList(`State of competition for this product in ${NOM}, in ${LA}`),
    risques: strList(`Product-specific risks in ${NOM}, in ${LA}`),
    plan_de_lancement: strList(`Step-by-step launch plan, from ordering stock to scaling, in ${LA}`),
  });

  /**
   * Appel F — annonces au format Meta. Schema separe volontairement (limite
   * de grammaire). Les longueurs sont celles au-dela desquelles Meta tronque.
   */
  const META_ADS = obj({
    meta_ads: arr(
      obj({
        nom_variante: str(`Short name of the variant, to find it in Ads Manager, in ${LA}`),
        angle_utilise: str(`Marketing angle used by this ad, in ${LA}`),
        texte_principal: str(
          `Primary text of the Meta ad, in ${ANN}. About 125 characters before the "see more" cut: put the benefit and the price in the first two lines. Emojis allowed sparingly.`,
        ),
        titre: str(`Meta ad headline, in ${ANN}. 40 characters maximum or Meta truncates it.`),
        description: str(
          `Meta ad description, in ${ANN}. 30 characters maximum. Used for reassurance: delivery, payment, guarantee.`,
        ),
        bouton_cta: enumStr(boutonsMeta(m), "Label of the Meta call-to-action button"),
        texte_principal_ar: str(seconde("The primary text")),
        titre_ar: str(seconde("The headline, 40 characters maximum")),
        description_ar: str(seconde("The description, 30 characters maximum")),
      }),
      "4 to 6 complete Meta ad sets, each on a different angle",
    ),
  });

  /**
   * Appel G — banque de videos reutilisables. Des requetes, jamais des URL :
   * le modele les inventerait. L'application en fait des liens de recherche.
   */
  const BANQUE_VIDEOS = obj({
    banque_videos: arr(
      obj({
        source: enumStr(
          ["1688", "AliExpress", "Alibaba", "TikTok", "Instagram", "YouTube Shorts", "Pinterest", "Banque libre"],
          "Platform to search on",
        ),
        titre: str(`Short title of the lead, in ${LA}, e.g. "Supplier video of the product on 1688"`),
        requete: str(
          `Exact query to paste into the platform's search: in Chinese for 1688 and Taobao, in English for AliExpress and Alibaba, in ${ANN} for TikTok and Instagram.`,
        ),
        contenu: str(`What you actually find with this query, in one sentence, in ${LA}`),
        usage: str(`How to reuse these shots in the edit: hook, demonstration, cutaway..., in ${LA}`),
        produit_identique: bool("true if the analysed product appears identically, false for generic or mood shots"),
        sans_texte: bool("true if videos from this source usually have no burned-in text, so they can be reused directly"),
      }),
      "6 to 8 leads, ranked from most to least useful. Prioritise sources where the product appears identically and without burned-in text.",
    ),
  });

  return { VISUEL, STRATEGIE, SOURCING, OFFRE, COMMUNICATION, EXECUTION, META_ADS, BANQUE_VIDEOS };
}
