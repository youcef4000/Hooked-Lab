import { existsSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import path from "node:path";
import { DATA_DIR, ensureDir } from "./paths";

/* ============================================================================
   Comptes utilisateurs.

   Un fichier JSON, ecrit de facon atomique : on ecrit d'abord un fichier
   temporaire, puis on le renomme par-dessus l'ancien. Le renommage est
   instantane au niveau du systeme de fichiers — une coupure de courant laisse
   donc soit l'ancien fichier intact, soit le nouveau complet, jamais un
   fichier a moitie ecrit.

   Node execute le JavaScript sur un seul fil : tant que l'application tourne
   en un seul processus, deux requetes ne peuvent pas ecrire en meme temps et
   il n'y a pas de conflit possible. Deux situations imposeront de passer a
   Postgres : lancer plusieurs processus (PM2 en mode cluster), ou depasser
   quelques milliers de comptes — au-dela, relire tout le fichier a chaque
   requete devient perceptible.

   Le mot de passe n'est jamais stocke. On garde l'empreinte scrypt, avec un
   sel different par utilisateur : deux personnes ayant le meme mot de passe
   ont deux empreintes differentes, et une empreinte volee ne se remonte pas.
   ========================================================================== */

export interface Utilisateur {
  id: string;
  email: string;
  /** "sel:empreinte", jamais le mot de passe. */
  motDePasse: string;
  telephone: string;
  nom: string;
  credits: number;
  /** Palier en cours : "" tant qu'aucun code n'a ete active. */
  palier: string;
  /** Fin d'abonnement en ISO, null si aucun abonnement actif. */
  expireLe: string | null;
  creeLe: string;
  derniereConnexion: string | null;
  /** Un compte suspendu ne peut plus se connecter. */
  suspendu: boolean;
  /** Total des credits consommes depuis l'inscription : utile en support. */
  creditsConsommes: number;
}

const COMPTES_DIR = path.join(DATA_DIR, "comptes");
const FICHIER = path.join(COMPTES_DIR, "utilisateurs.json");

function chemin(): string {
  ensureDir(COMPTES_DIR);
  return FICHIER;
}

export function listerUtilisateurs(): Utilisateur[] {
  const f = chemin();
  if (!existsSync(f)) return [];
  try {
    const donnees = JSON.parse(readFileSync(f, "utf8")) as Utilisateur[];
    return Array.isArray(donnees) ? donnees : [];
  } catch {
    return [];
  }
}

/** Ecriture atomique : fichier temporaire, puis renommage par-dessus. */
function enregistrer(utilisateurs: Utilisateur[]): void {
  const f = chemin();
  const temporaire = `${f}.${process.pid}.tmp`;
  writeFileSync(temporaire, JSON.stringify(utilisateurs, null, 2), "utf8");
  renameSync(temporaire, f);
}

/* ------------------------------------------------------- mots de passe */

function hacher(motDePasse: string): string {
  const sel = randomBytes(16).toString("hex");
  return `${sel}:${scryptSync(motDePasse, sel, 64).toString("hex")}`;
}

function motDePasseCorrespond(saisi: string, stocke: string): boolean {
  const [sel, empreinte] = stocke.split(":");
  if (!sel || !empreinte) return false;
  const attendu = Buffer.from(empreinte, "hex");
  const calcule = scryptSync(saisi, sel, 64);
  // Comparaison a duree constante : une comparaison naive laisserait deviner
  // l'empreinte octet par octet en mesurant le temps de reponse.
  return calcule.length === attendu.length && timingSafeEqual(calcule, attendu);
}

/* ------------------------------------------------------------ validation */

export function normaliserEmail(brut: string): string {
  return String(brut).trim().toLowerCase();
}

export function emailValide(email: string): boolean {
  // Volontairement permissif : la seule verification qui compte est l'appel
  // telephonique. Un filtre trop strict rejette des adresses valides.
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

export function normaliserTelephone(brut: string): string {
  let n = String(brut).replace(/[\s.\-()]/g, "");
  if (n.startsWith("+213")) n = "0" + n.slice(4);
  else if (n.startsWith("00213")) n = "0" + n.slice(5);
  else if (n.startsWith("213") && n.length === 12) n = "0" + n.slice(3);
  return n;
}

export function telephoneValide(brut: string): boolean {
  return /^0[567]\d{8}$/.test(normaliserTelephone(brut));
}

/* ----------------------------------------------------------- operations */

export interface ResultatCompte {
  ok: boolean;
  message?: string;
  utilisateur?: Utilisateur;
}

export function creerCompte(donnees: {
  email: string;
  motDePasse: string;
  telephone: string;
  nom: string;
}): ResultatCompte {
  const email = normaliserEmail(donnees.email);
  const telephone = normaliserTelephone(donnees.telephone);
  const nom = String(donnees.nom ?? "").trim().slice(0, 80);

  if (!emailValide(email)) return { ok: false, message: "Adresse email invalide." };
  if (!telephoneValide(telephone)) {
    return { ok: false, message: "Numéro invalide. Il doit commencer par 05, 06 ou 07 et faire 10 chiffres." };
  }
  if (nom.length < 3) return { ok: false, message: "Entre ton nom complet." };
  if (String(donnees.motDePasse ?? "").length < 8) {
    return { ok: false, message: "Le mot de passe doit faire 8 caractères minimum." };
  }

  const utilisateurs = listerUtilisateurs();
  if (utilisateurs.some((u) => u.email === email)) {
    return { ok: false, message: "Un compte existe déjà avec cette adresse." };
  }
  // Le telephone est unique aussi : c'est par lui que passe l'activation, et
  // deux comptes sur un meme numero rendraient l'appel ambigu.
  if (utilisateurs.some((u) => u.telephone === telephone)) {
    return { ok: false, message: "Un compte existe déjà avec ce numéro." };
  }

  const utilisateur: Utilisateur = {
    id: `usr_${Date.now().toString(36)}_${randomBytes(4).toString("hex")}`,
    email,
    motDePasse: hacher(donnees.motDePasse),
    telephone,
    nom,
    credits: 0,
    palier: "",
    expireLe: null,
    creeLe: new Date().toISOString(),
    derniereConnexion: null,
    suspendu: false,
    creditsConsommes: 0,
  };

  utilisateurs.push(utilisateur);
  enregistrer(utilisateurs);
  return { ok: true, utilisateur };
}

export function authentifier(email: string, motDePasse: string): ResultatCompte {
  const cible = normaliserEmail(email);
  const utilisateurs = listerUtilisateurs();
  const i = utilisateurs.findIndex((u) => u.email === cible);

  // Meme message qu'il s'agisse d'un email inconnu ou d'un mot de passe faux :
  // sinon on revele quelles adresses ont un compte.
  const refus = { ok: false as const, message: "Email ou mot de passe incorrect." };
  if (i === -1) return refus;
  if (!motDePasseCorrespond(motDePasse, utilisateurs[i].motDePasse)) return refus;
  if (utilisateurs[i].suspendu) {
    return { ok: false, message: "Ce compte est suspendu. Contacte-nous sur WhatsApp." };
  }

  utilisateurs[i].derniereConnexion = new Date().toISOString();
  enregistrer(utilisateurs);
  return { ok: true, utilisateur: utilisateurs[i] };
}

export function trouverParId(id: string): Utilisateur | null {
  return listerUtilisateurs().find((u) => u.id === id) ?? null;
}

export function trouverParEmail(email: string): Utilisateur | null {
  const cible = normaliserEmail(email);
  return listerUtilisateurs().find((u) => u.email === cible) ?? null;
}

/** L'abonnement court-il encore ? Un compte expire garde ses credits mais ne peut plus les depenser. */
export function abonnementActif(u: Utilisateur): boolean {
  if (!u.expireLe) return false;
  return new Date(u.expireLe).getTime() > Date.now();
}

/**
 * Retire des credits. Refuse si le solde est insuffisant ou l'abonnement
 * expire — c'est le seul endroit qui autorise une depense, et il verifie
 * toujours, meme si l'appelant a deja verifie de son cote.
 */
export function debiter(id: string, montant: number): ResultatCompte {
  if (!Number.isFinite(montant) || montant <= 0) {
    return { ok: false, message: "Montant invalide." };
  }

  const utilisateurs = listerUtilisateurs();
  const i = utilisateurs.findIndex((u) => u.id === id);
  if (i === -1) return { ok: false, message: "Compte introuvable." };

  const u = utilisateurs[i];
  if (u.suspendu) return { ok: false, message: "Compte suspendu." };
  if (!abonnementActif(u)) {
    // Un compte neuf et un abonnement echu meritent deux messages differents :
    // le premier ne sait pas quoi faire, le second sait deja.
    return {
      ok: false,
      message: u.expireLe
        ? "Ton abonnement a expiré. Saisis un nouveau code pour continuer."
        : "Ton compte n'est pas encore activé. Saisis le code reçu après ton paiement.",
    };
  }
  if (u.credits < montant) {
    return {
      ok: false,
      message: `Crédits insuffisants : il t'en reste ${u.credits}, il en faut ${montant}.`,
    };
  }

  u.credits -= montant;
  u.creditsConsommes += montant;
  enregistrer(utilisateurs);
  return { ok: true, utilisateur: u };
}

/** Rend des credits : appele quand une analyse echoue apres avoir ete debitee. */
export function crediter(id: string, montant: number): ResultatCompte {
  if (!Number.isFinite(montant) || montant <= 0) return { ok: false, message: "Montant invalide." };

  const utilisateurs = listerUtilisateurs();
  const i = utilisateurs.findIndex((u) => u.id === id);
  if (i === -1) return { ok: false, message: "Compte introuvable." };

  utilisateurs[i].credits += montant;
  utilisateurs[i].creditsConsommes = Math.max(0, utilisateurs[i].creditsConsommes - montant);
  enregistrer(utilisateurs);
  return { ok: true, utilisateur: utilisateurs[i] };
}

/**
 * Applique un abonnement. Si l'abonnement en cours n'est pas expire, la
 * nouvelle duree s'ajoute au reste plutot que de l'ecraser : quelqu'un qui
 * recharge en avance ne doit pas perdre les jours qu'il a payes.
 */
export function appliquerAbonnement(
  id: string,
  params: { credits: number; palier: string; dureeJours: number },
): ResultatCompte {
  const utilisateurs = listerUtilisateurs();
  const i = utilisateurs.findIndex((u) => u.id === id);
  if (i === -1) return { ok: false, message: "Compte introuvable." };

  const u = utilisateurs[i];
  const depart = abonnementActif(u) && u.expireLe ? new Date(u.expireLe) : new Date();
  depart.setDate(depart.getDate() + params.dureeJours);

  u.credits += params.credits;
  u.palier = params.palier;
  u.expireLe = depart.toISOString();
  enregistrer(utilisateurs);
  return { ok: true, utilisateur: u };
}

/** Reservee a l'administration : suspension, remise de credits, correction. */
export function majUtilisateur(
  id: string,
  champs: Partial<Pick<Utilisateur, "credits" | "palier" | "expireLe" | "suspendu">>,
): Utilisateur | null {
  const utilisateurs = listerUtilisateurs();
  const i = utilisateurs.findIndex((u) => u.id === id);
  if (i === -1) return null;

  if (typeof champs.credits === "number" && champs.credits >= 0) {
    utilisateurs[i].credits = Math.round(champs.credits);
  }
  if (typeof champs.palier === "string") utilisateurs[i].palier = champs.palier;
  if (champs.expireLe !== undefined) utilisateurs[i].expireLe = champs.expireLe;
  if (typeof champs.suspendu === "boolean") utilisateurs[i].suspendu = champs.suspendu;

  enregistrer(utilisateurs);
  return utilisateurs[i];
}

/** Vue sans donnee sensible, seule forme qui sort vers le navigateur. */
export interface UtilisateurPublic {
  id: string;
  email: string;
  nom: string;
  telephone: string;
  credits: number;
  palier: string;
  expireLe: string | null;
  actif: boolean;
}

export function versPublic(u: Utilisateur): UtilisateurPublic {
  return {
    id: u.id,
    email: u.email,
    nom: u.nom,
    telephone: u.telephone,
    credits: u.credits,
    palier: u.palier,
    expireLe: u.expireLe,
    actif: abonnementActif(u),
  };
}
