import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { trouverParId, type Utilisateur } from "./comptes";

/* ============================================================================
   Session d'un abonne.

   Volontairement separee de la session administrateur : ce sont deux cookies
   distincts, deux secrets distincts. Un abonne connecte ne doit jamais
   approcher de l'espace admin, meme par accident, et compromettre un compte
   client ne doit pas ouvrir l'administration.

   Le jeton porte l'identifiant du compte et sa date d'emission, le tout
   signe. Rien n'est stocke cote serveur : redemarrer l'application ne
   deconnecte personne, et il n'y a aucune table de sessions a purger.
   ========================================================================== */

const COOKIE = "hkl_session";
const DUREE_JOURS = 30;

function secret(): string {
  // A defaut de secret dedie, on derive de celui de l'admin plutot que
  // d'utiliser une valeur en dur : un secret code dans le depot ne protege
  // rien du tout.
  return (
    process.env.SESSION_SECRET?.trim() ||
    process.env.ADMIN_SECRET?.trim() ||
    "hkl:" + (process.env.ADMIN_MOT_DE_PASSE?.trim() ?? "")
  );
}

function signer(charge: string): string {
  return createHmac("sha256", secret()).update(charge).digest("base64url");
}

function comparer(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

export function creerJeton(utilisateurId: string): string {
  const charge = `${utilisateurId}.${Date.now()}.${randomBytes(6).toString("base64url")}`;
  return `${charge}.${signer(charge)}`;
}

/** Retourne l'identifiant du compte si le jeton est valide et non expire. */
export function lireJeton(jeton: string | undefined): string | null {
  if (!jeton) return null;
  const i = jeton.lastIndexOf(".");
  if (i === -1) return null;

  const charge = jeton.slice(0, i);
  if (!comparer(jeton.slice(i + 1), signer(charge))) return null;

  const [id, emisLe] = charge.split(".");
  if (!id || !emisLe) return null;
  const date = Number(emisLe);
  if (!Number.isFinite(date)) return null;
  if (Date.now() - date > DUREE_JOURS * 24 * 60 * 60 * 1000) return null;

  return id;
}

/** L'utilisateur connecte, relu depuis le disque a chaque fois. */
export async function utilisateurCourant(): Promise<Utilisateur | null> {
  const magasin = await cookies();
  const id = lireJeton(magasin.get(COOKIE)?.value);
  if (!id) return null;

  // On relit le compte plutot que de faire confiance au jeton : un compte
  // suspendu ou vide de credits doit etre bloque immediatement, sans
  // attendre l'expiration du cookie.
  const u = trouverParId(id);
  if (!u || u.suspendu) return null;
  return u;
}

export const COOKIE_SESSION = COOKIE;
export const DUREE_COOKIE = DUREE_JOURS * 24 * 60 * 60;
