import { NextResponse } from "next/server";
import { writeFileSync, unlinkSync } from "node:fs";
import path from "node:path";
import { ffmpegPath, run, ytDlpPath } from "@/lib/bin";
import { config } from "@/lib/config";
import { DATA_DIR, ensureDir } from "@/lib/paths";
import type { Verification } from "@/types/analysis";
import { estConnecte } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function versionBinaire(
  nom: string,
  resoudre: () => string,
  args: string[],
  correction: string,
): Promise<Verification> {
  try {
    const chemin = resoudre();
    const res = await run(chemin, args, { timeoutMs: 20_000 });
    if (res.code !== 0) {
      return { nom, ok: false, detail: `Trouve mais ne demarre pas : ${chemin}`, correction };
    }
    const version = (res.stdout || res.stderr).split(/\r?\n/)[0].trim();
    return { nom, ok: true, detail: version.slice(0, 90) };
  } catch (err) {
    return { nom, ok: false, detail: (err as Error).message, correction };
  }
}

export async function GET() {
  // Reserve au proprietaire : chemins, versions et etat de la cle ne
  // regardent personne d'autre.
  if (!(await estConnecte())) return NextResponse.json({ error: "Introuvable." }, { status: 404 });

  const verifications: Verification[] = [];

  verifications.push({
    nom: "Node.js",
    ok: Number(process.versions.node.split(".")[0]) >= 20,
    detail: `Version ${process.versions.node}`,
    correction: "Installe Node.js 20 ou plus recent depuis nodejs.org.",
  });

  verifications.push(
    await versionBinaire(
      "yt-dlp",
      ytDlpPath,
      ["--version"],
      "Lance `npm run setup` a la racine du projet.",
    ),
  );

  verifications.push(
    await versionBinaire(
      "ffmpeg",
      ffmpegPath,
      ["-version"],
      "Lance `npm install ffmpeg-static` puis `npm run setup`.",
    ),
  );

  // Cle API : on verifie sa presence, jamais sa valeur.
  verifications.push({
    nom: "Cle ANTHROPIC_API_KEY",
    ok: Boolean(config.anthropic.apiKey),
    detail: config.anthropic.apiKey
      ? `Presente (${config.anthropic.apiKey.length} caracteres)`
      : "Absente ou vide",
    correction:
      "Ouvre .env.local a la racine, colle ta cle apres ANTHROPIC_API_KEY= " +
      "(elle se cree sur console.anthropic.com/settings/keys), puis relance `npm run dev`.",
  });

  // Appel reel a l'API : verifie la cle, le modele et la connexion d'un coup.
  if (config.anthropic.apiKey) {
    try {
      const res = await fetch(`https://api.anthropic.com/v1/models/${config.anthropic.model}`, {
        headers: {
          "x-api-key": config.anthropic.apiKey,
          "anthropic-version": "2023-06-01",
        },
      });
      if (res.ok) {
        const data = (await res.json()) as { display_name?: string };
        verifications.push({
          nom: `Modele ${config.anthropic.model}`,
          ok: true,
          detail: `Accessible — ${data.display_name ?? config.anthropic.model}`,
        });
      } else {
        verifications.push({
          nom: `Modele ${config.anthropic.model}`,
          ok: false,
          detail: `L'API repond ${res.status}`,
          correction:
            res.status === 401
              ? "Cle invalide ou revoquee. Recree-en une sur console.anthropic.com."
              : res.status === 404
                ? "Modele inconnu. Mets ANTHROPIC_MODEL=claude-opus-5 dans .env.local."
                : "Verifie ton compte Anthropic (credit disponible, limites).",
        });
      }
    } catch (err) {
      verifications.push({
        nom: "Connexion a l'API Anthropic",
        ok: false,
        detail: (err as Error).message,
        correction: "Verifie ta connexion internet ou ton pare-feu / proxy.",
      });
    }
  }

  // Ecriture sur disque : sans elle, aucun rapport ne peut etre enregistre.
  try {
    ensureDir(DATA_DIR);
    const temoin = path.join(DATA_DIR, ".ecriture-test");
    writeFileSync(temoin, "ok");
    unlinkSync(temoin);
    verifications.push({ nom: "Dossier data", ok: true, detail: `Accessible en ecriture — ${DATA_DIR}` });
  } catch (err) {
    verifications.push({
      nom: "Dossier data",
      ok: false,
      detail: (err as Error).message,
      correction: "Verifie les droits d'ecriture sur le dossier du projet.",
    });
  }

  verifications.push({
    nom: "Transcription",
    ok: true,
    detail:
      config.transcriber === "auto"
        ? "Mode auto : sous-titres de la plateforme, puis Whisper local, puis lecture des textes a l'ecran"
        : `Mode ${config.transcriber}`,
  });

  return NextResponse.json({
    ok: verifications.every((v) => v.ok),
    modele: config.anthropic.model,
    maxFrames: config.maxFrames,
    maxVideoSeconds: config.maxVideoSeconds,
    verifications,
  });
}
