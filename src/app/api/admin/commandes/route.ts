import { estConnecte } from "@/lib/admin-auth";
import {
  STATUTS,
  listerCommandes,
  majCommande,
  supprimerCommande,
  versCSV,
  type StatutCommande,
} from "@/lib/commandes";

/* Lecture, mise a jour et export des commandes. Reserve a l'administrateur. */

async function refuseSiNonConnecte(): Promise<Response | null> {
  return (await estConnecte())
    ? null
    : Response.json({ ok: false, message: "Non autorisé." }, { status: 401 });
}

/** ?format=csv telecharge le fichier ; sinon renvoie la liste en JSON. */
export async function GET(requete: Request): Promise<Response> {
  const refus = await refuseSiNonConnecte();
  if (refus) return refus;

  const commandes = listerCommandes();
  if (new URL(requete.url).searchParams.get("format") === "csv") {
    const jour = new Date().toISOString().slice(0, 10);
    return new Response("﻿" + versCSV(commandes), {
      headers: {
        // Le BOM en tete force Excel a lire le fichier en UTF-8, sinon les
        // accents et les noms arabes ressortent en charabia.
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="commandes-${jour}.csv"`,
      },
    });
  }
  return Response.json({ ok: true, commandes });
}

export async function PATCH(requete: Request): Promise<Response> {
  const refus = await refuseSiNonConnecte();
  if (refus) return refus;

  let corps: { id?: unknown; statut?: unknown; note?: unknown };
  try {
    corps = (await requete.json()) as typeof corps;
  } catch {
    return Response.json({ ok: false, message: "Requête illisible." }, { status: 400 });
  }

  const id = typeof corps.id === "string" ? corps.id : "";
  if (!id) return Response.json({ ok: false, message: "Identifiant manquant." }, { status: 400 });

  const statut =
    typeof corps.statut === "string" && STATUTS.includes(corps.statut as StatutCommande)
      ? (corps.statut as StatutCommande)
      : undefined;
  const note = typeof corps.note === "string" ? corps.note : undefined;

  const commande = majCommande(id, { statut, note });
  if (!commande) return Response.json({ ok: false, message: "Commande introuvable." }, { status: 404 });
  return Response.json({ ok: true, commande });
}

export async function DELETE(requete: Request): Promise<Response> {
  const refus = await refuseSiNonConnecte();
  if (refus) return refus;

  const id = new URL(requete.url).searchParams.get("id") ?? "";
  if (!supprimerCommande(id)) {
    return Response.json({ ok: false, message: "Commande introuvable." }, { status: 404 });
  }
  return Response.json({ ok: true });
}
