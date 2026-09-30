import { accorderAchat } from "@/lib/paiements";
import { signatureValide } from "@/lib/stripe";
import { viderSauvegardes } from "@/lib/sauvegarde";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ============================================================================
   Reception des evenements Stripe.

   Seul endroit ou un paiement par carte se transforme en credits. La
   signature est verifiee sur le corps brut, avant toute lecture : un
   evenement non signe par Stripe est rejete sans etre interprete.

   Stripe relance l'envoi tant qu'il ne recoit pas un 2xx. On repond donc
   200 des que l'evenement est traite ou deja connu, et 500 seulement quand
   une nouvelle tentative a une chance de reussir.
   ========================================================================== */

interface SessionStripe {
  id: string;
  client_reference_id?: string | null;
  payment_status?: string;
  amount_total?: number | null;
  currency?: string | null;
  metadata?: Record<string, string> | null;
}

export async function POST(requete: Request): Promise<Response> {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim() ?? "";
  const corps = await requete.text();

  if (!signatureValide(corps, requete.headers.get("stripe-signature"), secret)) {
    return new Response("Signature invalide", { status: 400 });
  }

  let evenement: { type?: string; data?: { object?: SessionStripe } };
  try {
    evenement = JSON.parse(corps);
  } catch {
    return new Response("Corps illisible", { status: 400 });
  }

  // checkout.session.completed : carte payee immediatement.
  // checkout.session.async_payment_succeeded : moyens de paiement differes.
  const pertinent =
    evenement.type === "checkout.session.completed" ||
    evenement.type === "checkout.session.async_payment_succeeded";
  const session = evenement.data?.object;
  if (!pertinent || !session) return Response.json({ recu: true });
  if (session.payment_status !== "paid") return Response.json({ recu: true, enAttente: true });

  const utilisateurId = session.client_reference_id ?? session.metadata?.utilisateurId ?? "";
  if (!utilisateurId) {
    console.error(`[stripe] session ${session.id} payee sans utilisateur associe`);
    return Response.json({ recu: true, ignore: "utilisateur absent" });
  }

  const resultat = accorderAchat({
    id: session.id,
    utilisateurId,
    metadonnees: session.metadata ?? {},
    montantCentimes: session.amount_total ?? 0,
    devise: session.currency ?? "",
  });

  // Credits en lieu sur (R2) avant de repondre a Stripe.
  await viderSauvegardes(10_000);

  if (!resultat.ok) {
    // Paiement encaisse mais non credite : a regler a la main, on le signale
    // fort dans les logs plutot que de faire boucler Stripe indefiniment.
    console.error(`[stripe] PAIEMENT A CREDITER A LA MAIN — session ${session.id} : ${resultat.message}`);
    return Response.json({ recu: true, erreur: resultat.message });
  }
  return Response.json({ recu: true, deja: resultat.deja === true });
}
