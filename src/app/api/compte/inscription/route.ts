import { cookies } from "next/headers";
import { creerCompte, versPublic } from "@/lib/comptes";
import { COOKIE_SESSION, DUREE_COOKIE, creerJeton } from "@/lib/session";
import { creerLimiteur, ipClient } from "@/lib/limiteur";
import { langueCourante } from "@/lib/langue-serveur";

/* Creation d'un compte. L'inscription est libre ; c'est l'activation par code
   qui donne acces aux analyses. */

/** Freine la creation de comptes en rafale depuis une meme adresse. */
const tropDeRequetes = creerLimiteur("inscription", 10 * 60_000, 5);

export async function POST(requete: Request): Promise<Response> {
  const langue = await langueCourante();
  const fr = langue === "fr";
  if (tropDeRequetes(ipClient(requete))) {
    return Response.json(
      { ok: false, message: fr ? "Trop de tentatives. Réessaie dans quelques minutes." : "Too many attempts. Try again in a few minutes." },
      { status: 429 },
    );
  }

  let corps: { email?: string; motDePasse?: string; telephone?: string; nom?: string };
  try {
    corps = (await requete.json()) as typeof corps;
  } catch {
    return Response.json({ ok: false, message: fr ? "Requête illisible." : "Unreadable request." }, { status: 400 });
  }

  const resultat = creerCompte({
    email: String(corps.email ?? ""),
    motDePasse: String(corps.motDePasse ?? ""),
    telephone: String(corps.telephone ?? ""),
    nom: String(corps.nom ?? ""),
  }, langue);

  if (!resultat.ok || !resultat.utilisateur) {
    return Response.json({ ok: false, message: resultat.message }, { status: 422 });
  }

  // On connecte directement : demander de se reconnecter juste apres s'etre
  // inscrit est une friction sans contrepartie.
  const magasin = await cookies();
  magasin.set(COOKIE_SESSION, creerJeton(resultat.utilisateur.id), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: DUREE_COOKIE,
  });

  return Response.json({ ok: true, utilisateur: versPublic(resultat.utilisateur) }, { status: 201 });
}
