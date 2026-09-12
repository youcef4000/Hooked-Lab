import { HistoryGrid } from "@/components/HistoryGrid";
import { listReports } from "@/lib/store";

export const dynamic = "force-dynamic";

export default function Historique() {
  const analyses = listReports();

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-semibold tracking-tight text-mist-100">Historique</h1>
        <p className="mt-1 text-sm text-mist-400">
          {analyses.length} analyse{analyses.length > 1 ? "s" : ""} enregistree
          {analyses.length > 1 ? "s" : ""} sur ce poste, dans le dossier{" "}
          <code className="rounded bg-ink-800 px-1.5 py-0.5 text-xs">data/analyses</code>.
        </p>
      </div>
      <HistoryGrid analyses={analyses} supprimable />
    </div>
  );
}
