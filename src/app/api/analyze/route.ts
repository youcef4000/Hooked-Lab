import { NextResponse } from "next/server";
import { isSupportedUrl } from "@/lib/download";
import { arretEnCours, launchAnalysis, messageMaintenance } from "@/lib/pipeline";
import { config } from "@/lib/config";
import { autoriserAnalyse } from "@/lib/garde";
import { langueCourante } from "@/lib/langue-serveur";
import { MARCHE_PAR_DEFAUT, estMarche } from "@/lib/marches";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Lance une analyse a partir d'un lien de plateforme, pour un marche donne. */
export async function POST(request: Request) {
  const langue = await langueCourante();
  const fr = langue === "fr";

  // Mise a jour en cours : on ne lance plus rien, et on ne debite rien.
  if (arretEnCours()) {
    return NextResponse.json({ error: messageMaintenance(langue) }, { status: 503 });
  }

  let body: { url?: string; marche?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: fr ? "Requête invalide." : "Invalid request." }, { status: 400 });
  }

  const url = body.url?.trim();
  if (!url) {
    return NextResponse.json(
      { error: fr ? "Colle le lien de la vidéo." : "Paste the video link." },
      { status: 400 },
    );
  }
  if (!isSupportedUrl(url)) {
    return NextResponse.json(
      {
        error: fr
          ? "Lien non pris en charge. Colle le lien d'une vidéo TikTok, Instagram, Facebook ou YouTube — ou dépose directement le fichier."
          : "Unsupported link. Paste a TikTok, Instagram, Facebook or YouTube video link — or upload the file directly.",
      },
      { status: 400 },
    );
  }
  if (!config.anthropic.apiKey) {
    console.error("[hooked-lab] ANTHROPIC_API_KEY absente : aucune analyse possible.");
    return NextResponse.json(
      {
        error: fr
          ? "Le service d'analyse est momentanément indisponible. Réessaie dans quelques minutes."
          : "The analysis service is temporarily unavailable. Try again in a few minutes.",
      },
      { status: 503 },
    );
  }

  const marche = estMarche(body.marche) ? body.marche : MARCHE_PAR_DEFAUT;

  // Un lien mene presque toujours a une video : on prend le tarif video, et
  // le pipeline ajustera si c'est finalement une image.
  const acces = await autoriserAnalyse("video", langue);
  if (!acces.autorise) {
    return NextResponse.json({ error: acces.message }, { status: acces.statut ?? 402 });
  }

  const id = launchAnalysis({ type: "url", url }, acces.utilisateurId, acces.montant, { marche, langue });
  return NextResponse.json({ id });
}
