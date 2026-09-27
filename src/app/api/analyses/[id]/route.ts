import { NextResponse } from "next/server";
import { deleteReport, definirDemo, getReport } from "@/lib/store";
import { lecteurCourant, peutSupprimer, peutVoir } from "@/lib/acces-analyses";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Une analyse qui n'appartient pas au lecteur repond "introuvable", jamais
// "interdit" : inutile de confirmer qu'elle existe.
const INTROUVABLE = { error: "Rapport introuvable." };

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!peutVoir(id, await lecteurCourant())) return NextResponse.json(INTROUVABLE, { status: 404 });
  const report = getReport(id);
  if (!report) return NextResponse.json(INTROUVABLE, { status: 404 });
  return NextResponse.json(report);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!peutSupprimer(id, await lecteurCourant())) {
    return NextResponse.json(INTROUVABLE, { status: 404 });
  }
  const ok = deleteReport(id);
  if (!ok) return NextResponse.json(INTROUVABLE, { status: 404 });
  return NextResponse.json({ ok: true });
}

/** Administration : afficher ou retirer une analyse de la vitrine publique. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lecteur = await lecteurCourant();
  if (!lecteur.admin) return NextResponse.json(INTROUVABLE, { status: 404 });

  let corps: { demo?: unknown };
  try {
    corps = (await request.json()) as typeof corps;
  } catch {
    return NextResponse.json({ error: "Requête illisible." }, { status: 400 });
  }
  if (typeof corps.demo !== "boolean") {
    return NextResponse.json({ error: "Champ demo attendu." }, { status: 400 });
  }
  if (!definirDemo(id, corps.demo)) return NextResponse.json(INTROUVABLE, { status: 404 });
  return NextResponse.json({ ok: true, demo: corps.demo });
}
