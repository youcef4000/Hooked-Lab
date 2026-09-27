import { notFound } from "next/navigation";
import { JobProgress } from "@/components/JobProgress";
import { ReportView } from "@/components/report/ReportView";
import { getJob } from "@/lib/jobs";
import { getReport } from "@/lib/store";
import { lecteurCourant, peutVoir } from "@/lib/acces-analyses";

export const dynamic = "force-dynamic";

export default async function PageAnalyse({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // L'analyse d'un autre repond 404, comme un identifiant qui n'existe pas.
  const lecteur = await lecteurCourant();
  if (!peutVoir(id, lecteur)) notFound();

  const report = getReport(id);
  if (report) return <ReportView report={report} proprietaire={lecteur.admin} />;

  // Pas encore de rapport : soit le traitement tourne, soit l'identifiant est faux.
  if (getJob(id)) return <JobProgress id={id} />;

  notFound();
}
