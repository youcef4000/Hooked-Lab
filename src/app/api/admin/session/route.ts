import { cookies } from "next/headers";
import {
  COOKIE_ADMIN,
  DUREE_COOKIE,
  adminConfigure,
  creerJeton,
  motDePasseCorrect,
} from "@/lib/admin-auth";

import { creerLimiteur, ipClient } from "@/lib/limiteur";

/* Connexion et deconnexion de l'espace admin. */

// Le proprietaire se trompe rarement plus de trois fois : au-dela de dix
// essais en un quart d'heure, c'est un robot.
const tropDEssais = creerLimiteur("admin", 15 * 60_000, 10);

/** Retarde la reponse d'un echec : rend le tatonnement automatique penible. */
function pause(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export async function POST(requete: Request): Promise<Response> {
  if (!adminConfigure()) {
    return Response.json(
      {
        ok: false,
        message:
          "Aucun mot de passe administrateur n'est configuré. Ajoute ADMIN_MOT_DE_PASSE dans .env.local (12 caractères minimum), puis relance le serveur.",
      },
      { status: 503 },
    );
  }

  if (tropDEssais(ipClient(requete))) {
    return Response.json(
      { ok: false, message: "Trop de tentatives. Réessaie dans un quart d'heure." },
      { status: 429 },
    );
  }

  let saisi = "";
  try {
    const corps = (await requete.json()) as { motDePasse?: unknown };
    saisi = typeof corps.motDePasse === "string" ? corps.motDePasse : "";
  } catch {
    return Response.json({ ok: false, message: "Requête illisible." }, { status: 400 });
  }

  if (!motDePasseCorrect(saisi)) {
    await pause(600);
    return Response.json({ ok: false, message: "Mot de passe incorrect." }, { status: 401 });
  }

  const magasin = await cookies();
  magasin.set(COOKIE_ADMIN, creerJeton(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: DUREE_COOKIE,
  });

  return Response.json({ ok: true });
}

export async function DELETE(): Promise<Response> {
  const magasin = await cookies();
  magasin.delete(COOKIE_ADMIN);
  return Response.json({ ok: true });
}
