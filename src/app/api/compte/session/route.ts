import { cookies } from "next/headers";
import { authentifier, versPublic } from "@/lib/comptes";
import { COOKIE_SESSION, DUREE_COOKIE, creerJeton, utilisateurCourant } from "@/lib/session";
import { creerLimiteur, ipClient } from "@/lib/limiteur";
import { langueCourante } from "@/lib/langue-serveur";

// Par adresse ET par email : le premier freine un robot qui essaie mille
// comptes, le second un robot qui essaie mille mots de passe sur un compte.
const tropParIp = creerLimiteur("connexion-ip", 10 * 60_000, 20);
const tropParEmail = creerLimiteur("connexion-email", 10 * 60_000, 8);

/* Connexion, deconnexion, et lecture de la session en cours. */

function pause(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** Qui suis-je ? Utilise par les composants clients pour afficher le solde. */
export async function GET(): Promise<Response> {
  const u = await utilisateurCourant();
  return Response.json({ ok: true, utilisateur: u ? versPublic(u) : null });
}

export async function POST(requete: Request): Promise<Response> {
  const langue = await langueCourante();
  const fr = langue === "fr";
  let corps: { email?: string; motDePasse?: string };
  try {
    corps = (await requete.json()) as typeof corps;
  } catch {
    return Response.json({ ok: false, message: fr ? "Requête illisible." : "Unreadable request." }, { status: 400 });
  }

  const email = String(corps.email ?? "").trim().toLowerCase();
  if (tropParIp(ipClient(requete)) || tropParEmail(email)) {
    return Response.json(
      { ok: false, message: fr ? "Trop de tentatives. Réessaie dans dix minutes." : "Too many attempts. Try again in ten minutes." },
      { status: 429 },
    );
  }

  const resultat = authentifier(email, String(corps.motDePasse ?? ""), langue);
  if (!resultat.ok || !resultat.utilisateur) {
    // Ralentit le tatonnement automatique sans gener une personne reelle.
    await pause(500);
    return Response.json({ ok: false, message: resultat.message }, { status: 401 });
  }

  const magasin = await cookies();
  magasin.set(COOKIE_SESSION, creerJeton(resultat.utilisateur.id), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: DUREE_COOKIE,
  });

  return Response.json({ ok: true, utilisateur: versPublic(resultat.utilisateur) });
}

export async function DELETE(): Promise<Response> {
  const magasin = await cookies();
  magasin.delete(COOKIE_SESSION);
  return Response.json({ ok: true });
}
