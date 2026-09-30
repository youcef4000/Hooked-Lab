import { accorderAchat } from "@/lib/paiements";
import { lireSession } from "@/lib/stripe";
import { utilisateurCourant } from "@/lib/session";
import { urlSiteDepuis } from "@/lib/site";
import { viderSauvegardes } from "@/lib/sauvegarde";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ============================================================================
   Retour de la page de paiement Stripe : l'acces s'ouvre sur place.

   On ne croit pas le navigateur sur parole : la session est relue chez
   Stripe avec la cle secrete. Payee, et au nom du compte connecte, elle est
   accordee aussitot — l'abonne arrive dans l'outil avec ses credits. Si le
   webhook est passe avant, l'achat est reconnu et rien n'est accorde deux
   fois. Si le paiement est encore en cours de validation (certains moyens
   de paiement differes), l'espace compte attend le webhook.
   ========================================================================== */

export async function GET(requete: Request): Promise<Response> {
  const base = urlSiteDepuis(requete.headers);
  const vers = (chemin: string) => Response.redirect(`${base}${chemin}`, 303);

  const u = await utilisateurCourant();
  if (!u) return vers("/connexion");

  const id = new URL(requete.url).searchParams.get("session_id") ?? "";
  const session = await lireSession(id);
  if (!session || session.payment_status !== "paid") return vers("/compte?paiement=ok");

  const proprietaire = session.client_reference_id ?? session.metadata?.utilisateurId ?? "";
  if (proprietaire !== u.id) return vers("/compte");

  const resultat = accorderAchat({
    id: session.id,
    utilisateurId: u.id,
    metadonnees: session.metadata ?? {},
    montantCentimes: session.amount_total ?? 0,
    devise: session.currency ?? "",
  });
  await viderSauvegardes(10_000);
  if (!resultat.ok) {
    console.error(`[stripe] PAIEMENT A CREDITER A LA MAIN — session ${session.id} : ${resultat.message}`);
    return vers("/compte?paiement=ok");
  }
  return vers("/analyser?bienvenue=1");
}
