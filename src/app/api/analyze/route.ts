import { NextResponse } from "next/server";
import { isSupportedUrl } from "@/lib/download";
import { launchAnalysis } from "@/lib/pipeline";
import { config } from "@/lib/config";
import { autoriserAnalyse } from "@/lib/garde";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Lance une analyse a partir d'un lien de plateforme. */
export async function POST(request: Request) {
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
      { error: "Lien invalide. Il doit commencer par http:// ou https://" },
      { status: 400 },
    );
  }
  if (!config.anthropic.apiKey) {
    return NextResponse.json(
      {
        error:
          "ANTHROPIC_API_KEY manquante. Ouvre .env.local a la racine du projet, colle ta cle " +
          "apres ANTHROPIC_API_KEY= puis relance `npm run dev`.",
      },
      { status: 500 },
    );
  }

  // Un lien mene presque toujours a une video : on prend le tarif video, et
  // le pipeline ajustera si c'est finalement une image.
  const acces = await autoriserAnalyse("video");
  if (!acces.autorise) {
    return NextResponse.json({ error: acces.message }, { status: acces.statut ?? 402 });
  }

  const id = launchAnalysis({ type: "url", url }, acces.utilisateurId);
  return NextResponse.json({ id });
}
