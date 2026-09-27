import { appendFileSync, existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { DATA_DIR, ensureDir } from "./paths";

/* ============================================================================
   Journal des analyses echouees.

   Le client recoit un message simple ("service momentanement indisponible,
   credits rendus"). Le vrai motif — credit Anthropic epuise, cle revoquee,
   plateforme qui bloque — atterrit ici, et s'affiche dans Admin > Systeme :
   c'est la que le proprietaire apprend qu'il doit recharger son compte
   Anthropic, avant que ses clients ne s'en plaignent.
   ========================================================================== */

const FICHIER = path.join(DATA_DIR, "incidents.jsonl");

export interface Incident {
  le: string;
  analyseId: string;
  utilisateurId?: string;
  etape?: string;
  message: string;
}

export function noterIncident(incident: Omit<Incident, "le">): void {
  try {
    ensureDir(DATA_DIR);
    appendFileSync(FICHIER, JSON.stringify({ le: new Date().toISOString(), ...incident }) + "\n", "utf8");
  } catch {
    /* le journal ne doit jamais faire echouer autre chose */
  }
  // Visible aussi dans les logs de l'hebergeur.
  console.error(`[analyse ${incident.analyseId}] ${incident.etape ?? "?"} : ${incident.message}`);
}

/** Les incidents les plus recents d'abord. */
export function derniersIncidents(nombre = 20): Incident[] {
  if (!existsSync(FICHIER)) return [];
  try {
    const lignes = readFileSync(FICHIER, "utf8").trim().split("\n").filter(Boolean);
    return lignes
      .slice(-nombre)
      .reverse()
      .map((l) => JSON.parse(l) as Incident);
  } catch {
    return [];
  }
}
