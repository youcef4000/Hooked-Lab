import { estConnecte } from "@/lib/admin-auth";
import { listerUtilisateurs, majUtilisateur, versPublic } from "@/lib/comptes";
import { journaliser } from "@/lib/codes";

/* Consultation et correction des comptes. Reserve a l'administrateur. */

async function refuseSiNonConnecte(): Promise<Response | null> {
  return (await estConnecte())
    ? null
    : Response.json({ ok: false, message: "Non autorisé." }, { status: 401 });
}

export async function GET(): Promise<Response> {
  const refus = await refuseSiNonConnecte();
  if (refus) return refus;

  // versPublic retire l'empreinte du mot de passe : elle ne sort jamais du
  // serveur, meme vers l'administrateur.
  const utilisateurs = listerUtilisateurs()
    .map((u) => ({ ...versPublic(u), creeLe: u.creeLe, creditsConsommes: u.creditsConsommes, suspendu: u.suspendu }))
    .reverse();

  return Response.json({ ok: true, utilisateurs });
}

export async function PATCH(requete: Request): Promise<Response> {
  const refus = await refuseSiNonConnecte();
  if (refus) return refus;

  let corps: { id?: unknown; credits?: unknown; suspendu?: unknown; expireLe?: unknown };
  try {
    corps = (await requete.json()) as typeof corps;
  } catch {
    return Response.json({ ok: false, message: "Requête illisible." }, { status: 400 });
  }

  const id = typeof corps.id === "string" ? corps.id : "";
  if (!id) return Response.json({ ok: false, message: "Identifiant manquant." }, { status: 400 });

  const u = majUtilisateur(id, {
    credits: typeof corps.credits === "number" ? corps.credits : undefined,
    suspendu: typeof corps.suspendu === "boolean" ? corps.suspendu : undefined,
    expireLe: typeof corps.expireLe === "string" || corps.expireLe === null
      ? (corps.expireLe as string | null)
      : undefined,
  });

  if (!u) return Response.json({ ok: false, message: "Compte introuvable." }, { status: 404 });

  journaliser("compte_modifie", { id, par: "admin", credits: u.credits, suspendu: u.suspendu });
  return Response.json({ ok: true, utilisateur: versPublic(u) });
}
