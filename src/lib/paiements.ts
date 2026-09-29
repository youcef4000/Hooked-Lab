import { existsSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";
import { DATA_DIR, ensureDir } from "./paths";
import { appliquerAbonnement } from "./comptes";
import { journaliser } from "./codes";
import { ENGAGEMENTS, PALIERS, RECHARGES, totalPalier, type Devise } from "./tarifs";

/* ============================================================================
   Achats par carte : ce qu'on vend, et ce qu'on accorde une fois paye.

   Le prix est TOUJOURS recalcule ici depuis la grille : le navigateur ne
   transmet qu'une reference ("Pro", 12 mois, USD). Un client qui modifierait
   la requete ne peut donc pas choisir son prix.

   Stripe peut envoyer deux fois le meme evenement (reprise apres un delai
   reseau) : chaque session payee est notee, et une session deja traitee
   n'accorde rien une seconde fois.
   ========================================================================== */

export type TypeAchat = "abonnement" | "recharge";

export interface Offre {
  type: TypeAchat;
  libelle: string;
  description: string;
  montant: number;
  devise: Devise;
  credits: number;
  palier: string;
  dureeJours: number;
}

/** Construit l'offre depuis la grille, ou null si la demande ne correspond a rien. */
export function construireOffre(demande: {
  type?: unknown;
  reference?: unknown;
  mois?: unknown;
  devise?: unknown;
}): Offre | null {
  const devise =
    demande.devise === "EUR" || demande.devise === "USD" || demande.devise === "GBP" ? demande.devise : null;
  if (!devise) return null;

  if (demande.type === "abonnement") {
    const p = PALIERS.find((x) => x.nom === demande.reference);
    const e = ENGAGEMENTS.find((x) => x.mois === Number(demande.mois));
    if (!p || !e) return null;
    const montant = totalPalier(p, e.remise, e.mois);
    return {
      type: "abonnement",
      libelle: `Hooked Lab ${p.nom} — ${e.mois === 12 ? "yearly" : "monthly"}`,
      description: `${p.creditsMensuels * e.mois} credits · ${e.mois === 12 ? "12 months" : "1 month"} access`,
      montant,
      devise,
      credits: p.creditsMensuels * e.mois,
      palier: p.nom,
      dureeJours: e.mois === 12 ? 365 : 30,
    };
  }

  if (demande.type === "recharge") {
    const r = RECHARGES.find((x) => String(x.credits) === String(demande.reference));
    if (!r) return null;
    return {
      type: "recharge",
      libelle: `Hooked Lab — ${r.credits} credits top-up`,
      description: `${r.credits} credits added to your account`,
      montant: r.prix,
      devise,
      credits: r.credits,
      palier: `Recharge ${r.credits}`,
      dureeJours: 0,
    };
  }
  return null;
}

/* ------------------------------------------------------- idempotence */

const FICHIER = path.join(DATA_DIR, "comptes", "paiements.json");

interface PaiementTraite {
  session: string;
  utilisateurId: string;
  credits: number;
  montant: number;
  devise: string;
  le: string;
}

function lire(): PaiementTraite[] {
  ensureDir(path.dirname(FICHIER));
  if (!existsSync(FICHIER)) return [];
  try {
    const d = JSON.parse(readFileSync(FICHIER, "utf8")) as PaiementTraite[];
    return Array.isArray(d) ? d : [];
  } catch {
    return [];
  }
}

function enregistrer(liste: PaiementTraite[]): void {
  const temporaire = `${FICHIER}.${process.pid}.tmp`;
  writeFileSync(temporaire, JSON.stringify(liste, null, 2), "utf8");
  renameSync(temporaire, FICHIER);
}

export function listerPaiements(): PaiementTraite[] {
  return lire();
}

/**
 * Accorde ce qu'une session Stripe payee a achete. Retourne false si la
 * session a deja ete traitee (evenement renvoye par Stripe).
 */
export function accorderAchat(session: {
  id: string;
  utilisateurId: string;
  metadonnees: Record<string, string>;
  montantCentimes: number;
  devise: string;
}): { ok: boolean; deja?: boolean; message?: string } {
  const traites = lire();
  if (traites.some((p) => p.session === session.id)) return { ok: true, deja: true };

  // L'offre est reconstruite depuis les metadonnees posees a la creation de
  // la session, pas depuis le montant : c'est le serveur qui les a ecrites.
  const offre = construireOffre({
    type: session.metadonnees.type,
    reference: session.metadonnees.reference,
    mois: session.metadonnees.mois,
    devise: session.devise.toUpperCase(),
  });
  if (!offre) return { ok: false, message: "Offre introuvable dans les métadonnées." };

  // Garde-fou : le montant encaisse doit correspondre au prix de l'offre.
  if (Math.round(offre.montant * 100) !== session.montantCentimes) {
    return { ok: false, message: `Montant inattendu (${session.montantCentimes} centimes).` };
  }

  const resultat = appliquerAbonnement(session.utilisateurId, {
    credits: offre.credits,
    palier: offre.palier,
    // Une recharge sur un compte jamais active lui ouvre 30 jours, comme un code.
    dureeJours: offre.dureeJours > 0 ? offre.dureeJours : 30,
  });
  if (!resultat.ok) return { ok: false, message: resultat.message };

  enregistrer([
    ...traites,
    {
      session: session.id,
      utilisateurId: session.utilisateurId,
      credits: offre.credits,
      montant: offre.montant,
      devise: offre.devise,
      le: new Date().toISOString(),
    },
  ]);
  journaliser("paiement_carte", {
    utilisateur: session.utilisateurId,
    session: session.id,
    credits: offre.credits,
    montant: offre.montant,
    devise: offre.devise,
    palier: offre.palier,
  });
  return { ok: true };
}
