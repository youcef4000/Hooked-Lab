import { redirect } from "next/navigation";
import { HistoryGrid } from "@/components/HistoryGrid";
import { analysesVisibles, lecteurCourant } from "@/lib/acces-analyses";

export const dynamic = "force-dynamic";
export const metadata = { title: "Historique" };

export default async function Historique() {
  const lecteur = await lecteurCourant();
  if (!lecteur.admin && !lecteur.utilisateurId) redirect("/connexion");

  const analyses = analysesVisibles(lecteur);

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-semibold tracking-tight text-mist-100">Historique</h1>
        <p className="mt-1 text-sm text-mist-400">
          {analyses.length === 0
            ? "Tes analyses terminées apparaîtront ici."
            : `${analyses.length} analyse${analyses.length > 1 ? "s" : ""}${
                lecteur.admin ? " sur tout le site" : ", visibles de toi seul"
              }.`}
        </p>
      </div>
      <HistoryGrid analyses={analyses} supprimable />
    </div>
  );
}
