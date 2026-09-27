/* ============================================================================
   Execute une seule fois, au demarrage du serveur.

   Rend les credits des analyses que le redemarrage precedent a interrompues
   (voir lib/debits-en-cours.ts). L'import doit rester DANS le test du
   runtime : ce fichier est aussi compile pour l'environnement edge, qui n'a
   ni disque ni node:crypto, et c'est cette forme exacte qui permet au
   compilateur d'ecarter le code serveur de cette version-la.
   ========================================================================== */

export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { demarrageServeur } = await import("./lib/demarrage");
    demarrageServeur();
  }
}
