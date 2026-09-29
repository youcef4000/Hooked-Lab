import { existsSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import path from "node:path";
import { DATA_DIR, ensureDir } from "./paths";
import type { Langue } from "./langue";

const MESSAGES = {
  fr: {
    email: "Adresse email invalide.",
    telephone: "Numéro invalide. Indique-le avec l'indicatif du pays, par exemple +33 6 12 34 56 78 ou +1 415 555 0100.",
    nom: "Entre ton nom complet.",
    motDePasse: "Le mot de passe doit faire 8 caractères minimum.",
    emailPris: "Un compte existe déjà avec cette adresse.",
    telephonePris: "Un compte existe déjà avec ce numéro.",
    refus: "Email ou mot de passe incorrect.",
    suspendu: "Ce compte est suspendu. Contacte-nous sur WhatsApp.",
  },
  en: {
    email: "Invalid email address.",
    telephone: "Invalid number. Include the country code, e.g. +1 415 555 0100 or +44 7700 900123.",
    nom: "Enter your full name.",
    motDePasse: "The password must be at least 8 characters long.",
    emailPris: "An account already exists with this email.",
    telephonePris: "An account already exists with this number.",
    refus: "Incorrect email or password.",
    suspendu: "This account is suspended. Contact us on WhatsApp.",
  },
} as const;

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

/**
 * Numero au format international (E.164 : +indicatif puis le numero).
 * Un numero algerien saisi a l'ancienne (06 61 22 33 44) est complete en
 * +213 : c'est la saisie naturelle de la majorite des premiers abonnes.
 */
export function normaliserTelephone(brut: string): string {
  let n = String(brut).replace(/[\s.\-()]/g, "");
  if (n.startsWith("00")) n = "+" + n.slice(2);
  if (/^0[567]\d{8}$/.test(n)) n = "+213" + n.slice(1);
  else if (/^213[567]\d{8}$/.test(n)) n = "+" + n;
  return n;
}

export function telephoneValide(brut: string): boolean {
  return /^\+[1-9]\d{7,14}$/.test(normaliserTelephone(brut));
}

/* ----------------------------------------------------------- operations */

export interface ResultatCompte {
  ok: boolean;
  message?: string;
  utilisateur?: Utilisateur;
}

export function creerCompte(
  donnees: {
    email: string;
    motDePasse: string;
    telephone: string;
    nom: string;
  },
  langue: Langue = "fr",
): ResultatCompte {
  const t = MESSAGES[langue];
  const email = normaliserEmail(donnees.email);
  const telephone = normaliserTelephone(donnees.telephone);
  const nom = String(donnees.nom ?? "").trim().slice(0, 80);

  if (!emailValide(email)) return { ok: false, message: t.email };
  if (!telephoneValide(telephone)) {
    return { ok: false, message: t.telephone };
  }
  if (nom.length < 3) return { ok: false, message: t.nom };
  if (String(donnees.motDePasse ?? "").length < 8) {
    return { ok: false, message: t.motDePasse };
  }

  const utilisateurs = listerUtilisateurs();
  if (utilisateurs.some((u) => u.email === email)) {
    return { ok: false, message: t.emailPris };
  }
  // Le telephone est unique aussi : c'est par lui que passe l'activation, et
  // deux comptes sur un meme numero rendraient l'appel ambigu.
  // Les comptes anciens gardent un numero algerien local : on compare
  // tout au format international.
  if (utilisateurs.some((u) => normaliserTelephone(u.telephone) === telephone)) {
    return { ok: false, message: t.telephonePris };
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

export function authentifier(email: string, motDePasse: string, langue: Langue = "fr"): ResultatCompte {
  const t = MESSAGES[langue];
  const cible = normaliserEmail(email);
  const utilisateurs = listerUtilisateurs();
  const i = utilisateurs.findIndex((u) => u.email === cible);

  // Meme message qu'il s'agisse d'un email inconnu ou d'un mot de passe faux :
  // sinon on revele quelles adresses ont un compte.
  const refus = { ok: false as const, message: t.refus };
  if (i === -1) return refus;
  if (!motDePasseCorrespond(motDePasse, utilisateurs[i].motDePasse)) return refus;
  if (utilisateurs[i].suspendu) {
    return { ok: false, message: t.suspendu };
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
