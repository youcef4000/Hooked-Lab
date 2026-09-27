import { NextResponse } from "next/server";
import { getJob } from "@/lib/jobs";
import { getReport } from "@/lib/store";
import { lecteurCourant, peutVoir } from "@/lib/acces-analyses";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!peutVoir(id, await lecteurCourant())) {
    return NextResponse.json({ error: "Analyse introuvable." }, { status: 404 });
  }
  const job = getJob(id);

  if (job) return NextResponse.json(job);

  // Le registre en memoire est purge apres quelques heures : si le rapport
  // existe sur disque, l'analyse est bien terminee.
  if (getReport(id)) {
    return NextResponse.json({ id, status: "termine", reportReady: true, steps: [] });
  }
  return NextResponse.json({ error: "Analyse introuvable." }, { status: 404 });
}
