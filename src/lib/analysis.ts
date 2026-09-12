import path from "node:path";
import { askStructured, type ImagePart, type Usage } from "./claude";
import {
  SCHEMA_DZ_COMMUNICATION,
  SCHEMA_META_ADS,
  SCHEMA_BANQUE_VIDEOS,
  SCHEMA_DZ_EXECUTION,
  SCHEMA_DZ_OFFRE,
  SCHEMA_SOURCING,
  SCHEMA_STRATEGIE,
  SCHEMA_VISUEL,
} from "./schemas";
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

const SYSTEM_CREATIVE = `Tu es un directeur creative strategy specialise en publicite e-commerce a reponse directe.
Tu analyses des creatives TikTok, Instagram Reels et Facebook pour des e-commercants algeriens
qui vendent en paiement a la livraison (COD).

Tu recois des images extraites de la video, dans l'ordre chronologique, chacune precedee de son
timestamp. Tu recois aussi la transcription audio quand elle est disponible, et les metadonnees
du post.

Methode :
1. Lis les textes affiches a l'ecran sur chaque image. Sur ce type de creative, les sous-titres
   incrustes portent souvent l'integralite du script : reconstitue-le a partir de la.
2. Si une transcription audio est fournie, elle fait autorite pour la voix off. Combine-la avec
   les textes a l'ecran, sans dupliquer la meme phrase.
3. Deduis le decoupage en sequences a partir des changements de plan signales et du contenu.
4. Identifie le produit avec precision : c'est ce qui permettra de le sourcer ensuite.

Regles strictes :
- N'invente jamais un timestamp : appuie-toi sur ceux des images fournies.
- Si une information est absente, ecris-le franchement plutot que de combler par une supposition
  presentee comme un fait. Baisse le champ "confiance" en consequence.
- Le champ texte_complet du script doit rester dans la langue d'origine ; utilise traduction_fr
  pour la version francaise.
- Tous les autres champs d'analyse sont rediges en francais.
- Ecris un francais correct et ENTIEREMENT ACCENTUE. Tes textes sont affiches tels
  quels dans l'application : ecris « à éviter », « l'état », « après », « créative »,
  « français », « qualité », « problème » — jamais sans accents. Verifie aussi les
  accords et la ponctuation avant de repondre.
- Sois concret et actionnable. Pas de generalites publicitaires : un e-commercant doit pouvoir
  agir directement a partir de ce que tu ecris.`;

const SYSTEM_DZ = `Tu es consultant e-commerce specialise sur le marche algerien, avec une double expertise :
sourcing produit en Chine (Alibaba, 1688, Taobao) et publicite a reponse directe en Algerie.

Tu recois l'analyse d'une creative publicitaire et son produit. Tu produis le dossier operationnel
complet pour lancer ce produit en Algerie.

Contexte du marche algerien a integrer systematiquement :
- Le paiement se fait a la livraison (COD). Le taux de livraison reussie tourne autour de 55 a 75 %.
  Les retours coutent cher : la marge doit absorber les colis non livres.
- La livraison passe par Yalidine, ZR Express, Maystro, Noest. Domicile : environ 500 a 900 DZD.
  Stopdesk : environ 350 a 600 DZD. Les wilayas du sud coutent nettement plus cher.
- Les importateurs achetent le plus souvent leurs devises au marche parallele (square), autour de
  250 DZD pour 1 USD, contre environ 132 DZD au taux officiel. Raisonne au taux parallele et
  precise-le dans tes hypotheses.
- La communication qui convertit est en darija algerienne, parfois melangee de francais.
  L'arabe litteraire sonne institutionnel et convertit moins.
- Le trafic vient surtout de Facebook et TikTok. Instagram est secondaire.
- Le client type se mefie de la qualite, veut voir le produit en vrai et veut pouvoir appeler
  un numero de telephone.

Regles strictes :
- Les prix chinois que tu estimes sont des ordres de grandeur : dis-le dans les hypotheses et
  regle le champ fiabilite honnetement.
- Les requetes en chinois doivent etre de vraies expressions utilisees sur 1688, pas du francais
  traduit mot a mot.
- Le script darija doit etre ecrit tel qu'on le parle en Algerie, en caracteres arabes.
- Ecris tout le reste en francais, sauf les champs explicitement demandes en arabe.
- Ecris un francais correct et ENTIEREMENT ACCENTUE. Tes textes sont affiches tels
  quels dans l'application : ecris « à éviter », « l'état », « après », « créative »,
  « français », « qualité », « problème » — jamais sans accents. Verifie aussi les
  accords et la ponctuation avant de repondre.
- Sois concret : chiffres, formulations pretes a copier, etapes executables.`;

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
  surAvancement?: (detail: string) => void,
): Promise<{ creative: CreativeAnalysis; sourcing: Omit<Sourcing, "liens">; usage: Usage }> {
  const images = framesToImages(id, frames);

  surAvancement?.("Lecture de la video : produit, script et sequences...");
  const visuel = await askStructured<BlocVisuel>({
    system: SYSTEM_CREATIVE,
    images,
    // Les images sont mises en cache : l'appel B renvoie exactement les memes
    // et n'aura donc pas a les retraiter.
    cacheImages: true,
    effort: "low",
    texte: `${metaBlock(meta, transcript, coupes)}
Pour cette etape, produis uniquement : le produit identifie, le script complet,
le decoupage en sequences et l'analyse du hook.`,
    schema: SCHEMA_VISUEL,
  });

  const fiche = ficheProduit(visuel.data, meta);
  surAvancement?.(`Produit identifie : ${visuel.data.produit.nom_fr}. Angles et sourcing...`);

  // B et C dependent tous deux de A, mais pas l'un de l'autre.
  const [strategie, sourcing] = await Promise.all([
    askStructured<BlocStrategie>({
      system: SYSTEM_CREATIVE,
      images,
      effort: "medium",
      texte: [
        "Voici la lecture factuelle deja etablie sur cette meme video.",
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
        "## Tache",
        "En t'appuyant sur les images et sur cette lecture, produis l'analyse strategique :",
        "angles marketing, mots-cles, bande son, structure de production et synthese.",
        "Reste coherent avec le produit identifie ci-dessus.",
      ].join("\n"),
      schema: SCHEMA_STRATEGIE,
    }),
    askStructured<BlocSourcing>({
      system: SYSTEM_DZ,
      effort: "low",
      texte: `${fiche}

## Tache
Produis uniquement le dossier de sourcing : requetes fournisseurs, estimation
des prix, conseils de negociation et risques d'importation.`,
      schema: SCHEMA_SOURCING,
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
  surAvancement?: (detail: string) => void,
): Promise<{ dz: PackDZ; usage: Usage }> {
  const contexte = [
    "## Produit identifie",
    JSON.stringify(creative.produit, null, 2),
    "",
    "## Script original",
    creative.script.texte_complet,
    "",
    "## Angles deja exploites dans la creative",
    JSON.stringify(creative.angles_marketing, null, 2),
    "",
    "## Synthese de l'analyse",
    creative.resume_executif,
    "",
    `## Post d'origine sur ${meta.platform}`,
    `Vues : ${meta.vues ?? "inconnu"} | Likes : ${meta.likes ?? "inconnu"}`,
    "",
    "## Economie du produit etablie a l'etape precedente",
    JSON.stringify(sourcing.estimation, null, 2),
  ].join("\n");

  surAvancement?.("Redaction du dossier de lancement algerien...");

  const [offre, communication, execution, metaAds, videos] = await Promise.all([
    askStructured<BlocOffre>({
      system: SYSTEM_DZ,
      effort: "low",
      texte: `${contexte}

## Tache
Produis le verdict marche et les textes de vente : score du produit, script en
darija, page de vente en francais et en arabe algerien.`,
      schema: SCHEMA_DZ_OFFRE,
    }),
    askStructured<BlocCommunication>({
      system: SYSTEM_DZ,
      effort: "low",
      texte: `${contexte}

## Tache
Produis la communication publicitaire : angles adaptes au marche algerien,
annonces pretes a publier, objections clients et reponses.`,
      schema: SCHEMA_DZ_COMMUNICATION,
    }),
    askStructured<BlocExecution>({
      system: SYSTEM_DZ,
      effort: "low",
      texte: `${contexte}

## Tache
Produis le volet execution : ciblage publicitaire, idees de creatives a tourner
localement, etat de la concurrence, risques et plan de lancement.`,
      schema: SCHEMA_DZ_EXECUTION,
    }),
    askStructured<BlocMeta>({
      system: SYSTEM_DZ,
      effort: "medium",
      texte: `${contexte}

## Tache
Produis des annonces pretes a coller dans le gestionnaire de publicites Meta
(Facebook et Instagram), chacune sur un angle different.

Regles de redaction imposees par le format Meta :
- Texte principal : le benefice concret et le prix doivent tenir dans les deux
  premieres lignes, avant la coupure « voir plus » vers 125 caracteres.
- Titre : 40 caracteres maximum, sinon Meta le tronque.
- Description : 30 caracteres maximum, reservee a la reassurance (livraison,
  paiement a la livraison, garantie).
- Ecris comme un annonceur algerien qui vend en COD, pas comme une marque
  internationale : prix en dinars, mention de la livraison en wilayas, ton direct.

Version arabe — exigences strictes :
- Ecris en darija algerienne reellement parlee, en caracteres arabes, pas en
  arabe litteraire et pas en arabizi (chiffres latins).
- Ce n'est pas une traduction mot a mot du francais : reformule comme un
  Algerien l'ecrirait naturellement sur Facebook.
- Les mots francais couramment employes en darija (livraison, commande, gratuit)
  peuvent rester en francais s'ils sonnent plus naturels ainsi.
- Verifie l'orthographe arabe et la ponctuation avant de repondre.`,
      schema: SCHEMA_META_ADS,
    }),
    askStructured<BlocVideos>({
      system: SYSTEM_DZ,
      effort: "medium",
      texte: `${contexte}

## Requetes fournisseur deja etablies
${JSON.stringify(sourcing.requetes, null, 2)}

## Tache
L'utilisateur veut monter sa propre creative verticale 9:16 sans tourner
lui-meme. Donne-lui les pistes de videos reutilisables ou l'on voit CE produit.

Regles imperatives :
- N'invente JAMAIS d'URL de video, de nom de compte ou de titre precis : tu
  n'as pas acces au web et ces liens seraient faux. Donne uniquement la
  REQUETE exacte a taper sur chaque plateforme ; l'application en fera un lien.
- Classe les pistes de la plus utile a la moins utile.
- Priorite absolue aux sources ou le produit apparait A L'IDENTIQUE et SANS
  TEXTE INCRUSTE : les fiches fournisseur 1688, Taobao et AliExpress contiennent
  presque toujours des videos de demonstration du produit, filmees sur fond
  neutre, telechargeables et sans texte. C'est la meilleure matiere premiere
  pour un montage.
- Ensuite seulement, les plateformes sociales (TikTok, Instagram, YouTube
  Shorts) ou l'on trouve des demonstrations en usage reel — en signalant que
  ces videos portent souvent du texte incruste et appartiennent a leur auteur.
- Termine par une ou deux pistes de plans d'ambiance libres de droits, utiles
  comme plans de coupe.
- Pour 1688 et Taobao, la requete doit etre en chinois. Pour AliExpress et
  Alibaba, en anglais. Pour TikTok et Instagram, en francais, en arabe
  algerien ou en anglais selon ce qui donnera le plus de resultats.`,
      schema: SCHEMA_BANQUE_VIDEOS,
    }),
  ]);

  return {
    dz: { ...offre.data, ...communication.data, ...execution.data, ...metaAds.data, ...videos.data },
    usage: cumuler(offre.usage, communication.usage, execution.usage, metaAds.usage, videos.usage),
  };
}
