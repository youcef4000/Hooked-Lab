import { redirect } from "next/navigation";
import { HistoryGrid } from "@/components/HistoryGrid";
import { analysesVisibles, lecteurCourant } from "@/lib/acces-analyses";
import { langueCourante } from "@/lib/langue-serveur";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return { title: (await langueCourante()) === "fr" ? "Historique" : "History" };
}

export default async function Historique() {
  const lecteur = await lecteurCourant();
  if (!lecteur.admin && !lecteur.utilisateurId) redirect("/connexion");

  const langue = await langueCourante();
  const fr = langue === "fr";
  const analyses = analysesVisibles(lecteur);
  const n = analyses.length;

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-semibold tracking-tight text-mist-100">{fr ? "Historique" : "History"}</h1>
        <p className="mt-1 text-sm text-mist-400">
          {n === 0
            ? fr
              ? "Tes analyses terminées apparaîtront ici."
              : "Your finished analyses will show up here."
            : fr
              ? `${n} analyse${n > 1 ? "s" : ""}${lecteur.admin ? " sur tout le site" : ", visibles de toi seul"}.`
              : `${n} analys${n > 1 ? "es" : "is"}${lecteur.admin ? " across the site" : ", visible to you only"}.`}
        </p>
      </div>
      <HistoryGrid analyses={analyses} supprimable langue={langue} />
    </div>
  );
}
