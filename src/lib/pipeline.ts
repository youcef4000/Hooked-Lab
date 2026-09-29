import { randomUUID } from "node:crypto";
import { analyseCreative, analysePackDZ } from "./analysis";
import { buildSourcingLinks } from "./sourcing";
import { calculerRentabilite, paramsParDefautMarche } from "./dz";
import { ajusterCout, rembourser } from "./garde";
import { noterDebit, solderDebit } from "./debits-en-cours";
import { noterIncident } from "./incidents";
import { ClaudeError } from "./claude";
import { acquerirVideo } from "./acquisition";
import { purgerUploadsAnciens, supprimerFichier } from "./upload";
import { buildMediaAssets, buildMediaAssetsImage, assertFfmpeg } from "./media";
import { transcribe, EMPTY_TRANSCRIPT } from "./transcribe";
import { purgerAnalysesOrphelines, saveReport } from "./store";
import { analysisDir, ensureDir } from "./paths";
import { marche as trouverMarche, type MarcheId } from "./marches";
import type { Langue } from "./langue";
import {
  completeJob,
  createJob,
  failJob,
  finishStep,
  getJob,
  pruneJobs,
  skipStep,
  startStep,
  updateStepDetail,
} from "./jobs";
import type { Report, SourceEntree } from "@/types/analysis";

export function newAnalysisId(): string {
  return randomUUID();
}

/** Ce pour quoi l'analyse est faite : le marche vise et la langue du lecteur. */
export interface OptionsAnalyse {
  marche: MarcheId;
  langue: Langue;
}

/** Libelle affiche pour l'origine d'une analyse. */
function libelleSource(source: SourceEntree): string {
  return source.type === "url" ? source.url : source.nomOriginal;
}

/**
 * Ce que voit l'abonne quand son analyse echoue. Le motif technique (cle,
 * credit Anthropic, binaire manquant) ne le concerne pas et l'inquieterait :
 * il part dans le journal des incidents, visible de l'administration.
 * Seuls les echecs de recuperation de la video lui parlent vraiment — il
 * peut y remedier en deposant le fichier.
 */
function messageClient(err: unknown, etape: string | undefined, credits: number, langue: Langue): string {
  const fr = langue === "fr";
  const rendu =
    credits > 0
      ? fr
        ? ` Tes ${credits} crédit${credits > 1 ? "s" : ""} t'ont été rendus.`
        : ` Your ${credits} credit${credits > 1 ? "s have" : " has"} been refunded.`
      : "";
  if (etape === "acquisition") {
    // Les messages de recuperation sont rediges en francais : en anglais, on
    // donne l'issue qui marche toujours.
    return fr
      ? `${(err as Error).message}${rendu}`
      : `The video could not be retrieved from the platform (private, deleted, or blocked for automated access). Save the video on your phone and upload the file here: the analysis will be identical.${rendu}`;
  }
  if (err instanceof ClaudeError) {
    return fr
      ? `Le service d'analyse est momentanément indisponible.${rendu} Réessaie dans quelques minutes ; si ça persiste, écris-nous sur WhatsApp.`
      : `The analysis service is temporarily unavailable.${rendu} Try again in a few minutes; if it persists, message us on WhatsApp.`;
  }
  return fr
    ? `L'analyse n'a pas pu aboutir à cause d'une erreur technique de notre côté.${rendu} Réessaie, ou écris-nous sur WhatsApp.`
    : `The analysis could not be completed because of a technical error on our side.${rendu} Try again, or message us on WhatsApp.`;
}

/**
 * Chaine complete : acquisition -> media -> transcription -> Claude -> rapport.
 * Ne jette jamais : les erreurs sont remontees via le job pour etre affichees
 * dans l'interface.
 */
export async function runPipeline(
  id: string,
  source: SourceEntree,
  utilisateurId: string | undefined,
  montantInitial: number,
  options: OptionsAnalyse,
): Promise<void> {
  const dir = ensureDir(analysisDir(id));
  const avertissements: string[] = [];
  const langue = options.langue;
  const fr = langue === "fr";
  const m = trouverMarche(options.marche);
  const ctx = { marche: m, langue };
  // Credits reellement pris : mis a jour des que la duree est connue, et
  // rendus tels quels si l'analyse echoue.
  let creditsPris = montantInitial;
  let coutInput = 0;
  let coutOutput = 0;
  let coutUsd = 0;

  try {
    await assertFfmpeg();

    /* 1. Acquisition ------------------------------------------------------ */
    startStep(
      id,
      "acquisition",
      source.type === "url"
        ? fr ? "Récupération de la vidéo et de ses informations…" : "Fetching the video and its details…"
        : fr ? "Vérification du fichier reçu…" : "Checking the uploaded file…",
    );
    const dl = await acquerirVideo(source, dir);
    finishStep(
      id,
      "acquisition",
      source.type === "url"
        ? `${dl.meta.platform}${dl.meta.auteur ? ` — ${dl.meta.auteur}` : ""} — ${Math.round(dl.meta.dureeSecondes)} s`
        : dl.meta.estStatique
          ? `${dl.meta.titre} — image ${dl.meta.largeur ?? "?"}x${dl.meta.hauteur ?? "?"}`
          : `${dl.meta.titre} — ${Math.round(dl.meta.dureeSecondes)} s`,
    );

    /* 2. Media ------------------------------------------------------------ */
    const estStatique = dl.meta.estStatique === true;
    startStep(
      id,
      "media",
      estStatique
        ? fr ? "Préparation de l'image pour l'analyse…" : "Preparing the image for analysis…"
        : fr ? "Extraction de l'audio et détection des plans…" : "Extracting audio and detecting shots…",
    );
    const media = estStatique
      ? await buildMediaAssetsImage(dl.videoPath, dir)
      : await buildMediaAssets(dl.videoPath, dir, dl.meta.dureeSecondes);
    avertissements.push(...media.warnings);
    if (!estStatique && !dl.meta.dureeSecondes) dl.meta.dureeSecondes = media.duration;

    // La duree reelle est connue : on corrige le forfait pris au lancement.
    creditsPris = ajusterCout(
      utilisateurId,
      creditsPris,
      estStatique ? "image" : "video",
      dl.meta.dureeSecondes ?? 0,
    );
    noterDebit(id, utilisateurId, creditsPris);
    finishStep(
      id,
      "media",
      estStatique
        ? fr ? "Créative statique préparée" : "Static creative ready"
        : fr
          ? `${media.assets.frames.length} images clés, ${media.assets.coupes.length} changements de plan`
          : `${media.assets.frames.length} key frames, ${media.assets.coupes.length} shot changes`,
    );

    /* 3. Transcription ---------------------------------------------------- */
    startStep(
      id,
      "transcription",
      fr ? "Recherche des sous-titres et transcription de la voix…" : "Looking for subtitles and transcribing the voice…",
    );
    // Une creative statique n'a pas de bande son : rien a transcrire.
    const t = estStatique
      ? { transcript: EMPTY_TRANSCRIPT, warnings: [] as string[] }
      : await transcribe({
          subtitlePaths: dl.subtitlePaths,
          wavPath: media.wavPath,
          mp3Path: media.assets.audio ? `${dir}/audio.mp3` : undefined,
        });
    avertissements.push(...t.warnings);
    if (t.transcript.source === "aucune") {
      skipStep(
        id,
        "transcription",
        estStatique
          ? fr ? "Créative statique : pas de bande son" : "Static creative: no soundtrack"
          : fr
            ? "Pas de voix détectée : l'analyse s'appuie sur les textes à l'écran"
            : "No voice detected: the analysis relies on on-screen text",
      );
    } else {
      finishStep(
        id,
        "transcription",
        fr
          ? `Script récupéré — ${t.transcript.texte.length} caractères`
          : `Script captured — ${t.transcript.texte.length} characters`,
      );
    }

    /* 4. Analyse creative -------------------------------------------------- */
    startStep(
      id,
      "analyse_creative",
      fr
        ? `Analyse de ${media.assets.frames.length} images clés par l'IA…`
        : `AI analysis of ${media.assets.frames.length} key frames…`,
    );
    const creativeRes = await analyseCreative(
      id,
      dl.meta,
      media.assets.frames,
      t.transcript,
      media.assets.coupes,
      ctx,
      (detail) => updateStepDetail(id, "analyse_creative", detail),
    );
    coutInput += creativeRes.usage.input_tokens;
    coutOutput += creativeRes.usage.output_tokens;
    coutUsd += creativeRes.usage.usd_estime;
    finishStep(
      id,
      "analyse_creative",
      fr
        ? `Produit identifié : ${creativeRes.creative.produit.nom_fr}`
        : `Product identified: ${creativeRes.creative.produit.nom_fr}`,
    );

    /* 5. Dossier de lancement du marche ------------------------------------ */
    startStep(
      id,
      "sourcing_dz",
      fr ? `Dossier de lancement — ${m.drapeau} ${m.nom.fr}…` : `Launch file — ${m.drapeau} ${m.nom.en}…`,
    );
    const dzRes = await analysePackDZ(creativeRes.creative, creativeRes.sourcing, dl.meta, ctx, (detail) =>
      updateStepDetail(id, "sourcing_dz", detail),
    );
    coutInput += dzRes.usage.input_tokens;
    coutOutput += dzRes.usage.output_tokens;
    coutUsd += dzRes.usage.usd_estime;
    updateStepDetail(id, "sourcing_dz", fr ? "Construction des liens Alibaba et 1688…" : "Building Alibaba and 1688 links…");

    const liens = buildSourcingLinks(creativeRes.sourcing.requetes);
    finishStep(
      id,
      "sourcing_dz",
      fr ? `Score produit : ${dzRes.dz.score.global_sur_100}/100` : `Product score: ${dzRes.dz.score.global_sur_100}/100`,
    );

    /* 6. Finalisation ------------------------------------------------------ */
    startStep(
      id,
      "finalisation",
      fr ? "Calcul de la rentabilité et écriture du rapport…" : "Computing profitability and writing the report…",
    );

    const params = paramsParDefautMarche(creativeRes.sourcing.estimation, m.id);
    const rentabilite = calculerRentabilite(params);

    const report: Report = {
      id,
      version: 1,
      createdAt: Date.now(),
      url: source.type === "url" ? source.url : "",
      source: dl.meta,
      media: media.assets,
      transcript: t.transcript,
      creative: creativeRes.creative,
      sourcing: { ...creativeRes.sourcing, liens },
      dz: dzRes.dz,
      rentabilite,
      avertissements,
      proprietaireId: utilisateurId,
      marche: m.id,
      langue,
      cout_ia: {
        input_tokens: coutInput,
        output_tokens: coutOutput,
        usd_estime: Math.round(coutUsd * 10000) / 10000,
      },
    };

    saveReport(report);
    solderDebit(id);
    // Le WAV 16 kHz ne sert qu'a la transcription : le garder doublerait le
    // poids de chaque analyse sur le disque, sans rien apporter au rapport.
    if (media.wavPath) supprimerFichier(media.wavPath);
    finishStep(
      id,
      "finalisation",
      utilisateurId ? (fr ? "Rapport prêt" : "Report ready") : `Cout de l'analyse : ${coutUsd.toFixed(3)} $`,
    );
    completeJob(id);
  } catch (err) {
    const technique = (err as Error).message || "Erreur inconnue pendant l'analyse";
    const etape = getJob(id)?.steps.find((s) => s.status === "en_cours")?.id;
    noterIncident({ analyseId: id, utilisateurId, etape, message: technique });

    // Une analyse qui echoue ne se facture pas : le client n'a rien recu, et
    // la panne est de notre cote. On rend ce qui a ete reellement preleve.
    rembourser(utilisateurId, creditsPris);
    solderDebit(id);
    failJob(id, utilisateurId ? messageClient(err, etape, creditsPris, langue) : technique);
  } finally {
    // Aucun fichier depose ne survit au traitement, qu'il ait reussi ou echoue :
    // ni celui en transit, ni la copie laissee par une analyse interrompue.
    if (source.type === "fichier") supprimerFichier(source.cheminTemporaire);
    purgerUploadsAnciens();
    purgerAnalysesOrphelines();
    pruneJobs();
  }
}

/* ============================================================================
   File d'attente des analyses.

   Chaque analyse fait tourner ffmpeg et plusieurs appels a Claude : sans
   limite, cinq clients qui lancent en meme temps saturent la memoire et le
   serveur tombe pour tout le monde. Au-dela de MAX_ANALYSES_SIMULTANEES, les
   analyses attendent leur tour, et le client voit sa place dans la file.

   Limite connue, traitee en phase 2 : la file vit en memoire. Un redemarrage
   du serveur fait perdre les analyses en attente comme celles en cours —
   leurs credits, eux, sont rendus au demarrage (voir debits-en-cours.ts).
   ========================================================================== */

const MAX_SIMULTANEES = Math.max(1, Math.floor(Number(process.env.MAX_ANALYSES_SIMULTANEES) || 2));

type Tache = { id: string; lancer: () => Promise<void> };
type File = { enCours: number; attente: Tache[] };

// globalThis : la file survit au rechargement a chaud en developpement.
const memoire = globalThis as unknown as { __hklFileAnalyses?: File };
const file: File = memoire.__hklFileAnalyses ?? (memoire.__hklFileAnalyses = { enCours: 0, attente: [] });

function annoncerPositions(): void {
  file.attente.forEach((t, i) => {
    const fr = getJob(t.id)?.langue !== "en";
    updateStepDetail(
      t.id,
      "acquisition",
      fr
        ? i === 0
          ? "En file d'attente — ton analyse démarre dès qu'un créneau se libère"
          : `En file d'attente — ${i} analyse${i > 1 ? "s" : ""} avant la tienne`
        : i === 0
          ? "In the queue — your analysis starts as soon as a slot frees up"
          : `In the queue — ${i} analysis${i > 1 ? "es" : ""} ahead of yours`,
    );
  });
}

function demarrerSuivantes(): void {
  while (file.enCours < MAX_SIMULTANEES && file.attente.length > 0) {
    const tache = file.attente.shift()!;
    file.enCours++;
    void tache.lancer().finally(() => {
      file.enCours--;
      demarrerSuivantes();
    });
  }
  annoncerPositions();
}

/**
 * Cree le job puis le place dans la file ; il demarre des qu'un creneau est libre.
 * `montant` est ce que l'abonne a deja paye : il est note sur disque tant que
 * l'analyse tourne, pour etre rendu si le serveur redemarre entre-temps.
 */
export function launchAnalysis(
  source: SourceEntree,
  utilisateurId: string | undefined,
  montant: number,
  options: OptionsAnalyse,
): string {
  const id = newAnalysisId();
  createJob(id, libelleSource(source), source.type === "url" ? "url" : "fichier", utilisateurId, options.langue);
  noterDebit(id, utilisateurId, montant);
  // Volontairement non attendu : la progression est suivie via le flux SSE.
  file.attente.push({ id, lancer: () => runPipeline(id, source, utilisateurId, montant, options) });
  demarrerSuivantes();
  return id;
}

/** Etat de la file, pour l'administration. */
export function etatFileAnalyses(): { enCours: number; enAttente: number; maximum: number } {
  return { enCours: file.enCours, enAttente: file.attente.length, maximum: MAX_SIMULTANEES };
}

/* ============================================================================
   Arret propre, pour les mises a jour.

   Quand l'hebergeur remplace le serveur, il envoie d'abord un signal d'arret
   (SIGTERM). Plutot que de mourir sur-le-champ en coupant les analyses en
   cours, le serveur refuse les nouvelles analyses (message clair, rien n'est
   debite), laisse terminer celles qui tournent et celles deja en file, puis
   s'arrete. Voir demarrage.ts et render.yaml (maxShutdownDelaySeconds).
   ========================================================================== */

const etatArret = globalThis as unknown as { __hklArret?: boolean };

export function arretEnCours(): boolean {
  return etatArret.__hklArret === true;
}

export function demanderArret(): void {
  etatArret.__hklArret = true;
}

/** Resout quand plus aucune analyse ne tourne ni n'attend, ou au bout du delai. */
export async function attendreFinAnalyses(delaiMs: number): Promise<boolean> {
  const limite = Date.now() + delaiMs;
  while (Date.now() < limite) {
    if (file.enCours === 0 && file.attente.length === 0) return true;
    await new Promise((r) => setTimeout(r, 1000));
  }
  return file.enCours === 0 && file.attente.length === 0;
}

export function messageMaintenance(langue: Langue): string {
  return langue === "fr"
    ? "Mise à jour du service en cours : réessaie dans deux minutes. Rien n'a été débité."
    : "The service is being updated: try again in two minutes. Nothing has been charged.";
}
