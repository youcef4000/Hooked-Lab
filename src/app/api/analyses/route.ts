import { NextResponse } from "next/server";
import { analysesVisibles, lecteurCourant } from "@/lib/acces-analyses";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** L'historique du lecteur : les siennes pour un abonne, toutes pour l'admin. */
export async function GET() {
  return NextResponse.json({ analyses: analysesVisibles(await lecteurCourant()) });
}
