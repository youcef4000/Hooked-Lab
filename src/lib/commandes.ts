import { appendFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { DATA_DIR, ensureDir } from "./paths";
import {
  LIBELLE_STATUT,
  STATUTS,
  normaliserTelephone,
  telephoneValide,
  type Commande,
  type StatutCommande,
} from "./commandes-types";
import { sauvegarder } from "./sauvegarde";

export { STATUTS, LIBELLE_STATUT, telephoneValide, normaliserTelephone } from "./commandes-types";
export type { Commande, StatutCommande } from "./commandes-types";

/* ============================================================================
   Registre des commandes recues par les formulaires.

   Un fichier JSONL : une commande par ligne, ajoutee en append. C'est le
   format qui resiste le mieux a une coupure de courant en pleine ecriture —
   au pire on perd la derniere ligne, jamais le fichier entier. A l'echelle
   d'un vendeur COD (quelques milliers de commandes par an) la relecture
   integrale coute quelques millisecondes ; le jour ou ca devient un vrai SaaS
   multi-vendeurs, c'est une table Postgres qu'il faudra, pas un fichier.

   Le statut suit la vraie chaine algerienne : une commande n'est pas un
   encaissement. Elle passe par un appel de confirmation, puis une livraison
   qui peut echouer. Les deux etapes ont leur taux de perte, et c'est
   exactement ce que mesure la page admin.
   ========================================================================== */

const COMMANDES_DIR = path.join(DATA_DIR, "commandes");
const FICHIER = path.join(COMMANDES_DIR, "commandes.jsonl");

function fichier(): string {
  ensureDir(COMMANDES_DIR);
  return FICHIER;
}

/** Champs acceptes depuis l'exterieur, bornes pour qu'un envoi hostile ne remplisse pas le disque. */
function texte(v: unknown, max: number): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

function nombre(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : 0;
}

export interface ResultatDepot {
  ok: boolean;
  /** Message destine au formulaire, en francais. */
  message?: string;
  commande?: Commande;
}

/**
 * Valide puis enregistre une commande venue d'un formulaire.
 * Le formulaire valide deja cote client, mais rien n'empeche un envoi direct :
 * on revalide donc tout ici, seul endroit ou la verification compte.
 */
export function deposerCommande(brut: unknown): ResultatDepot {
  if (!brut || typeof brut !== "object") return { ok: false, message: "Requête vide." };
  const d = brut as Record<string, unknown>;

  const nom = texte(d.nom, 80);
  const telephone = normaliserTelephone(texte(d.telephone, 30));
  const wilaya = texte(d.wilaya, 40);
  const commune = texte(d.commune, 60);

  if (nom.length < 3) return { ok: false, message: "Nom manquant ou trop court." };
  if (!telephoneValide(telephone)) return { ok: false, message: "Numéro de téléphone invalide." };
  if (!wilaya) return { ok: false, message: "Wilaya manquante." };
  if (!commune) return { ok: false, message: "Commune manquante." };

  const commande: Commande = {
    id: `cmd_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    recueLe: new Date().toISOString(),
    statut: "nouvelle",
    produit: texte(d.produit, 120),
    nom,
    telephone,
    wilaya_code: texte(d.wilaya_code, 2),
    wilaya,
    commune,
    livraison: texte(d.livraison, 20),
    frais_livraison: nombre(d.frais_livraison),
    prix_produit: nombre(d.prix_produit),
    total: nombre(d.total),
    page: texte(d.page, 300),
  };

  appendFileSync(fichier(), JSON.stringify(commande) + "\n", "utf8");
  sauvegarder(fichier());
  return { ok: true, commande };
}

/** Toutes les commandes, de la plus recente a la plus ancienne. */
export function listerCommandes(): Commande[] {
  const f = fichier();
  if (!existsSync(f)) return [];
  const lignes = readFileSync(f, "utf8").split("\n");
  const out: Commande[] = [];
  for (const ligne of lignes) {
    if (!ligne.trim()) continue;
    try {
      out.push(JSON.parse(ligne) as Commande);
    } catch {
      // Ligne tronquee par une coupure : on l'ignore plutot que de tout perdre.
    }
  }
  return out.reverse();
}

/** Reecrit le fichier entier. Seul chemin d'ecriture non-append : statut, note, suppression. */
function reecrire(commandes: Commande[]): void {
  const contenu = commandes.map((c) => JSON.stringify(c)).join("\n");
  writeFileSync(fichier(), contenu ? contenu + "\n" : "", "utf8");
  sauvegarder(fichier());
}

export function majCommande(
  id: string,
  champs: { statut?: StatutCommande; note?: string },
): Commande | null {
  const toutes = listerCommandes().reverse(); // remise dans l'ordre du fichier
  const i = toutes.findIndex((c) => c.id === id);
  if (i === -1) return null;
  if (champs.statut && STATUTS.includes(champs.statut)) toutes[i].statut = champs.statut;
  if (champs.note !== undefined) toutes[i].note = champs.note.slice(0, 500);
  reecrire(toutes);
  return toutes[i];
}

export function supprimerCommande(id: string): boolean {
  const toutes = listerCommandes().reverse();
  const restantes = toutes.filter((c) => c.id !== id);
  if (restantes.length === toutes.length) return false;
  reecrire(restantes);
  return true;
}

export interface StatsCommandes {
  total: number;
  parStatut: Record<StatutCommande, number>;
  /** Encaisse reellement : seules les commandes livrees rapportent. */
  chiffreAffaires: number;
  /** Ce qui est encore en jeu : nouvelles, confirmees, expediees. */
  enCours: number;
  tauxConfirmation: number | null;
  tauxLivraison: number | null;
  parWilaya: { wilaya: string; nombre: number; livrees: number }[];
  parJour: { jour: string; nombre: number }[];
}

export function statistiques(commandes: Commande[]): StatsCommandes {
  const parStatut = Object.fromEntries(STATUTS.map((s) => [s, 0])) as Record<
    StatutCommande,
    number
  >;
  let chiffreAffaires = 0;
  let enCours = 0;
  const wilayas = new Map<string, { nombre: number; livrees: number }>();
  const jours = new Map<string, number>();

  for (const c of commandes) {
    parStatut[c.statut] = (parStatut[c.statut] ?? 0) + 1;
    if (c.statut === "livree") chiffreAffaires += c.total;
    if (c.statut === "nouvelle" || c.statut === "confirmee" || c.statut === "expediee") enCours++;

    const w = wilayas.get(c.wilaya) ?? { nombre: 0, livrees: 0 };
    w.nombre++;
    if (c.statut === "livree") w.livrees++;
    wilayas.set(c.wilaya, w);

    const jour = c.recueLe.slice(0, 10);
    jours.set(jour, (jours.get(jour) ?? 0) + 1);
  }

  // Le taux de confirmation se mesure sur les commandes tranchees : une
  // commande encore "nouvelle" n'a pas encore eu sa chance d'etre confirmee,
  // la compter comme un echec ferait mentir le chiffre.
  const tranchees = commandes.length - parStatut.nouvelle;
  const confirmees = parStatut.confirmee + parStatut.expediee + parStatut.livree + parStatut.retournee;
  const parties = parStatut.livree + parStatut.retournee;

  return {
    total: commandes.length,
    parStatut,
    chiffreAffaires,
    enCours,
    tauxConfirmation: tranchees > 0 ? confirmees / tranchees : null,
    tauxLivraison: parties > 0 ? parStatut.livree / parties : null,
    parWilaya: [...wilayas.entries()]
      .map(([wilaya, v]) => ({ wilaya, ...v }))
      .sort((a, b) => b.nombre - a.nombre),
    parJour: [...jours.entries()].map(([jour, nombre]) => ({ jour, nombre })).sort((a, b) => a.jour.localeCompare(b.jour)),
  };
}

/** Export CSV, ouvrable directement dans Excel. */
export function versCSV(commandes: Commande[]): string {
  const enTetes = [
    "Date",
    "Statut",
    "Produit",
    "Nom",
    "Telephone",
    "Wilaya",
    "Commune",
    "Livraison",
    "Frais",
    "Total",
    "Note",
  ];
  const echapper = (v: string | number) => {
    const s = String(v ?? "");
    return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lignes = commandes.map((c) =>
    [
      new Date(c.recueLe).toLocaleString("fr-DZ"),
      LIBELLE_STATUT[c.statut],
      c.produit,
      c.nom,
      // L'apostrophe protege le zero initial quand Excel ouvre le fichier.
      "'" + c.telephone,
      `${c.wilaya_code} - ${c.wilaya}`,
      c.commune,
      c.livraison,
      c.frais_livraison,
      c.total,
      c.note ?? "",
    ]
      .map(echapper)
      .join(";"),
  );
  return [enTetes.join(";"), ...lignes].join("\n");
}
