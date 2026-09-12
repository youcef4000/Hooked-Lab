import { redirect } from "next/navigation";
import { EspaceCompte } from "@/components/compte/EspaceCompte";
import { versPublic } from "@/lib/comptes";
import { utilisateurCourant } from "@/lib/session";

export const metadata = { title: "Mon compte" };
export const dynamic = "force-dynamic";

export default async function PageCompte() {
  const u = await utilisateurCourant();
  if (!u) redirect("/connexion");
  return <EspaceCompte initial={versPublic(u)} />;
}
