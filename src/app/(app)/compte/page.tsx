import { redirect } from "next/navigation";
import { EspaceCompte } from "@/components/compte/EspaceCompte";
import { versPublic } from "@/lib/comptes";
import { utilisateurCourant } from "@/lib/session";
import { paiementCarteActif } from "@/lib/stripe";

export const metadata = { title: "Mon compte" };
export const dynamic = "force-dynamic";

export default async function PageCompte({
  searchParams,
}: {
  searchParams: Promise<{ paiement?: string }>;
}) {
  const u = await utilisateurCourant();
  if (!u) redirect("/connexion");
  const { paiement } = await searchParams;
  return (
    <EspaceCompte
      initial={versPublic(u)}
      paiementCarte={paiementCarteActif()}
      retourPaiement={paiement === "ok" ? "ok" : paiement === "annule" ? "annule" : undefined}
    />
  );
}
