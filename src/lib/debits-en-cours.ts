import { existsSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { DATA_DIR, ensureDir } from "./paths";
import { crediter } from "./comptes";
import { journaliser } from "./codes";
import { oublier, sauvegarder } from "./sauvegarde";

/* ============================================================================
   Debits en vol.

   Une analyse preleve ses credits au lancement et ne les rend qu'en cas
   d'echec. Si le serveur redemarre entre les deux — une mise a jour, un
   plantage — l'analyse disparait avec la memoire du processus, et le client
   perdait ses credits sans rien recevoir.

   Chaque debit est donc note sur le disque persistant tant que l'analyse
   tourne, puis efface a la fin, qu'elle reussisse ou echoue. Au demarrage,
   tout debit encore note appartient forcement a une analyse morte avec
   l'ancien processus : il est rendu (voir instrumentation.ts).
   ========================================================================== */

const DOSSIER = path.join(DATA_DIR, "comptes", "debits-en-cours");

interface Debit {
  analyseId: string;
  utilisateurId: string;
  montant: number;
  le: string;
}

function fichier(analyseId: string): string | null {
  return /^[a-z0-9-]+$/i.test(analyseId) ? path.join(ensureDir(DOSSIER), `${analyseId}.json`) : null;
}

/** Note (ou met a jour) le montant preleve pour une analyse en cours. */
export function noterDebit(analyseId: string, utilisateurId: string | undefined, montant: number): void {
  const f = fichier(analyseId);
  if (!f || !utilisateurId || montant <= 0) return;
  const debit: Debit = { analyseId, utilisateurId, montant, le: new Date().toISOString() };
  const temporaire = `${f}.tmp`;
  writeFileSync(temporaire, JSON.stringify(debit), "utf8");
  renameSync(temporaire, f);
  sauvegarder(f);
}

/** L'analyse est terminee (reussie, ou echouee et remboursee) : plus rien a rendre. */
export function solderDebit(analyseId: string): void {
  const f = fichier(analyseId);
  if (!f) return;
  rmSync(f, { force: true });
  oublier(f);
}

/** Appele une fois au demarrage : rend les credits des analyses interrompues. */
export function rembourserDebitsOrphelins(): number {
  if (!existsSync(DOSSIER)) return 0;
  let rendus = 0;

  for (const nom of readdirSync(DOSSIER)) {
    if (!nom.endsWith(".json")) continue;
    const f = path.join(DOSSIER, nom);
    try {
      const d = JSON.parse(readFileSync(f, "utf8")) as Debit;
      if (d.utilisateurId && d.montant > 0 && crediter(d.utilisateurId, d.montant).ok) {
        journaliser("remboursement_redemarrage", {
          utilisateur: d.utilisateurId,
          analyse: d.analyseId,
          credits: d.montant,
        });
        rendus++;
      }
    } catch {
      /* fichier illisible : on le retire pour ne pas bloquer les suivants */
    }
    rmSync(f, { force: true });
    oublier(f);
  }
  return rendus;
}
