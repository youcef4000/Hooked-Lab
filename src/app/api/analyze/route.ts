import { NextResponse } from "next/server";
import { isSupportedUrl } from "@/lib/download";
import { MESSAGE_MAINTENANCE, arretEnCours, launchAnalysis } from "@/lib/pipeline";
import { config } from "@/lib/config";
import { autoriserAnalyse } from "@/lib/garde";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Lance une analyse a partir d'un lien de plateforme. */
export async function POST(request: Request) {
  // Mise a jour en cours : on ne lance plus rien, et on ne debite rien.
  if (arretEnCours()) {
    return NextResponse.json({ error: MESSAGE_MAINTENANCE }, { status: 503 });
  }

  let body: { url?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requete invalide." }, { status: 400 });
  }

  const url = body.url?.trim();
  if (!url) {
    return NextResponse.json({ error: "Colle le lien de la video." }, { status: 400 });
  }
  if (!isSupportedUrl(url)) {
    return NextResponse.json(
      {
        error:
          "Lien non pris en charge. Colle le lien d'une vidéo TikTok, Instagram, Facebook ou YouTube — ou dépose directement le fichier.",
      },
      { status: 400 },
    );
  }
  if (!config.anthropic.apiKey) {
    console.error("[hooked-lab] ANTHROPIC_API_KEY absente : aucune analyse possible.");
    return NextResponse.json(
      { error: "Le service d'analyse est momentanément indisponible. Réessaie dans quelques minutes." },
      { status: 503 },
    );
  }

  // Un lien mene presque toujours a une video : on prend le tarif video, et
  // le pipeline ajustera si c'est finalement une image.
  const acces = await autoriserAnalyse("video");
  if (!acces.autorise) {
    return NextResponse.json({ error: acces.message }, { status: acces.statut ?? 402 });
  }

  const id = launchAnalysis({ type: "url", url }, acces.utilisateurId, acces.montant);
  return NextResponse.json({ id });
}
