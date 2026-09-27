import { randomUUID } from "node:crypto";
import { analyseCreative, analysePackDZ } from "./analysis";
import { buildSourcingLinks } from "./sourcing";
import { calculerRentabilite, paramsParDefaut } from "./dz";
import { config } from "./config";
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
function messageClient(err: unknown, etape: string | undefined, credits: number): string {
  const rendu =
    credits > 0 ? ` Tes ${credits} crédit${credits > 1 ? "s" : ""} t'ont été rendus.` : "";
  if (etape === "acquisition") return `${(err as Error).message}${rendu}`;
  if (err instanceof ClaudeError) {
    return (
      "Le service d'analyse est momentanément indisponible." +
      rendu +
      " Réessaie dans quelques minutes ; si ça persiste, écris-nous sur WhatsApp."
    );
  }
  return (
    "L'analyse n'a pas pu aboutir à cause d'une erreur technique de notre côté." +
    rendu +
    " Réessaie, ou écris-nous sur WhatsApp."
  );
}

/**
 * Chaine complete : acquisition -> media -> transcription -> Claude -> rapport.
 * Ne jette jamais : les erreurs sont remontees via le job pour etre affichees
 * dans l'interface.
 */
export async function runPipeline(
  id: string,
  source: SourceEntree,
  utilisateurId?: string,
  montantInitial = 0,
): Promise<void> {
  const dir = ensureDir(analysisDir(id));
  const avertissements: string[] = [];
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
        ? "Récupération de la vidéo et de ses informations…"
        : "Vérification du fichier reçu…",
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
        ? "Préparation de l'image pour l'analyse…"
        : "Extraction de l'audio et détection des plans…",
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
        ? "Créative statique préparée"
        : `${media.assets.frames.length} images clés, ${media.assets.coupes.length} changements de plan`,
    );

    /* 3. Transcription ---------------------------------------------------- */
    startStep(id, "transcription", "Recherche des sous-titres et transcription de la voix…");
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
          ? "Créative statique : pas de bande son"
          : "Pas de voix détectée : l'analyse s'appuie sur les textes à l'écran",
      );
    } else {
      finishStep(
        id,
        "transcription",
        `Script récupéré — ${t.transcript.texte.length} caractères`,
      );
    }

    /* 4. Analyse creative -------------------------------------------------- */
    startStep(
      id,
      "analyse_creative",
      `Analyse de ${media.assets.frames.length} images clés par l'IA…`,
    );
    const creativeRes = await analyseCreative(
      id,
      dl.meta,
      media.assets.frames,
      t.transcript,
      media.assets.coupes,
      (detail) => updateStepDetail(id, "analyse_creative", detail),
    );
    coutInput += creativeRes.usage.input_tokens;
    coutOutput += creativeRes.usage.output_tokens;
    coutUsd += creativeRes.usage.usd_estime;
    finishStep(id, "analyse_creative", `Produit identifié : ${creativeRes.creative.produit.nom_fr}`);

    /* 5. Pack Algerie ------------------------------------------------------ */
    startStep(id, "sourcing_dz", "Rédaction du dossier pour le marché algérien…");
    const dzRes = await analysePackDZ(creativeRes.creative, creativeRes.sourcing, dl.meta, (detail) =>
      updateStepDetail(id, "sourcing_dz", detail),
    );
    coutInput += dzRes.usage.input_tokens;
    coutOutput += dzRes.usage.output_tokens;
    coutUsd += dzRes.usage.usd_estime;
    updateStepDetail(id, "sourcing_dz", "Construction des liens Alibaba et 1688…");

    const liens = buildSourcingLinks(creativeRes.sourcing.requetes);
    finishStep(id, "sourcing_dz", `Score produit : ${dzRes.dz.score.global_sur_100}/100`);

    /* 6. Finalisation ------------------------------------------------------ */
    startStep(id, "finalisation", "Calcul de la rentabilité et écriture du rapport…");

    const params = paramsParDefaut(creativeRes.sourcing.estimation, config.fx.parallel);
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
      utilisateurId ? "Rapport prêt" : `Cout de l'analyse : ${coutUsd.toFixed(3)} $`,
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
    failJob(id, utilisateurId ? messageClient(err, etape, creditsPris) : technique);
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
    updateStepDetail(
      t.id,
      "acquisition",
      i === 0
        ? "En file d'attente — ton analyse démarre dès qu'un créneau se libère"
        : `En file d'attente — ${i} analyse${i > 1 ? "s" : ""} avant la tienne`,
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
export function launchAnalysis(source: SourceEntree, utilisateurId?: string, montant = 0): string {
  const id = newAnalysisId();
  createJob(id, libelleSource(source), source.type === "url" ? "url" : "fichier", utilisateurId);
  noterDebit(id, utilisateurId, montant);
  // Volontairement non attendu : la progression est suivie via le flux SSE.
  file.attente.push({ id, lancer: () => runPipeline(id, source, utilisateurId, montant) });
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

export const MESSAGE_MAINTENANCE =
  "Mise à jour du service en cours : réessaie dans deux minutes. Rien n'a été débité.";
