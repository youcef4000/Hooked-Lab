import { rembourserDebitsOrphelins } from "./debits-en-cours";
import { attendreFinAnalyses, demanderArret, etatFileAnalyses } from "./pipeline";

/** Delai laisse aux analyses en cours : juste sous les 300 s accordees par Render. */
const DELAI_ARRET_MS = 285_000;

/** Travaux a faire une fois au demarrage du serveur Node (voir instrumentation.ts). */
export function demarrageServeur(): void {
  try {
    const rendus = rembourserDebitsOrphelins();
    if (rendus > 0) {
      console.log(`[hooked-lab] ${rendus} analyse(s) interrompue(s) remboursee(s) au demarrage.`);
    }
  } catch (err) {
    console.error("[hooked-lab] Remboursement des analyses interrompues impossible :", err);
  }

  // Next gere lui-meme les signaux d'arret, sauf si NEXT_MANUAL_SIG_HANDLE est
  // pose (render.yaml) : c'est alors a nous d'arreter proprement.
  if (process.env.NEXT_MANUAL_SIG_HANDLE) {
    let deja = false;
    const arreter = async (signal: string) => {
      if (deja) return;
      deja = true;
      demanderArret();
      const { enCours, enAttente } = etatFileAnalyses();
      console.log(`[hooked-lab] ${signal} recu : ${enCours} analyse(s) en cours, ${enAttente} en file. Fin propre...`);
      const vide = await attendreFinAnalyses(DELAI_ARRET_MS);
      console.log(`[hooked-lab] Arret ${vide ? "propre" : "au bout du delai"}.`);
      process.exit(0);
    };
    process.on("SIGTERM", () => void arreter("SIGTERM"));
    process.on("SIGINT", () => void arreter("SIGINT"));
  }
}
