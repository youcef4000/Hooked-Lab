import { readFileSync, writeFileSync, existsSync, readdirSync, rmSync, statSync } from "node:fs";
import { ANALYSES_DIR, analysisDir, analysisFile, ensureDir } from "./paths";
import type { Report, ReportSummary } from "@/types/analysis";

const REPORT_FILE = "rapport.json";

export function saveReport(report: Report): void {
  ensureDir(analysisDir(report.id));
  writeFileSync(analysisFile(report.id, REPORT_FILE), JSON.stringify(report, null, 2), "utf8");
}

export function getReport(id: string): Report | null {
  if (!/^[a-z0-9-]+$/i.test(id)) return null;
  const file = analysisFile(id, REPORT_FILE);
  if (!existsSync(file)) return null;
  try {
    return JSON.parse(readFileSync(file, "utf8")) as Report;
  } catch {
    return null;
  }
}

export function deleteReport(id: string): boolean {
  if (!/^[a-z0-9-]+$/i.test(id)) return false;
  const dir = analysisDir(id);
  if (!existsSync(dir)) return false;
  rmSync(dir, { recursive: true, force: true });
  return true;
}

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
  };
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

/** Historique des analyses, de la plus recente a la plus ancienne. */
export function listReports(): ReportSummary[] {
  ensureDir(ANALYSES_DIR);
  const summaries: ReportSummary[] = [];

  for (const entry of readdirSync(ANALYSES_DIR, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const report = getReport(entry.name);
    // Un dossier sans rapport correspond a une analyse interrompue : on l'ignore.
    if (report) summaries.push(toSummary(report));
  }

  return summaries.sort((a, b) => b.createdAt - a.createdAt);
}
