import Link from "next/link";
import type { ReportSummary } from "@/types/analysis";

const PLATEFORMES: Record<string, { label: string; classe: string }> = {
  tiktok: { label: "TikTok", classe: "bg-pink-500/15 text-pink-300 ring-pink-500/25" },
  instagram: { label: "Instagram", classe: "bg-fuchsia-500/15 text-fuchsia-300 ring-fuchsia-500/25" },
  facebook: { label: "Facebook", classe: "bg-blue-500/15 text-blue-300 ring-blue-500/25" },
  youtube: { label: "YouTube", classe: "bg-red-500/15 text-red-300 ring-red-500/25" },
  autre: { label: "Autre", classe: "bg-ink-700 text-ink-300 ring-ink-600" },
};

export function scoreColor(score: number): string {
  if (score >= 70) return "text-brand-400";
  if (score >= 45) return "text-accent-400";
  return "text-red-400";
}

export default function ReportCard({ report }: { report: ReportSummary }) {
  const plateforme = PLATEFORMES[report.platform] ?? PLATEFORMES.autre;
  const date = new Date(report.createdAt).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Link
      href={`/analyse/${report.id}`}
      className="group flex gap-4 rounded-xl border border-ink-800 bg-ink-900/50 p-3 transition hover:border-ink-700 hover:bg-ink-850"
    >
      <div className="h-24 w-16 shrink-0 overflow-hidden rounded-lg bg-ink-850">
        {report.miniature && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/media/${report.id}/${report.miniature}`}
            alt=""
            className="h-full w-full object-cover transition group-hover:scale-105"
          />
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-medium ring-1 ${plateforme.classe}`}>
              {plateforme.label}
            </span>
            <span className="text-[11px] text-ink-400">{date}</span>
          </div>
          <p className="mt-1.5 truncate text-sm font-medium">{report.produit}</p>
          <p className="mt-0.5 truncate text-xs text-ink-400">{report.titre}</p>
        </div>
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className={`text-lg font-semibold tabular-nums ${scoreColor(report.score)}`}>
            {report.score}
          </span>
          <span className="text-[11px] text-ink-400">/100 potentiel Algérie</span>
        </div>
      </div>
    </Link>
  );
}
