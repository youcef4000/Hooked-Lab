import { randomUUID } from "node:crypto";
import { analyseCreative, analysePackDZ } from "./analysis";
import { buildSourcingLinks } from "./sourcing";
import { calculerRentabilite, paramsParDefaut } from "./dz";
import { config } from "./config";
import { COUT_PROVISOIRE, ajusterCout, rembourser } from "./garde";
import { acquerirVideo } from "./acquisition";
import { estImage as estFichierImage, purgerUploadsAnciens, supprimerFichier } from "./upload";
import { buildMediaAssets, buildMediaAssetsImage, assertFfmpeg } from "./media";
import { transcribe, EMPTY_TRANSCRIPT } from "./transcribe";
import { purgerAnalysesOrphelines, saveReport } from "./store";
import { analysisDir, ensureDir } from "./paths";
import {
  completeJob,
  createJob,
  failJob,
  finishStep,
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
 * Chaine complete : acquisition -> media -> transcription -> Claude -> rapport.
 * Ne jette jamais : les erreurs sont remontees via le job pour etre affichees
 * dans l'interface.
 */
export async function runPipeline(
  id: string,
  source: SourceEntree,
  utilisateurId?: string,
): Promise<void> {
  const dir = ensureDir(analysisDir(id));
  const avertissements: string[] = [];
  // Credits reellement pris : mis a jour des que la duree est connue, et
  // rendus tels quels si l'analyse echoue.
  let creditsPris =
    source.type === "fichier" && estFichierImage(source.nomOriginal)
      ? COUT_PROVISOIRE.image
      : COUT_PROVISOIRE.video;
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
        ? "Recuperation de la video et des metadonnees..."
        : "Verification du fichier recu...",
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
        ? "Preparation de l'image pour l'analyse..."
        : "Extraction de l'audio et detection des plans...",
    );
    const media = estStatique
      ? await buildMediaAssetsImage(dl.videoPath, dir)
      : await buildMediaAssets(dl.videoPath, dir, dl.meta.dureeSecondes);
    avertissements.push(...media.warnings);
    if (!estStatique && !dl.meta.dureeSecondes) dl.meta.dureeSecondes = media.duration;

    // La duree reelle est connue : on corrige le forfait pris au lancement.
    creditsPris = ajusterCout(
      utilisateurId,
      estStatique ? "image" : "video",
      dl.meta.dureeSecondes ?? 0,
    );
    finishStep(
      id,
      "media",
      estStatique
        ? "Creative statique preparee"
        : `${media.assets.frames.length} images cles, ${media.assets.coupes.length} changements de plan`,
    );

    /* 3. Transcription ---------------------------------------------------- */
    startStep(id, "transcription", "Recherche des sous-titres et transcription audio...");
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
          ? "Creative statique : pas de bande son"
          : "Pas de transcription audio : Claude lira les textes a l'ecran",
      );
    } else {
      finishStep(
        id,
        "transcription",
        `${t.transcript.source} — ${t.transcript.texte.length} caracteres`,
      );
    }

    /* 4. Analyse creative -------------------------------------------------- */
    startStep(
      id,
      "analyse_creative",
      `Envoi de ${media.assets.frames.length} images a ${config.anthropic.model}...`,
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
    finishStep(id, "analyse_creative", `Produit identifie : ${creativeRes.creative.produit.nom_fr}`);

    /* 5. Pack Algerie ------------------------------------------------------ */
    startStep(id, "sourcing_dz", "Redaction du dossier marche algerien...");
    const dzRes = await analysePackDZ(creativeRes.creative, creativeRes.sourcing, dl.meta, (detail) =>
      updateStepDetail(id, "sourcing_dz", detail),
    );
    coutInput += dzRes.usage.input_tokens;
    coutOutput += dzRes.usage.output_tokens;
    coutUsd += dzRes.usage.usd_estime;
    updateStepDetail(id, "sourcing_dz", "Construction des liens Alibaba et 1688...");

    const liens = buildSourcingLinks(creativeRes.sourcing.requetes);
    finishStep(id, "sourcing_dz", `Score produit : ${dzRes.dz.score.global_sur_100}/100`);

    /* 6. Finalisation ------------------------------------------------------ */
    startStep(id, "finalisation", "Calcul de rentabilite et ecriture du rapport...");

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
      cout_ia: {
        input_tokens: coutInput,
        output_tokens: coutOutput,
        usd_estime: Math.round(coutUsd * 10000) / 10000,
      },
    };

    saveReport(report);
    finishStep(id, "finalisation", `Cout de l'analyse : ${(coutUsd).toFixed(3)} $`);
    completeJob(id);
  } catch (err) {
    failJob(id, (err as Error).message || "Erreur inconnue pendant l'analyse");
    // Une analyse qui echoue ne se facture pas : le client n'a rien recu, et
    // la panne est de notre cote. On rend le forfait pris au lancement.
    rembourser(utilisateurId, creditsPris);
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
   du serveur fait perdre les analyses en attente comme celles en cours.
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

/** Cree le job puis le place dans la file ; il demarre des qu'un creneau est libre. */
export function launchAnalysis(source: SourceEntree, utilisateurId?: string): string {
  const id = newAnalysisId();
  createJob(id, libelleSource(source), source.type === "url" ? "url" : "fichier");
  // Volontairement non attendu : la progression est suivie via le flux SSE.
  file.attente.push({ id, lancer: () => runPipeline(id, source, utilisateurId) });
  demarrerSuivantes();
  return id;
}

/** Etat de la file, pour l'administration. */
export function etatFileAnalyses(): { enCours: number; enAttente: number; maximum: number } {
  return { enCours: file.enCours, enAttente: file.attente.length, maximum: MAX_SIMULTANEES };
}
