import { cookies } from "next/headers";
import { creerCompte, versPublic } from "@/lib/comptes";
import { COOKIE_SESSION, DUREE_COOKIE, creerJeton } from "@/lib/session";

/* Creation d'un compte. L'inscription est libre ; c'est l'activation par code
   qui donne acces aux analyses. */

/** Freine la creation de comptes en rafale depuis une meme adresse. */
const FENETRE_MS = 10 * 60_000;
const MAX_PAR_FENETRE = 5;

type Compteur = { debut: number; nombre: number };
const registre: Map<string, Compteur> =
  (globalThis as { __hklDebitInscription?: Map<string, Compteur> }).__hklDebitInscription ??
  ((globalThis as { __hklDebitInscription?: Map<string, Compteur> }).__hklDebitInscription =
    new Map());

function tropDeRequetes(ip: string): boolean {
  const maintenant = Date.now();
  const c = registre.get(ip);
  if (!c || maintenant - c.debut > FENETRE_MS) {
    registre.set(ip, { debut: maintenant, nombre: 1 });
    if (registre.size > 5000) registre.clear();
    return false;
  }
  c.nombre++;
  return c.nombre > MAX_PAR_FENETRE;
}

export async function POST(requete: Request): Promise<Response> {
  const ip =
    requete.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    requete.headers.get("x-real-ip") ||
    "inconnue";

  if (tropDeRequetes(ip)) {
    return Response.json(
      { ok: false, message: "Trop de tentatives. Réessaie dans quelques minutes." },
      { status: 429 },
    );
  }

  let corps: { email?: string; motDePasse?: string; telephone?: string; nom?: string };
  try {
    corps = (await requete.json()) as typeof corps;
  } catch {
    return Response.json({ ok: false, message: "Requête illisible." }, { status: 400 });
  }

  const resultat = creerCompte({
    email: String(corps.email ?? ""),
    motDePasse: String(corps.motDePasse ?? ""),
    telephone: String(corps.telephone ?? ""),
    nom: String(corps.nom ?? ""),
  });

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
