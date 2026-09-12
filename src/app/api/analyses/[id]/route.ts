import { NextResponse } from "next/server";
import { deleteReport, getReport } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const report = getReport(id);
  if (!report) return NextResponse.json({ error: "Rapport introuvable." }, { status: 404 });
  return NextResponse.json(report);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ok = deleteReport(id);
  if (!ok) return NextResponse.json({ error: "Rapport introuvable." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
