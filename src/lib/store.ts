import { readFileSync, writeFileSync, existsSync, readdirSync, renameSync, rmSync, statSync } from "node:fs";
import { ANALYSES_DIR, analysisDir, analysisFile, ensureDir } from "./paths";
import type { Report, ReportSummary } from "@/types/analysis";

const REPORT_FILE = "rapport.json";

/* ============================================================================
   Index des analyses, en memoire.

   Lister l'historique relisait chaque rapport sur le disque — une centaine
   de fichiers de 100 Ko a chaque affichage de page. L'index garde le resume
   de chaque rapport, se construit une seule fois au premier besoin, puis
   suit les ecritures et suppressions. Une seule instance tourne : il ne
   peut pas se desynchroniser du disque.
   ========================================================================== */

type Index = Map<string, ReportSummary>;
const memoire = globalThis as unknown as { __hklIndexAnalyses?: Index };

function toSummary(report: Report): ReportSummary {
  return {
    id: report.id,
    createdAt: report.createdAt,
    url: report.url,
    platform: report.source.platform,
    titre: report.source.titre?.slice(0, 120) || report.creative.produit.nom_fr,
    produit: report.creative.produit.nom_fr,
    miniature: report.media.frames[0]?.file,
    score: report.dz.score.global_sur_100,
    proprietaireId: report.proprietaireId,
    demo: report.demo === true,
  };
}

function index(): Index {
  if (memoire.__hklIndexAnalyses) return memoire.__hklIndexAnalyses;
  const idx: Index = new Map();
  ensureDir(ANALYSES_DIR);
  for (const entry of readdirSync(ANALYSES_DIR, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const report = lireRapport(entry.name);
    // Un dossier sans rapport correspond a une analyse interrompue : on l'ignore.
    if (report) idx.set(report.id, toSummary(report));
  }
  memoire.__hklIndexAnalyses = idx;
  return idx;
}

function idValide(id: string): boolean {
  return /^[a-z0-9-]+$/i.test(id);
}

function lireRapport(id: string): Report | null {
  if (!idValide(id)) return null;
  const file = analysisFile(id, REPORT_FILE);
  if (!existsSync(file)) return null;
  try {
    return JSON.parse(readFileSync(file, "utf8")) as Report;
  } catch {
    return null;
  }
}

export function saveReport(report: Report): void {
  ensureDir(analysisDir(report.id));
  // Ecriture atomique : un rapport a moitie ecrit serait illisible, donc perdu.
  const cible = analysisFile(report.id, REPORT_FILE);
  const temporaire = `${cible}.${process.pid}.tmp`;
  writeFileSync(temporaire, JSON.stringify(report, null, 2), "utf8");
  renameSync(temporaire, cible);
  index().set(report.id, toSummary(report));
}

export function getReport(id: string): Report | null {
  return lireRapport(id);
}

/** Resume d'un rapport sans relire le fichier : sert aux controles d'acces. */
export function getSummary(id: string): ReportSummary | null {
  return index().get(id) ?? null;
}

export function deleteReport(id: string): boolean {
  if (!idValide(id)) return false;
  const dir = analysisDir(id);
  index().delete(id);
  if (!existsSync(dir)) return false;
  rmSync(dir, { recursive: true, force: true });
  return true;
}

/** Marque ou retire une analyse de la vitrine publique. */
export function definirDemo(id: string, demo: boolean): boolean {
  const report = lireRapport(id);
  if (!report) return false;
  report.demo = demo || undefined;
  saveReport(report);
  return true;
}

/**
 * Supprime les dossiers d'analyse restes sans rapport : ce sont des analyses
 * interrompues, invisibles dans l'historique, mais qui gardent sur le disque la
 * video copiee au demarrage. Le delai d'une heure protege les analyses en cours.
 */
export function purgerAnalysesOrphelines(): void {
  ensureDir(ANALYSES_DIR);
  const limite = Date.now() - 60 * 60 * 1000;

  for (const entry of readdirSync(ANALYSES_DIR, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const dir = analysisDir(entry.name);
    if (existsSync(analysisFile(entry.name, REPORT_FILE))) continue;

    try {
      if (statSync(dir).mtimeMs < limite) rmSync(dir, { recursive: true, force: true });
    } catch {
      /* dossier deja supprime ou verrouille */
    }
  }
}

/** Toutes les analyses, de la plus recente a la plus ancienne. Reserve a l'administration. */
export function listReports(): ReportSummary[] {
  return [...index().values()].sort((a, b) => b.createdAt - a.createdAt);
}

/** Les analyses d'un abonne, et seulement les siennes. */
export function listReportsDe(utilisateurId: string): ReportSummary[] {
  return listReports().filter((r) => r.proprietaireId === utilisateurId);
}

/** Les analyses choisies comme exemples pour les visiteurs. */
export function listDemos(): ReportSummary[] {
  return listReports().filter((r) => r.demo);
}
