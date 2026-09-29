import { redirect } from "next/navigation";
import { EspaceCompte } from "@/components/compte/EspaceCompte";
import { versPublic } from "@/lib/comptes";
import { utilisateurCourant } from "@/lib/session";
import { paiementCarteActif } from "@/lib/stripe";
import { langueCourante } from "@/lib/langue-serveur";

export async function generateMetadata() {
  return { title: (await langueCourante()) === "fr" ? "Mon compte" : "My account" };
}
export const dynamic = "force-dynamic";

export default async function PageCompte({
  searchParams,
}: {
  searchParams: Promise<{ paiement?: string; formule?: string; periode?: string }>;
}) {
  const u = await utilisateurCourant();
  const { paiement, formule, periode } = await searchParams;
  if (!u) {
    // La formule choisie survit a la connexion.
    const suite = formule ? `?formule=${encodeURIComponent(formule)}&periode=${periode ?? "1"}` : "";
    redirect(`/connexion${suite}`);
  }
  return (
    <EspaceCompte
      initial={versPublic(u)}
      paiementCarte={paiementCarteActif()}
      retourPaiement={paiement === "ok" ? "ok" : paiement === "annule" ? "annule" : undefined}
      formule={formule}
      periode={Number(periode) === 12 ? 12 : 1}
    />
  );
}
