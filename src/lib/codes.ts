import { appendFileSync, existsSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { randomInt } from "node:crypto";
import path from "node:path";
import { DATA_DIR, ensureDir } from "./paths";
import { appliquerAbonnement, trouverParId } from "./comptes";
import { ENGAGEMENTS, PALIERS, RECHARGES, creditsBonus } from "./tarifs";

/* ============================================================================
   Codes d'activation.

   Le modele est celui de la carte de recharge telephonique, que tout le monde
   connait ici : le client paie par BaridiMob ou CCP, envoie sa preuve, on lui
   remet un code, il le saisit et son compte est charge. Aucune passerelle de
   paiement, aucune commission, et un appel telephonique au milieu — c'est cet
   appel qui vaut le plus cher au demarrage.

   Un code est a usage unique. On note qui l'a utilise et quand : en cas de
   litige, l'historique tranche.
   ========================================================================== */

/** Alphabet sans 0/O ni 1/I/L : ces caracteres se confondent quand on dicte un code au telephone. */
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export type TypeCode = "abonnement" | "recharge";

export interface CodeActivation {
  code: string;
  type: TypeCode;
  credits: number;
  /** Nom du palier pour un abonnement, libelle de la recharge sinon. */
  palier: string;
  /** Duree ajoutee a l'abonnement, en jours. Une recharge n'en ajoute pas. */
  dureeJours: number;
  /** Montant encaisse, en dinars : sert au chiffre d'affaires de l'admin. */
  montantDzd: number;
  creeLe: string;
  /** Note libre : "Karim 0661… BaridiMob 12/03". */
  note: string;
  utiliseLe: string | null;
  utilisePar: string | null;
  /** Un code peut etre annule tant qu'il n'a pas servi. */
  annule: boolean;
}

const CODES_DIR = path.join(DATA_DIR, "comptes");
const FICHIER = path.join(CODES_DIR, "codes.json");

function chemin(): string {
  ensureDir(CODES_DIR);
  return FICHIER;
}

export function listerCodes(): CodeActivation[] {
  const f = chemin();
  if (!existsSync(f)) return [];
  try {
    const donnees = JSON.parse(readFileSync(f, "utf8")) as CodeActivation[];
    return Array.isArray(donnees) ? donnees : [];
  } catch {
    return [];
  }
}

function enregistrer(codes: CodeActivation[]): void {
  const f = chemin();
  const temporaire = `${f}.${process.pid}.tmp`;
  writeFileSync(temporaire, JSON.stringify(codes, null, 2), "utf8");
  renameSync(temporaire, f);
}

/** Format HK-XXXX-XXXX : lisible au telephone, difficile a deviner. */
function tirerCode(): string {
  const bloc = () =>
    Array.from({ length: 4 }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");
  return `HK-${bloc()}-${bloc()}`;
}

export function normaliserCode(brut: string): string {
  // On accepte que le client tape en minuscules, avec ou sans tirets.
  const propre = String(brut).toUpperCase().replace(/[^A-Z0-9]/g, "");
  const sansPrefixe = propre.startsWith("HK") ? propre.slice(2) : propre;
  if (sansPrefixe.length !== 8) return "";
  return `HK-${sansPrefixe.slice(0, 4)}-${sansPrefixe.slice(4)}`;
}

/* ------------------------------------------------------------- generation */

export interface DemandeCode {
  type: TypeCode;
  /** Nom du palier ("Essentiel", "Pro", "Agence") ou credits de la recharge. */
  reference: string;
  /** Engagement en mois : 1, 6 ou 12. Ignore pour une recharge. */
  mois?: number;
  note?: string;
  /** Nombre de codes identiques a produire. */
  quantite?: number;
}

export interface ResultatGeneration {
  ok: boolean;
  message?: string;
  codes?: CodeActivation[];
}

/**
 * Fabrique un ou plusieurs codes a partir de la grille tarifaire.
 * Les credits et le montant ne sont jamais saisis a la main : ils sont
 * recalcules ici depuis tarifs.ts, pour qu'un code corresponde toujours a une
 * offre reelle.
 */
export function genererCodes(demande: DemandeCode): ResultatGeneration {
  const quantite = Math.max(1, Math.min(50, Math.round(demande.quantite ?? 1)));
  const note = String(demande.note ?? "").slice(0, 200);

  let credits: number;
  let palier: string;
  let dureeJours: number;
  let montantDzd: number;

  if (demande.type === "abonnement") {
    const p = PALIERS.find((x) => x.nom === demande.reference);
    if (!p) return { ok: false, message: "Palier inconnu." };

    const engagement = ENGAGEMENTS.find((e) => e.mois === (demande.mois ?? 1));
    if (!engagement) return { ok: false, message: "Durée d'engagement inconnue." };

    const mensuel = Math.round((p.base * (1 - engagement.remise)) / 100) * 100;
    credits =
      p.creditsMensuels * engagement.mois + creditsBonus(p.creditsMensuels, engagement.moisBonus);
    palier = p.nom;
    dureeJours = engagement.mois * 30;
    montantDzd = mensuel * engagement.mois;
  } else {
    const r = RECHARGES.find((x) => String(x.credits) === String(demande.reference));
    if (!r) return { ok: false, message: "Recharge inconnue." };
    credits = r.credits;
    palier = `Recharge ${r.credits}`;
    // Une recharge ne prolonge pas l'abonnement : elle depanne dans le mois.
    dureeJours = 0;
    montantDzd = r.prix;
  }

  const existants = listerCodes();
  const dejaPris = new Set(existants.map((c) => c.code));
  const nouveaux: CodeActivation[] = [];

  for (let i = 0; i < quantite; i++) {
    let code = tirerCode();
    // Collision quasi impossible (31^8 combinaisons), mais la verifier coute
    // trois lignes et evite d'ecraser un code vendu.
    let essais = 0;
    while (dejaPris.has(code) && essais++ < 20) code = tirerCode();
    dejaPris.add(code);

    nouveaux.push({
      code,
      type: demande.type,
      credits,
      palier,
      dureeJours,
      montantDzd,
      creeLe: new Date().toISOString(),
      note,
      utiliseLe: null,
      utilisePar: null,
      annule: false,
    });
  }

  enregistrer([...existants, ...nouveaux]);
  return { ok: true, codes: nouveaux };
}

/* ---------------------------------------------------------------- usage */

export interface ResultatActivation {
  ok: boolean;
  message?: string;
  credits?: number;
  palier?: string;
}

/**
 * Consomme un code au profit d'un compte.
 *
 * L'ordre compte : on marque le code utilise AVANT de crediter. Si le
 * creditement echoue, on relache le code — l'inverse permettrait a un
 * double-clic de crediter deux fois.
 */
export function activerCode(codeBrut: string, utilisateurId: string): ResultatActivation {
  const code = normaliserCode(codeBrut);
  if (!code) return { ok: false, message: "Ce code n'a pas le bon format." };

  if (!trouverParId(utilisateurId)) return { ok: false, message: "Compte introuvable." };

  const codes = listerCodes();
  const i = codes.findIndex((c) => c.code === code);
  if (i === -1) return { ok: false, message: "Ce code n'existe pas. Vérifie la saisie." };

  const c = codes[i];
  if (c.annule) return { ok: false, message: "Ce code a été annulé." };
  if (c.utiliseLe) return { ok: false, message: "Ce code a déjà été utilisé." };

  codes[i].utiliseLe = new Date().toISOString();
  codes[i].utilisePar = utilisateurId;
  enregistrer(codes);

  const resultat = appliquerAbonnement(utilisateurId, {
    credits: c.credits,
    palier: c.palier,
    // Une recharge n'ajoute pas de duree, mais si le compte n'a jamais eu
    // d'abonnement il faut bien lui ouvrir une fenetre : 30 jours.
    dureeJours: c.dureeJours > 0 ? c.dureeJours : 30,
  });

  if (!resultat.ok) {
    codes[i].utiliseLe = null;
    codes[i].utilisePar = null;
    enregistrer(codes);
    return { ok: false, message: resultat.message ?? "L'activation a échoué." };
  }

  return { ok: true, credits: c.credits, palier: c.palier };
}

export function annulerCode(code: string): boolean {
  const codes = listerCodes();
  const i = codes.findIndex((c) => c.code === code);
  if (i === -1 || codes[i].utiliseLe) return false;
  codes[i].annule = true;
  enregistrer(codes);
  return true;
}

export interface StatsCodes {
  total: number;
  utilises: number;
  disponibles: number;
  annules: number;
  /** Encaisse : seuls les codes utilises comptent comme du chiffre d'affaires. */
  chiffreAffaires: number;
  /** Vendus mais pas encore actives : de l'argent encaisse en attente. */
  enAttente: number;
}

export function statistiquesCodes(codes: CodeActivation[]): StatsCodes {
  let utilises = 0;
  let annules = 0;
  let chiffreAffaires = 0;

  for (const c of codes) {
    if (c.annule) annules++;
    else if (c.utiliseLe) {
      utilises++;
      chiffreAffaires += c.montantDzd;
    }
  }

  return {
    total: codes.length,
    utilises,
    disponibles: codes.length - utilises - annules,
    annules,
    chiffreAffaires,
    enAttente: codes.length - utilises - annules,
  };
}

/** Journal d'audit : chaque generation et chaque activation laissent une trace. */
const JOURNAL = path.join(CODES_DIR, "journal.jsonl");

export function journaliser(evenement: string, details: Record<string, unknown>): void {
  ensureDir(CODES_DIR);
  appendFileSync(
    JOURNAL,
    JSON.stringify({ le: new Date().toISOString(), evenement, ...details }) + "\n",
    "utf8",
  );
}
