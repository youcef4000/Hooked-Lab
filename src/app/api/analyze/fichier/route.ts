import { NextResponse } from "next/server";
import { config } from "@/lib/config";
import { autoriserAnalyse } from "@/lib/garde";
import { launchAnalysis } from "@/lib/pipeline";
import {
  EXTENSIONS_ACCEPTEES,
  TAILLE_MAX_OCTETS,
  UploadError,
  ecrireFluxSurDisque,
  estImage,
  extensionAcceptee,
  formatTaille,
  supprimerFichier,
  validerImage,
  validerVideo,
} from "@/lib/upload";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Le corps est ecrit en flux sur le disque : rien n'est bufferise en memoire.
export const maxDuration = 600;

/**
 * Lance une analyse a partir d'un fichier depose.
 *
 * Le fichier arrive en octets bruts dans le corps de la requete, avec son nom
 * dans l'en-tete `x-nom-fichier`. Cette forme evite le decodage multipart et
 * permet d'ecrire directement en flux, sans charger 300 Mo en memoire.
 */
export async function POST(request: Request) {
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

  const enTete = request.headers.get("x-nom-fichier");
  if (!enTete) {
    return NextResponse.json({ error: "Nom du fichier manquant." }, { status: 400 });
  }

  let nomOriginal: string;
  try {
    nomOriginal = decodeURIComponent(enTete);
  } catch {
    return NextResponse.json({ error: "Nom de fichier illisible." }, { status: 400 });
  }

  if (!extensionAcceptee(nomOriginal)) {
    return NextResponse.json(
      {
        error: `Format non pris en charge. Formats acceptes : ${EXTENSIONS_ACCEPTEES.join(", ")}.`,
      },
      { status: 400 },
    );
  }

  // Rejet immediat si la taille annoncee depasse la limite : inutile de transferer.
  const tailleAnnoncee = Number(request.headers.get("content-length") ?? 0);
  if (tailleAnnoncee > TAILLE_MAX_OCTETS) {
    return NextResponse.json(
      {
        error:
          `Fichier trop volumineux (${formatTaille(tailleAnnoncee)}). ` +
          `La limite est ${formatTaille(TAILLE_MAX_OCTETS)}.`,
      },
      { status: 413 },
    );
  }

  if (!request.body) {
    return NextResponse.json({ error: "Aucun fichier recu." }, { status: 400 });
  }

  let chemin: string;
  let taille: number;
  try {
    ({ chemin, taille } = await ecrireFluxSurDisque(request.body, nomOriginal));
  } catch (err) {
    const message =
      err instanceof UploadError
        ? err.message
        : `Le transfert du fichier a echoue : ${(err as Error).message}`;
    return NextResponse.json({ error: message }, { status: 400 });
  }

  // Validation du contenu reel avant de lancer quoi que ce soit : une image
  // deposee est une creative statique, une video suit le circuit habituel.
  const validation = estImage(nomOriginal)
    ? await validerImage(chemin)
    : await validerVideo(chemin);
  if (!validation.ok) {
    supprimerFichier(chemin);
    return NextResponse.json({ error: validation.message }, { status: 400 });
  }

  // Le controle des credits vient apres la validation du contenu : on ne
  // facture pas quelqu'un dont le fichier va etre refuse.
  const acces = await autoriserAnalyse(estImage(nomOriginal) ? "image" : "video");
  if (!acces.autorise) {
    supprimerFichier(chemin);
    return NextResponse.json({ error: acces.message }, { status: acces.statut ?? 402 });
  }

  const id = launchAnalysis(
    { type: "fichier", cheminTemporaire: chemin, nomOriginal, taille },
    acces.utilisateurId,
  );
  return NextResponse.json({ id });
}
