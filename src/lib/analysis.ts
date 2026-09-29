import path from "node:path";
import { askStructured, type ImagePart, type Usage } from "./claude";
import { construireSchemas, langueAnalyse } from "./schemas";
import type { Langue } from "./langue";
import type { Marche } from "./marches";
import { readFrameBase64 } from "./media";
import { analysisDir } from "./paths";
import type {
  CreativeAnalysis,
  Frame,
  PackDZ,
  SourceMeta,
  Sourcing,
  Transcript,
} from "@/types/analysis";

/* ------------------------------------------------------------- prompts */

/** Le marche vise et la langue du lecteur : ils orientent chaque appel. */
export interface ContexteAnalyse {
  marche: Marche;
  langue: Langue;
}

/** Regle d'ecriture ajoutee quand le lecteur est francophone. */
const REGLE_ACCENTS = `- Quand tu ecris en francais : un francais correct et ENTIEREMENT ACCENTUE.
  Tes textes sont affiches tels quels : ecris « à éviter », « l'état », « après »,
  « créative », « qualité », « problème » — jamais sans accents. Verifie les accords.`;

function regleLangues(ctx: ContexteAnalyse): string {
  return [
    `- LANGUAGE OF THE ANALYSIS: write every analysis field (descriptions, verdicts, explanations, lists) in ${langueAnalyse(ctx.langue)}. The person reading the report reads ${ctx.langue === "fr" ? "French" : "English"}.`,
    `- LANGUAGE OF THE MARKETING COPY: every text meant for shoppers (hooks, scripts, sales pages, ads, answers to objections) is written in ${ctx.marche.consigneLangueAnnonces}.`,
    "- Follow the language stated in each field description of the schema: it always wins.",
    ctx.langue === "fr" || ctx.marche.id === "fr" || ctx.marche.id === "dz" ? REGLE_ACCENTS : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function systemCreative(ctx: ContexteAnalyse): string {
  const m = ctx.marche;
  return `You are a creative strategy director specialised in direct-response e-commerce advertising.
You analyse TikTok, Instagram Reels and Facebook creatives for e-commerce sellers who want to launch
the product in ${m.nom.en} (${m.modele === "cod" ? "cash on delivery" : "prepaid online orders"}).

You receive frames extracted from the video, in chronological order, each preceded by its timestamp.
You also receive the audio transcript when available, and the post metadata.

Method:
1. Read the text shown on screen in each frame. On this kind of creative, burned-in subtitles often
   carry the entire script: reconstruct it from them.
2. If an audio transcript is provided, it is authoritative for the voice-over. Combine it with the
   on-screen text without duplicating the same sentence.
3. Infer the sequence breakdown from the flagged shot changes and from the content.
4. Identify the product precisely: this is what will allow it to be sourced next.

Strict rules:
- Never invent a timestamp: rely on those of the frames provided.
- If information is missing, say so plainly rather than filling the gap with a guess presented as
  a fact. Lower the "confiance" field accordingly.
- The script's texte_complet stays in its original language; traduction_fr holds the translation.
${regleLangues(ctx)}
- Be concrete and actionable. No advertising platitudes: a seller must be able to act directly on
  what you write.`;
}

function systemMarche(ctx: ContexteAnalyse): string {
  const m = ctx.marche;
  return `You are an e-commerce consultant specialised in ${m.nom.en}, with a double expertise:
product sourcing in China (Alibaba, 1688, Taobao) and direct-response advertising in ${m.nom.en}.

You receive the analysis of an advertising creative and its product. You produce the complete
operational file to launch this product in ${m.nom.en}, with amounts in ${m.devise}.

Market context to take into account systematically:
${m.contexte}

Strict rules:
- The Chinese prices you estimate are orders of magnitude: say so in the assumptions and set the
  reliability field honestly.
- Chinese queries must be real expressions used on 1688, not word-for-word translations.
- All retail prices, budgets and amounts for the market are in ${m.devise}; purchase and shipping
  prices from China are in USD.
${regleLangues(ctx)}
- Be concrete: figures, wording ready to copy, executable steps.`;
}

/* --------------------------------------------------- construction du contexte */

function formatDuration(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.round(s % 60);
  return m > 0 ? `${m}m${String(sec).padStart(2, "0")}s` : `${sec}s`;
}

function metaBlock(meta: SourceMeta, transcript: Transcript, coupes: number[]): string {
  const lignes: string[] = [
    "## Metadonnees du post",
    `- Plateforme : ${meta.platform}`,
  ];
  if (meta.estStatique) {
    lignes.push(
      "- Type : CREATIVE STATIQUE — une seule image publicitaire, pas une video.",
      "  Il n'y a ni sequences temporelles, ni audio : analyse la composition visuelle,",
      "  les textes, l'offre affichee et la hierarchie de lecture de l'image.",
      "  Pour les champs temporels du schema (timestamps, sequences, duree), utilise 0",
      "  et decris les zones de l'image dans l'ordre de lecture plutot que des plans.",
    );
  } else {
    lignes.push(`- Duree : ${formatDuration(meta.dureeSecondes)}`);
  }
  if (meta.auteur) lignes.push(`- Compte : ${meta.auteur}`);
  if (meta.datePublication) lignes.push(`- Publie le : ${meta.datePublication}`);
  if (meta.largeur && meta.hauteur) lignes.push(`- Resolution : ${meta.largeur}x${meta.hauteur}`);
  if (meta.vues != null) lignes.push(`- Vues : ${meta.vues.toLocaleString("fr-FR")}`);
  if (meta.likes != null) lignes.push(`- Likes : ${meta.likes.toLocaleString("fr-FR")}`);
  if (meta.commentaires != null) lignes.push(`- Commentaires : ${meta.commentaires.toLocaleString("fr-FR")}`);
  if (meta.partages != null) lignes.push(`- Partages : ${meta.partages.toLocaleString("fr-FR")}`);
  if (meta.musique) lignes.push(`- Musique : ${meta.musique}`);
  if (meta.hashtags.length) lignes.push(`- Hashtags : ${meta.hashtags.map((h) => `#${h}`).join(" ")}`);

  if (meta.titre || meta.description) {
    lignes.push("", "### Legende du post", (meta.description || meta.titre || "").trim());
  }

  if (meta.estStatique) {
    lignes.push(
      "",
      "## Tache",
      "Analyse cette creative statique et renvoie l'objet JSON demande par le schema.",
    );
    return lignes.join("\n");
  }

  lignes.push("", "## Transcription audio");
  if (transcript.texte) {
    lignes.push(`Source : ${transcript.source}. ${transcript.note ?? ""}`.trim());
    if (transcript.segments.length) {
      lignes.push("");
      for (const s of transcript.segments) {
        lignes.push(`[${s.start.toFixed(1)}s - ${s.end.toFixed(1)}s] ${s.texte}`);
      }
    } else {
      lignes.push("", transcript.texte);
    }
  } else {
    lignes.push(
      "Aucune transcription audio disponible. Reconstitue le script uniquement a partir des " +
        "textes affiches a l'ecran sur les images ci-dessus et de la legende du post.",
    );
  }

  if (coupes.length) {
    lignes.push(
      "",
      "## Changements de plan detectes (secondes)",
      coupes.map((c) => c.toFixed(2)).join(", "),
    );
  }

  lignes.push(
    "",
    "## Tache",
    "Analyse cette creative et renvoie l'objet JSON demande par le schema.",
  );

  return lignes.join("\n");
}

function framesToImages(id: string, frames: Frame[]): ImagePart[] {
  const dir = analysisDir(id);
  return frames.map((f, i) => ({
    base64: readFrameBase64(path.join(dir, f.file)),
    mediaType: "image/jpeg" as const,
    legende: `Image ${i + 1}/${frames.length} — t = ${f.t.toFixed(2)} s${f.coupe ? " (changement de plan)" : ""}`,
  }));
}

/* ----------------------------------------------------------------- appels */

/**
 * L'analyse est decoupee en cinq appels parce que l'API refuse de compiler une
 * grammaire trop complexe (voir l'entete de schemas.ts).
 *
 * L'enchainement est optimise pour la duree totale, qui est presque entierement
 * du temps de generation :
 *
 *   A (lecture de la video, avec les images)
 *     ├─ B (analyse strategique)  ┐ en parallele : B a besoin de A,
 *     └─ C (sourcing fournisseur) ┘ C aussi, mais ni l'un ni l'autre entre eux
 *          ├─ D  (offre et textes de vente)      ┐
 *          ├─ E1 (angles, annonces, objections)  ├ en parallele
 *          └─ E2 (ciblage, idees, plan)          ┘
 *
 * Chaque appel demande le niveau d'effort qui lui suffit : une extraction
 * guidee par un schema n'a pas besoin d'autant de raisonnement qu'un jugement
 * strategique. ANTHROPIC_EFFORT permet de tout forcer plus haut si besoin.
 */

type BlocVisuel = Pick<CreativeAnalysis, "produit" | "script" | "sequences" | "hook">;
type BlocStrategie = Omit<CreativeAnalysis, keyof BlocVisuel>;
type BlocSourcing = { sourcing: Omit<Sourcing, "liens"> };
type BlocOffre = Pick<PackDZ, "score" | "script_darija" | "copy_landing_fr" | "copy_landing_ar">;
type BlocCommunication = Pick<PackDZ, "angles_pub_dz" | "annonces" | "objections">;
type BlocMeta = Pick<PackDZ, "meta_ads">;
type BlocVideos = Pick<PackDZ, "banque_videos">;
type BlocExecution = Omit<PackDZ, keyof BlocOffre | keyof BlocCommunication | keyof BlocMeta | keyof BlocVideos>;

function cumuler(...usages: Usage[]): Usage {
  return usages.reduce(
    (total, u) => ({
      input_tokens: total.input_tokens + u.input_tokens,
      output_tokens: total.output_tokens + u.output_tokens,
      usd_estime: total.usd_estime + u.usd_estime,
    }),
    { input_tokens: 0, output_tokens: 0, usd_estime: 0 },
  );
}

/** Fiche de synthese reutilisee par les appels qui ne recoivent pas les images. */
function ficheProduit(visuel: BlocVisuel, meta: SourceMeta): string {
  return [
    "## Produit identifie",
    JSON.stringify(visuel.produit, null, 2),
    "",
    "## Script original",
    visuel.script.texte_complet,
    "",
    `## Post d'origine sur ${meta.platform}`,
    `Vues : ${meta.vues ?? "inconnu"} | Likes : ${meta.likes ?? "inconnu"} | Commentaires : ${meta.commentaires ?? "inconnu"}`,
  ].join("\n");
}

/** Appel A, puis B et C en parallele. */
export async function analyseCreative(
  id: string,
  meta: SourceMeta,
  frames: Frame[],
  transcript: Transcript,
  coupes: number[],
  ctx: ContexteAnalyse,
  surAvancement?: (detail: string) => void,
): Promise<{ creative: CreativeAnalysis; sourcing: Omit<Sourcing, "liens">; usage: Usage }> {
  const images = framesToImages(id, frames);
  const SCHEMAS = construireSchemas(ctx);
  const SYSTEM_CREATIVE = systemCreative(ctx);
  const SYSTEM_MARCHE = systemMarche(ctx);
  const fr = ctx.langue === "fr";

  surAvancement?.(fr ? "Lecture de la vidéo : produit, script et séquences…" : "Reading the video: product, script and sequences…");
  const visuel = await askStructured<BlocVisuel>({
    system: SYSTEM_CREATIVE,
    images,
    // Les images sont mises en cache : l'appel B renvoie exactement les memes
    // et n'aura donc pas a les retraiter.
    cacheImages: true,
    effort: "low",
    texte: `${metaBlock(meta, transcript, coupes)}
For this step, produce only: the identified product, the full script, the
sequence breakdown and the hook analysis.`,
    schema: SCHEMAS.VISUEL,
  });

  const fiche = ficheProduit(visuel.data, meta);
  surAvancement?.(
    fr
      ? `Produit identifié : ${visuel.data.produit.nom_fr}. Angles et sourcing…`
      : `Product identified: ${visuel.data.produit.nom_fr}. Angles and sourcing…`,
  );

  // B et C dependent tous deux de A, mais pas l'un de l'autre.
  const [strategie, sourcing] = await Promise.all([
    askStructured<BlocStrategie>({
      system: SYSTEM_CREATIVE,
      images,
      effort: "medium",
      texte: [
        "Here is the factual reading already established on this same video.",
        "",
        fiche,
        "",
        "## Sequences",
        JSON.stringify(visuel.data.sequences, null, 2),
        "",
        "## Hook",
        JSON.stringify(visuel.data.hook, null, 2),
        "",
        meta.estStatique
          ? "## Creative statique : une seule image, pas de dimension temporelle"
          : `## Duree reelle : ${Math.round(meta.dureeSecondes)} s, ${coupes.length} changements de plan detectes`,
        meta.largeur && meta.hauteur ? `## Resolution : ${meta.largeur}x${meta.hauteur}` : "",
        "",
        "## Task",
        "Building on the frames and on this reading, produce the strategic analysis:",
        "marketing angles, keywords, soundtrack, production structure and summary.",
        `Stay consistent with the product identified above, and think about launching it in ${ctx.marche.nom.en}.`,
      ].join("\n"),
      schema: SCHEMAS.STRATEGIE,
    }),
    askStructured<BlocSourcing>({
      system: SYSTEM_MARCHE,
      effort: "low",
      texte: `${fiche}

## Task
Produce only the sourcing file: supplier queries, price estimates, negotiation
tips and import risks for ${ctx.marche.nom.en}.`,
      schema: SCHEMAS.SOURCING,
    }),
  ]);

  return {
    creative: { ...visuel.data, ...strategie.data },
    sourcing: sourcing.data.sourcing,
    usage: cumuler(visuel.usage, strategie.usage, sourcing.usage),
  };
}

/** Appels D et E en parallele : offre et campagne. */
export async function analysePackDZ(
  creative: CreativeAnalysis,
  sourcing: Omit<Sourcing, "liens">,
  meta: SourceMeta,
  ctx: ContexteAnalyse,
  surAvancement?: (detail: string) => void,
): Promise<{ dz: PackDZ; usage: Usage }> {
  const SCHEMAS = construireSchemas(ctx);
  const SYSTEM_MARCHE = systemMarche(ctx);
  const m = ctx.marche;
  const algerie = m.id === "dz";
  const fr = ctx.langue === "fr";
  const contexte = [
    "## Produit identifie",
    JSON.stringify(creative.produit, null, 2),
    "",
    "## Script original",
    creative.script.texte_complet,
    "",
    "## Angles already used in the creative",
    JSON.stringify(creative.angles_marketing, null, 2),
    "",
    "## Summary of the analysis",
    creative.resume_executif,
    "",
    `## Post d'origine sur ${meta.platform}`,
    `Vues : ${meta.vues ?? "inconnu"} | Likes : ${meta.likes ?? "inconnu"}`,
    "",
    "## Product economics established at the previous step (retail prices in the market currency)",
    JSON.stringify(sourcing.estimation, null, 2),
  ].join("\n");

  surAvancement?.(
    fr ? `Rédaction du dossier de lancement — ${m.nom.fr}…` : `Writing the launch file — ${m.nom.en}…`,
  );

  const regleMeta = algerie
    ? `- Write like an Algerian advertiser selling cash on delivery, not like an international
  brand: price in dinars, mention delivery to the wilayas, direct tone.

Arabic version — strict requirements:
- Write in Algerian darija as actually spoken, in Arabic script, not Modern Standard Arabic and
  not arabizi (Latin numbers).
- It is not a word-for-word translation of the French: rephrase the way an Algerian would
  naturally write it on Facebook.
- French words commonly used in darija (livraison, commande, gratuit) may stay in French if they
  sound more natural that way.
- Check Arabic spelling and punctuation before answering.`
    : `- Write like a performance marketer who sells in ${m.nom.en}: price in ${m.devise}, concrete
  benefit, reassurance on delivery times, secure payment and returns.
- The "_ar" fields hold VARIANT B of each ad, in the same language: a different hook and angle,
  so the seller can A/B test. Not a paraphrase of variant A.
- Respect local advertising rules: no unsubstantiated claims, no fake scarcity.`;

  const [offre, communication, execution, metaAds, videos] = await Promise.all([
    askStructured<BlocOffre>({
      system: SYSTEM_MARCHE,
      effort: "low",
      texte: `${contexte}

## Task
Produce the market verdict and the sales copy: product score for ${m.nom.en},
${algerie ? "script in darija, sales page in French and in Algerian Arabic" : "localised video script, sales page (main version and variant B for A/B testing)"}.`,
      schema: SCHEMAS.OFFRE,
    }),
    askStructured<BlocCommunication>({
      system: SYSTEM_MARCHE,
      effort: "low",
      texte: `${contexte}

## Task
Produce the advertising communication: angles adapted to ${m.nom.en}, ads ready
to publish, customer objections and answers.`,
      schema: SCHEMAS.COMMUNICATION,
    }),
    askStructured<BlocExecution>({
      system: SYSTEM_MARCHE,
      effort: "low",
      texte: `${contexte}

## Task
Produce the execution plan: ad targeting in ${m.nom.en}, creative ideas to shoot,
state of the competition, risks and launch plan.`,
      schema: SCHEMAS.EXECUTION,
    }),
    askStructured<BlocMeta>({
      system: SYSTEM_MARCHE,
      effort: "medium",
      texte: `${contexte}

## Task
Produce ads ready to paste into Meta Ads Manager (Facebook and Instagram), each on
a different angle.

Writing rules imposed by the Meta format:
- Primary text: the concrete benefit and the price must fit in the first two lines,
  before the "see more" cut around 125 characters.
- Headline: 40 characters maximum, otherwise Meta truncates it.
- Description: 30 characters maximum, used for reassurance.
${regleMeta}`,
      schema: SCHEMAS.META_ADS,
    }),
    askStructured<BlocVideos>({
      system: SYSTEM_MARCHE,
      effort: "medium",
      texte: `${contexte}

## Supplier queries already established
${JSON.stringify(sourcing.requetes, null, 2)}

## Task
The user wants to edit their own vertical 9:16 creative without shooting themselves.
Give them leads to reusable videos where THIS product appears.

Mandatory rules:
- NEVER invent a video URL, account name or precise title: you have no web access and
  those links would be fake. Give only the exact QUERY to type on each platform; the
  application turns it into a link.
- Rank leads from most to least useful.
- Absolute priority to sources where the product appears IDENTICALLY and WITHOUT
  BURNED-IN TEXT: 1688, Taobao and AliExpress listings almost always carry product
  demo videos, shot on a neutral background, downloadable and text-free. That is the
  best raw material for an edit.
- Only then social platforms (TikTok, Instagram, YouTube Shorts) with real-use demos —
  noting that those videos often carry burned-in text and belong to their creator.
- End with one or two leads for royalty-free mood shots, useful as cutaways.
- For 1688 and Taobao, the query must be in Chinese. For AliExpress and Alibaba, in
  English. For TikTok and Instagram, in ${m.consigneLangueAnnonces}.`,
      schema: SCHEMAS.BANQUE_VIDEOS,
    }),
  ]);

  return {
    dz: { ...offre.data, ...communication.data, ...execution.data, ...metaAds.data, ...videos.data },
    usage: cumuler(offre.usage, communication.usage, execution.usage, metaAds.usage, videos.usage),
  };
}
