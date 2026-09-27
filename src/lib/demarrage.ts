import { rembourserDebitsOrphelins } from "./debits-en-cours";

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
}
