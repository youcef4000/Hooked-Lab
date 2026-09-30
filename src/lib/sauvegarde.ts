import { createReadStream, existsSync, mkdirSync, readdirSync, renameSync, statSync, writeFileSync } from "node:fs";
import { Readable } from "node:stream";
import path from "node:path";
import { DATA_DIR } from "./paths";

/* ============================================================================
   Sauvegarde des donnees dans Cloudflare R2.

   Sur Cloudflare Containers, le disque du conteneur est efface a chaque
   redemarrage (mise a jour, mise en veille, maintenance). L'application
   continue de lire et d'ecrire sur son disque local — rapide, simple, et
   identique au developpement — mais chaque fichier enregistre est aussitot
   recopie dans R2. Au demarrage, tout est rapatrie avant de servir la
   moindre page.

   Le conteneur ne detient aucune cle R2 : il parle en HTTP a une adresse
   interne (STOCKAGE_URL) que le Worker Cloudflare intercepte et traduit en
   operations sur le bucket (voir cloudflare/stockage.ts).

   Sans STOCKAGE_URL (developpement, tests), tout ce module est inerte.

   Ce qui est rapatrie au demarrage : comptes, credits, codes, paiements,
   commandes, journaux, debits en cours et le rapport de chaque analyse.
   Les medias lourds d'une analyse (video, audio, images) restent dans R2
   et ne descendent qu'a la premiere demande (voir recupererSiAbsent).
   ========================================================================== */

const URL_STOCKAGE = process.env.STOCKAGE_URL?.trim().replace(/\/+$/, "") ?? "";

export const sauvegardeActive = URL_STOCKAGE !== "";

type Operation = { type: "ecrire" } | { type: "supprimer" } | { type: "supprimerDossier" };

interface Etat {
  /** Derniere operation demandee par cle : seule la plus recente compte. */
  file: Map<string, Operation>;
  /** Empreinte (taille + date) du dernier envoi reussi, pour ne pas renvoyer l'identique. */
  envoyes: Map<string, string>;
  enCours: boolean;
  attentes: Array<() => void>;
}

// Un seul etat par processus, meme si Next charge le module plusieurs fois.
const etat: Etat =
  (globalThis as { __hklSauvegarde?: Etat }).__hklSauvegarde ??
  ((globalThis as { __hklSauvegarde?: Etat }).__hklSauvegarde = {
    file: new Map(),
    envoyes: new Map(),
    enCours: false,
    attentes: [],
  });

/** Chemin local -> cle R2 ("comptes/utilisateurs.json"). null hors de DATA_DIR. */
function cleDe(chemin: string): string | null {
  const rel = path.relative(DATA_DIR, path.resolve(chemin));
  if (!rel || rel.startsWith("..") || path.isAbsolute(rel)) return null;
  const cle = rel.split(path.sep).join("/");
  // Fichiers de transit : jamais sauvegardes.
  if (cle.startsWith("uploads/") || cle.startsWith("models/") || cle.endsWith(".tmp") || cle.includes(".tmp-")) {
    return null;
  }
  return cle;
}

function empreinte(chemin: string): string | null {
  try {
    const s = statSync(chemin);
    return `${s.size}:${Math.round(s.mtimeMs)}`;
  } catch {
    return null;
  }
}

/* -------------------------------------------------------------- envois */

/** Demande la copie d'un fichier dans R2 (apres son ecriture sur le disque). */
export function sauvegarder(chemin: string): void {
  if (!sauvegardeActive) return;
  const cle = cleDe(chemin);
  if (!cle) return;
  etat.file.set(cle, { type: "ecrire" });
  lancer();
}

/** Copie tout le contenu d'un dossier (ex. une analyse terminee). */
export function sauvegarderDossier(dossier: string): void {
  if (!sauvegardeActive || !existsSync(dossier)) return;
  for (const entree of readdirSync(dossier, { withFileTypes: true })) {
    const chemin = path.join(dossier, entree.name);
    if (entree.isDirectory()) sauvegarderDossier(chemin);
    else sauvegarder(chemin);
  }
}

/** Demande la suppression d'un fichier, ou de tout un dossier, dans R2. */
export function oublier(chemin: string, dossier = false): void {
  if (!sauvegardeActive) return;
  const cle = cleDe(chemin);
  if (!cle) return;
  if (dossier) {
    const prefixe = cle.endsWith("/") ? cle : `${cle}/`;
    // Les envois en attente sous ce dossier n'ont plus lieu d'etre.
    for (const k of [...etat.file.keys()]) if (k.startsWith(prefixe)) etat.file.delete(k);
    for (const k of [...etat.envoyes.keys()]) if (k.startsWith(prefixe)) etat.envoyes.delete(k);
    etat.file.set(prefixe, { type: "supprimerDossier" });
  } else {
    etat.file.set(cle, { type: "supprimer" });
  }
  lancer();
}

async function appeler(chemin: string, init?: RequestInit & { duplex?: "half" }): Promise<Response> {
  return fetch(`${URL_STOCKAGE}${chemin}`, { ...init, signal: AbortSignal.timeout(120_000) });
}

async function executer(cle: string, op: Operation): Promise<void> {
  const q = `?cle=${encodeURIComponent(cle)}`;
  if (op.type === "supprimer") {
    const r = await appeler(`/objet${q}`, { method: "DELETE" });
    if (!r.ok && r.status !== 404) throw new Error(`suppression ${cle} : ${r.status}`);
    etat.envoyes.delete(cle);
    return;
  }
  if (op.type === "supprimerDossier") {
    const r = await appeler(`/dossier?prefixe=${encodeURIComponent(cle)}`, { method: "DELETE" });
    if (!r.ok) throw new Error(`suppression du dossier ${cle} : ${r.status}`);
    return;
  }

  const chemin = path.join(DATA_DIR, ...cle.split("/"));
  const avant = empreinte(chemin);
  // Le fichier a disparu entre-temps : rien a envoyer.
  if (!avant) return;
  if (etat.envoyes.get(cle) === avant) return;

  const taille = statSync(chemin).size;
  const r = await appeler(`/objet${q}`, {
    method: "PUT",
    headers: { "content-length": String(taille), "content-type": "application/octet-stream" },
    body: Readable.toWeb(createReadStream(chemin)) as unknown as BodyInit,
    duplex: "half",
  });
  if (!r.ok) throw new Error(`envoi ${cle} : ${r.status}`);
  etat.envoyes.set(cle, avant);
  // Modifie pendant l'envoi : on repasse.
  if (empreinte(chemin) !== avant && !etat.file.has(cle)) etat.file.set(cle, { type: "ecrire" });
}

/** Traite la file une operation a la fois, en recommencant apres une erreur. */
function lancer(): void {
  if (etat.enCours) return;
  etat.enCours = true;
  void (async () => {
    let echecs = 0;
    while (etat.file.size > 0) {
      const [cle, op] = etat.file.entries().next().value as [string, Operation];
      etat.file.delete(cle);
      try {
        await executer(cle, op);
        echecs = 0;
      } catch (err) {
        echecs++;
        console.error(`[sauvegarde] ${(err as Error).message} — nouvel essai`);
        // Remise en file, sauf si une operation plus recente l'a remplacee.
        if (!etat.file.has(cle)) etat.file.set(cle, op);
        await new Promise((r) => setTimeout(r, Math.min(30_000, 500 * 2 ** Math.min(echecs, 6))));
      }
    }
    etat.enCours = false;
    for (const reveil of etat.attentes.splice(0)) reveil();
  })();
}

/**
 * Attend que tout ce qui a ete ecrit soit dans R2. A appeler avant de
 * confirmer une operation qui ne doit jamais se perdre (paiement,
 * inscription) et a l'arret du serveur. Retourne false au bout du delai.
 */
export async function viderSauvegardes(delaiMs = 30_000): Promise<boolean> {
  if (!sauvegardeActive) return true;
  if (!etat.enCours && etat.file.size === 0) return true;
  return new Promise<boolean>((resoudre) => {
    const minuterie = setTimeout(() => resoudre(false), delaiMs);
    etat.attentes.push(() => {
      clearTimeout(minuterie);
      resoudre(true);
    });
    lancer();
  });
}

/* ---------------------------------------------------------- rapatriement */

interface ObjetListe {
  cle: string;
  taille: number;
}

async function lister(prefixe = ""): Promise<ObjetListe[]> {
  const objets: ObjetListe[] = [];
  let curseur = "";
  for (let page = 0; page < 10_000; page++) {
    const r = await appeler(`/liste?prefixe=${encodeURIComponent(prefixe)}&curseur=${encodeURIComponent(curseur)}`);
    if (!r.ok) throw new Error(`liste : ${r.status}`);
    const d = (await r.json()) as { objets: ObjetListe[]; curseur: string | null };
    objets.push(...d.objets);
    if (!d.curseur) break;
    curseur = d.curseur;
  }
  return objets;
}

async function telecharger(cle: string): Promise<boolean> {
  const r = await appeler(`/objet?cle=${encodeURIComponent(cle)}`);
  if (r.status === 404) return false;
  if (!r.ok || !r.body) throw new Error(`lecture ${cle} : ${r.status}`);
  const chemin = path.join(DATA_DIR, ...cle.split("/"));
  mkdirSync(path.dirname(chemin), { recursive: true });
  // Ecriture atomique : un fichier a moitie telecharge n'est jamais lu.
  const temporaire = `${chemin}.tmp-${process.pid}-${Math.random().toString(36).slice(2, 8)}`;
  writeFileSync(temporaire, Buffer.from(await r.arrayBuffer()));
  renameSync(temporaire, chemin);
  const e = empreinte(chemin);
  if (e) etat.envoyes.set(cle, e);
  return true;
}

/** Un media d'analyse (video, audio, image) : descendu a la demande seulement. */
function estMediaLourd(cle: string): boolean {
  return /^analyses\/[^/]+\/.+/.test(cle) && !/^analyses\/[^/]+\/rapport\.json$/.test(cle);
}

/**
 * Rapatrie les donnees au demarrage, avant de servir la moindre requete.
 * Relance tant que R2 ne repond pas : demarrer avec un disque vide ferait
 * croire aux abonnes que leur compte a disparu.
 */
export async function restaurer(): Promise<void> {
  if (!sauvegardeActive) return;
  const debut = Date.now();
  for (let essai = 1; ; essai++) {
    try {
      const objets = (await lister()).filter((o) => !estMediaLourd(o.cle) && cleDe(path.join(DATA_DIR, o.cle)));
      // Par petits paquets en parallele : quelques centaines de fichiers
      // descendent en quelques secondes.
      for (let i = 0; i < objets.length; i += 16) {
        await Promise.all(objets.slice(i, i + 16).map((o) => telecharger(o.cle)));
      }
      console.log(`[sauvegarde] ${objets.length} fichier(s) rapatrie(s) de R2 en ${Date.now() - debut} ms.`);
      return;
    } catch (err) {
      console.error(`[sauvegarde] rapatriement impossible (essai ${essai}) : ${(err as Error).message}`);
      await new Promise((r) => setTimeout(r, Math.min(15_000, 1000 * essai)));
    }
  }
}

const enVol = new Map<string, Promise<boolean>>();

/**
 * Descend un fichier de R2 s'il manque sur le disque. true s'il est
 * disponible. Deux demandes simultanees du meme fichier partagent le meme
 * telechargement.
 */
export async function recupererSiAbsent(chemin: string): Promise<boolean> {
  if (existsSync(chemin)) return true;
  if (!sauvegardeActive) return false;
  const cle = cleDe(chemin);
  if (!cle) return false;
  const deja = enVol.get(cle);
  if (deja) return deja;
  const tache = telecharger(cle)
    .catch((err) => {
      console.error(`[sauvegarde] ${(err as Error).message}`);
      return false;
    })
    .finally(() => enVol.delete(cle));
  enVol.set(cle, tache);
  return tache;
}
