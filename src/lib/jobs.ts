import { EventEmitter } from "node:events";
import type { Job, JobStep, StepId } from "@/types/analysis";

/**
 * Registre des analyses en cours, en memoire. Les rapports termines sont
 * persistes sur disque par store.ts ; ce registre ne sert qu'a suivre la
 * progression pendant le traitement.
 *
 * Il est attache a globalThis pour survivre au rechargement a chaud de Next
 * en developpement, sinon une analyse lancee avant une modification de code
 * deviendrait introuvable.
 */
interface JobRegistry {
  jobs: Map<string, Job>;
  bus: EventEmitter;
}

const globalStore = globalThis as unknown as { __creativeLabJobs?: JobRegistry };

const registry: JobRegistry =
  globalStore.__creativeLabJobs ??
  (globalStore.__creativeLabJobs = {
    jobs: new Map(),
    bus: (() => {
      const e = new EventEmitter();
      // Un job peut avoir plusieurs onglets abonnes a son flux SSE.
      e.setMaxListeners(50);
      return e;
    })(),
  });

function etapes(origine: "url" | "fichier"): { id: StepId; label: string }[] {
  return [
    {
      id: "acquisition",
      label: origine === "url" ? "Récupération de la vidéo" : "Réception du fichier",
    },
    { id: "media", label: "Extraction de l'audio et des images clés" },
    { id: "transcription", label: "Transcription du script" },
    { id: "analyse_creative", label: "Analyse créative et sourcing" },
    { id: "sourcing_dz", label: "Dossier de lancement Algérie" },
    { id: "finalisation", label: "Génération du rapport" },
  ];
}

export function createJob(
  id: string,
  url: string,
  origine: "url" | "fichier",
  proprietaireId?: string,
): Job {
  const job: Job = {
    id,
    url,
    origine,
    proprietaireId,
    status: "en_attente",
    steps: etapes(origine).map((e) => ({ ...e, status: "attente" })),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  registry.jobs.set(id, job);
  emit(job);
  return job;
}

export function getJob(id: string): Job | undefined {
  return registry.jobs.get(id);
}

function emit(job: Job): void {
  job.updatedAt = Date.now();
  registry.bus.emit(job.id, job);
}

export function startStep(id: string, step: StepId, detail?: string): void {
  const job = registry.jobs.get(id);
  if (!job) return;
  job.status = "en_cours";
  const s = job.steps.find((x) => x.id === step);
  if (s) {
    s.status = "en_cours";
    s.startedAt = Date.now();
    if (detail) s.detail = detail;
  }
  emit(job);
}

export function finishStep(id: string, step: StepId, detail?: string): void {
  const job = registry.jobs.get(id);
  if (!job) return;
  const s = job.steps.find((x) => x.id === step);
  if (s) {
    s.status = "ok";
    s.endedAt = Date.now();
    if (detail) s.detail = detail;
  }
  emit(job);
}

export function skipStep(id: string, step: StepId, detail: string): void {
  const job = registry.jobs.get(id);
  if (!job) return;
  const s = job.steps.find((x) => x.id === step);
  if (s) {
    s.status = "ignore";
    s.endedAt = Date.now();
    s.detail = detail;
  }
  emit(job);
}

export function updateStepDetail(id: string, step: StepId, detail: string): void {
  const job = registry.jobs.get(id);
  if (!job) return;
  const s = job.steps.find((x) => x.id === step);
  if (s) s.detail = detail;
  emit(job);
}

export function failJob(id: string, message: string, step?: StepId): void {
  const job = registry.jobs.get(id);
  if (!job) return;
  job.status = "erreur";
  job.error = message;
  // Un echec a la recuperation depuis une plateforme se rattrape en deposant
  // le fichier : l'interface doit pouvoir proposer cette issue.
  if (job.origine === "url" && job.steps.find((s) => s.id === "acquisition")?.status !== "ok") {
    job.echecTelechargement = true;
  }
  const target: JobStep | undefined = step
    ? job.steps.find((x) => x.id === step)
    : job.steps.find((x) => x.status === "en_cours");
  if (target) {
    target.status = "echec";
    target.endedAt = Date.now();
    target.detail = message;
  }
  emit(job);
}

export function completeJob(id: string): void {
  const job = registry.jobs.get(id);
  if (!job) return;
  job.status = "termine";
  job.reportReady = true;
  emit(job);
}

/** Abonnement au flux de progression d'un job. Retourne la fonction de desabonnement. */
export function subscribe(id: string, listener: (job: Job) => void): () => void {
  registry.bus.on(id, listener);
  return () => registry.bus.off(id, listener);
}

/** Purge les jobs termines de plus de deux heures pour borner la memoire. */
export function pruneJobs(): void {
  const limite = Date.now() - 2 * 60 * 60 * 1000;
  for (const [id, job] of registry.jobs) {
    if (job.updatedAt < limite && job.status !== "en_cours") registry.jobs.delete(id);
  }
}
