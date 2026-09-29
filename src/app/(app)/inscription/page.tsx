import { redirect } from "next/navigation";
import { FormulaireAuth } from "@/components/compte/FormulaireAuth";
import { langueCourante } from "@/lib/langue-serveur";
import { utilisateurCourant } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return { title: (await langueCourante()) === "fr" ? "Créer un compte" : "Create an account" };
}

export default async function Inscription({
  searchParams,
}: {
  searchParams: Promise<{ formule?: string; periode?: string }>;
}) {
  const { formule, periode } = await searchParams;
  // Deja connecte : on va droit au compte, avec la formule choisie.
  if (await utilisateurCourant()) {
    redirect(formule ? `/compte?formule=${encodeURIComponent(formule)}&periode=${periode === "12" ? "12" : "1"}` : "/compte");
  }
  return <FormulaireAuth mode="inscription" formule={formule} periode={periode} />;
}
