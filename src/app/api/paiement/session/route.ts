import { utilisateurCourant } from "@/lib/session";
import { construireOffre } from "@/lib/paiements";
import { creerSessionPaiement, paiementCarteActif } from "@/lib/stripe";
import { creerLimiteur, ipClient } from "@/lib/limiteur";
import { urlSiteDepuis } from "@/lib/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* Ouvre une page de paiement Stripe pour l'abonne connecte. */

const tropDeDemandes = creerLimiteur("paiement", 10 * 60_000, 15);

export async function POST(requete: Request): Promise<Response> {
  if (!paiementCarteActif()) {
    return Response.json({ ok: false, message: "Le paiement par carte n'est pas encore disponible." }, { status: 503 });
  }

  const u = await utilisateurCourant();
  if (!u) return Response.json({ ok: false, message: "Connecte-toi d'abord." }, { status: 401 });
  if (tropDeDemandes(`${u.id}:${ipClient(requete)}`)) {
    return Response.json({ ok: false, message: "Trop de tentatives. Réessaie dans quelques minutes." }, { status: 429 });
  }

  let corps: Record<string, unknown>;
  try {
    corps = (await requete.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ ok: false, message: "Requête illisible." }, { status: 400 });
  }

  // Le prix vient de la grille du serveur, jamais du navigateur.
  const offre = construireOffre(corps);
  if (!offre) return Response.json({ ok: false, message: "Formule inconnue." }, { status: 422 });

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
    return Response.json({ ok: false, message: (err as Error).message }, { status: 502 });
  }
}
