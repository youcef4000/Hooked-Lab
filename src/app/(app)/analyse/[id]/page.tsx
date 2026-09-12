import { notFound } from "next/navigation";
import { JobProgress } from "@/components/JobProgress";
import { ReportView } from "@/components/report/ReportView";
import { getJob } from "@/lib/jobs";
import { getReport } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function PageAnalyse({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const report = getReport(id);
  if (report) return <ReportView report={report} />;

  // Pas encore de rapport : soit le traitement tourne, soit l'identifiant est faux.
  if (getJob(id)) return <JobProgress id={id} />;

  notFound();
}
