import { createReadStream, existsSync, statSync } from "node:fs";
import { Readable } from "node:stream";
import path from "node:path";
import { NextResponse } from "next/server";
import { safeMediaPath } from "@/lib/paths";
import { lecteurCourant, peutVoir } from "@/lib/acces-analyses";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mkv": "video/x-matroska",
  ".mov": "video/quicktime",
  ".vtt": "text/vtt; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};

/** Sert les fichiers produits par une analyse (images, audio, video). */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; file: string[] }> },
) {
  const { id, file } = await params;
  if (!peutVoir(id, await lecteurCourant())) {
    return NextResponse.json({ error: "Fichier introuvable." }, { status: 404 });
  }

  // safeMediaPath refuse tout chemin qui sortirait du dossier de l'analyse.
  const target = safeMediaPath(id, file.join("/"));
  if (!target || !existsSync(target) || !statSync(target).isFile()) {
    return NextResponse.json({ error: "Fichier introuvable." }, { status: 404 });
  }

  const ext = path.extname(target).toLowerCase();
  const stat = statSync(target);
  const stream = Readable.toWeb(createReadStream(target)) as ReadableStream;

  return new Response(stream, {
    headers: {
      "Content-Type": TYPES[ext] ?? "application/octet-stream",
      "Content-Length": String(stat.size),
      "Cache-Control": "private, max-age=3600",
    },
  });
}
