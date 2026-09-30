import { rembourserDebitsOrphelins } from "./debits-en-cours";
import { attendreFinAnalyses, demanderArret, etatFileAnalyses } from "./pipeline";
import { restaurer, sauvegardeActive, viderSauvegardes } from "./sauvegarde";

/**
 * Delai laisse aux analyses en cours quand l'hebergeur demande l'arret.
 * Cloudflare accorde 15 minutes avant de couper : DELAI_ARRET_S=780 y laisse
 * finir toute analyse et laisse encore le temps d'envoyer les donnees dans
 * R2. Par defaut, 285 s.
 */
const DELAI_ARRET_MS = (Number(process.env.DELAI_ARRET_S) > 0 ? Number(process.env.DELAI_ARRET_S) : 285) * 1000;

type EtatArret = { lance: boolean };
const arret: EtatArret =
  (globalThis as { __hklArret?: EtatArret }).__hklArret ??
  ((globalThis as { __hklArret?: EtatArret }).__hklArret = { lance: false });

/**
 * Arret propre : plus de nouvelle analyse, celles en cours se terminent,
 * tout ce qui a ete ecrit part dans R2, puis le processus s'arrete. Sur
 * Cloudflare, la requete suivante relance aussitot un conteneur neuf.
 */
export async function arreterProprement(motif: string): Promise<void> {
  if (arret.lance) return;
  arret.lance = true;
  demanderArret();
  const { enCours, enAttente } = etatFileAnalyses();
  console.log(`[hooked-lab] ${motif} : ${enCours} analyse(s) en cours, ${enAttente} en file. Fin propre...`);
  const vide = await attendreFinAnalyses(DELAI_ARRET_MS);
  // Tout ce qui a ete ecrit doit etre dans R2 avant que le disque disparaisse.
  const sauve = await viderSauvegardes(60_000);
  console.log(`[hooked-lab] Arret ${vide ? "propre" : "au bout du delai"}${sauve ? "" : " (sauvegarde incomplete)"}.`);
  // Une seconde pour que les reponses deja en route partent.
  await new Promise((r) => setTimeout(r, 1000));
  process.exit(0);
}

/**
 * Le Worker Cloudflare joint a chaque requete l'empreinte des reglages
 * actuels. Differente de celle recue au demarrage : un secret a ete ajoute
 * ou modifie depuis (cle Stripe, pixel...). On redemarre proprement pour le
 * prendre en compte.
 */
export function verifierReglages(empreinteActuelle: string | null): void {
  const auDemarrage = process.env.CONFIG_EMPREINTE?.trim();
  if (!auDemarrage || !empreinteActuelle || empreinteActuelle === auDemarrage) return;
  if (!/^[0-9a-f]{8}$/.test(empreinteActuelle)) return;
  void arreterProprement("Nouveaux reglages publies");
}

/** Travaux a faire une fois au demarrage du serveur Node (voir instrumentation.ts). */
export async function demarrageServeur(): Promise<void> {
  // Sur Cloudflare, le disque est vide a chaque demarrage : on rapatrie
  // comptes, credits et rapports AVANT tout le reste, remboursements compris.
  if (sauvegardeActive) await restaurer();

  try {
    const rendus = rembourserDebitsOrphelins();
    if (rendus > 0) {
      console.log(`[hooked-lab] ${rendus} analyse(s) interrompue(s) remboursee(s) au demarrage.`);
    }
  } catch (err) {
    console.error("[hooked-lab] Remboursement des analyses interrompues impossible :", err);
  }

  // Next gere lui-meme les signaux d'arret, sauf si NEXT_MANUAL_SIG_HANDLE est
  // pose : c'est alors a nous d'arreter proprement.
  if (process.env.NEXT_MANUAL_SIG_HANDLE) {
    process.on("SIGTERM", () => void arreterProprement("SIGTERM recu"));
    process.on("SIGINT", () => void arreterProprement("SIGINT recu"));
  }
}
