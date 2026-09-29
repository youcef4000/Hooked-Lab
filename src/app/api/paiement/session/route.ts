import { utilisateurCourant } from "@/lib/session";
import { construireOffre } from "@/lib/paiements";
import { creerSessionPaiement, paiementCarteActif } from "@/lib/stripe";
import { creerLimiteur, ipClient } from "@/lib/limiteur";
import { urlSiteDepuis } from "@/lib/site";
import { langueCourante } from "@/lib/langue-serveur";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* Ouvre une page de paiement Stripe pour l'abonne connecte. */

const tropDeDemandes = creerLimiteur("paiement", 10 * 60_000, 15);

export async function POST(requete: Request): Promise<Response> {
  const fr = (await langueCourante()) === "fr";
  const refus = (fr_: string, en: string, status: number) =>
    Response.json({ ok: false, message: fr ? fr_ : en }, { status });

  if (!paiementCarteActif()) {
    return refus("Le paiement par carte n'est pas encore disponible.", "Card payment isn't available yet.", 503);
  }

  const u = await utilisateurCourant();
  if (!u) return refus("Connecte-toi d'abord.", "Please sign in first.", 401);
  if (tropDeDemandes(`${u.id}:${ipClient(requete)}`)) {
    return refus("Trop de tentatives. Réessaie dans quelques minutes.", "Too many attempts. Try again in a few minutes.", 429);
  }

  let corps: Record<string, unknown>;
  try {
    corps = (await requete.json()) as Record<string, unknown>;
  } catch {
    return refus("Requête illisible.", "Unreadable request.", 400);
  }

  // Le prix vient de la grille du serveur, jamais du navigateur.
  const offre = construireOffre(corps);
  if (!offre) return refus("Formule inconnue.", "Unknown plan.", 422);

  const base = urlSiteDepuis(requete.headers);
  try {
    const session = await creerSessionPaiement({
      libelle: offre.libelle,
      description: offre.description,
      montant: offre.montant,
      devise: offre.devise,
      utilisateurId: u.id,
      email: u.email,
      metadonnees: {
        type: offre.type,
        reference: String(corps.reference),
        mois: String(corps.mois ?? ""),
      },
      urlSucces: `${base}/compte?paiement=ok`,
      urlAnnulation: `${base}/compte?paiement=annule`,
    });
    return Response.json({ ok: true, url: session.url });
  } catch (err) {
    // Le detail technique reste dans les journaux du serveur.
    console.error("[paiement] ouverture de session impossible :", (err as Error).message);
    return refus(
      "Le paiement par carte est momentanément indisponible. Réessaie dans un instant.",
      "Card payment is temporarily unavailable. Please try again in a moment.",
      502,
    );
  }
}
