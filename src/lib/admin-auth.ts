import { createHmac, timingSafeEqual, randomBytes } from "node:crypto";
import { cookies } from "next/headers";

/* ============================================================================
   Acces a l'espace admin.

   Un seul mot de passe, celui du proprietaire, lu depuis .env.local. Ce n'est
   pas un systeme de comptes : c'est la serrure minimale pour qu'une page qui
   liste les numeros de telephone des clients ne soit pas ouverte a tous.

   Le jeton est signe en HMAC et porte sa date d'emission, donc il expire seul
   et ne peut pas etre fabrique sans le secret. Il n'est pas stocke cote
   serveur : rien a purger, et redemarrer le serveur ne deconnecte personne.

   Le jour ou l'application accueille plusieurs vendeurs, ceci doit ceder la
   place a de vrais comptes avec mots de passe haches par utilisateur.
   ========================================================================== */

const COOKIE = "cldz_admin";
const DUREE_JOURS = 30;

function motDePasseAttendu(): string {
  return process.env.ADMIN_MOT_DE_PASSE?.trim() ?? "";
}

/** Sans mot de passe configure, l'admin refuse d'ouvrir plutot que de s'ouvrir a tous. */
export function adminConfigure(): boolean {
  return motDePasseAttendu().length >= 8;
}

/**
 * Secret de signature. A defaut de ADMIN_SECRET, on derive du mot de passe :
 * changer le mot de passe invalide alors tous les jetons en circulation, ce
 * qui est exactement le comportement voulu.
 */
function secret(): string {
  return process.env.ADMIN_SECRET?.trim() || "cldz:" + motDePasseAttendu();
}

function signer(charge: string): string {
  return createHmac("sha256", secret()).update(charge).digest("base64url");
}

function comparer(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  // Comparaison a duree constante : une comparaison naive laisserait deviner
  // la signature caractere par caractere en mesurant le temps de reponse.
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

export function creerJeton(): string {
  const charge = `${Date.now()}.${randomBytes(9).toString("base64url")}`;
  return `${charge}.${signer(charge)}`;
}

export function jetonValide(jeton: string | undefined): boolean {
  if (!jeton || !adminConfigure()) return false;
  const i = jeton.lastIndexOf(".");
  if (i === -1) return false;

  const charge = jeton.slice(0, i);
  const signature = jeton.slice(i + 1);
  if (!comparer(signature, signer(charge))) return false;

  const emisLe = Number(charge.split(".")[0]);
  if (!Number.isFinite(emisLe)) return false;
  return Date.now() - emisLe < DUREE_JOURS * 24 * 60 * 60 * 1000;
}

/** Le mot de passe saisi est-il le bon ? */
export function motDePasseCorrect(saisi: string): boolean {
  const attendu = motDePasseAttendu();
  if (!attendu) return false;
  // On compare les empreintes, pas les chaines : leurs longueurs sont alors
  // toujours egales, et la longueur du mot de passe ne fuit pas.
  return comparer(
    createHmac("sha256", "cmp").update(saisi).digest("hex"),
    createHmac("sha256", "cmp").update(attendu).digest("hex"),
  );
}

export async function estConnecte(): Promise<boolean> {
  const magasin = await cookies();
  return jetonValide(magasin.get(COOKIE)?.value);
}

export const COOKIE_ADMIN = COOKIE;
export const DUREE_COOKIE = DUREE_JOURS * 24 * 60 * 60;
