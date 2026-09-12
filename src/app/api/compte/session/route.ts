import { cookies } from "next/headers";
import { authentifier, versPublic } from "@/lib/comptes";
import { COOKIE_SESSION, DUREE_COOKIE, creerJeton, utilisateurCourant } from "@/lib/session";

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
  let corps: { email?: string; motDePasse?: string };
  try {
    corps = (await requete.json()) as typeof corps;
  } catch {
    return Response.json({ ok: false, message: "Requête illisible." }, { status: 400 });
  }

  const resultat = authentifier(String(corps.email ?? ""), String(corps.motDePasse ?? ""));
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
