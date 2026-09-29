import Link from "next/link";
import { Badge } from "./ui";
import { DeleteAnalysisButton } from "./DeleteAnalysisButton";
import type { ReportSummary } from "@/types/analysis";
import type { Langue } from "@/lib/langue";
import { locale } from "@/lib/langue";
import { marche as trouverMarche } from "@/lib/marches";

const PLATEFORMES: Record<string, { label: string; tone: "vert" | "bleu" | "ambre" | "neutre" }> = {
  tiktok: { label: "TikTok", tone: "neutre" },
  instagram: { label: "Instagram", tone: "ambre" },
  facebook: { label: "Facebook", tone: "bleu" },
  youtube: { label: "YouTube", tone: "neutre" },
  fichier: { label: "Fichier", tone: "vert" },
  image: { label: "Image", tone: "ambre" },
  autre: { label: "Autre", tone: "neutre" },
};

function scoreTone(score: number): "vert" | "ambre" | "rouge" {
  return score >= 65 ? "vert" : score >= 45 ? "ambre" : "rouge";
}

export function HistoryGrid({
  analyses,
  supprimable = false,
  langue = "fr",
}: {
  analyses: ReportSummary[];
  supprimable?: boolean;
  langue?: Langue;
}) {
  const fr = langue === "fr";
  if (!analyses.length) {
    return (
      <div className="rounded-xl border border-dashed border-ink-700 px-6 py-12 text-center">
        <p className="text-sm text-mist-300">{fr ? "Aucune analyse pour le moment." : "No analysis yet."}</p>
        <p className="mt-1 text-xs text-mist-400">
          {supprimable ? (
            <>
              {fr ? "Lance ta première analyse depuis " : "Run your first analysis from "}
              <Link href="/analyser" className="text-brand-400 hover:text-brand-300">
                {fr ? "l'outil" : "the tool"}
              </Link>
              .
            </>
          ) : (
            fr ? "Colle un lien de créative ci-dessus pour lancer la première." : "Paste a creative link above to run the first one."
          )}
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {analyses.map((a) => {
        const plat = PLATEFORMES[a.platform] ?? PLATEFORMES.autre;
        return (
          <div
            key={a.id}
            className="group relative overflow-hidden rounded-xl border border-ink-800 bg-ink-900 transition hover:border-ink-600"
          >
            <Link href={`/analyse/${a.id}`} className="block">
              <div className="flex gap-3 p-3">
                <div className="h-24 w-16 shrink-0 overflow-hidden rounded-lg bg-ink-850">
                  {a.miniature && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={`/api/media/${a.id}/${a.miniature}`}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <Badge tone={plat.tone}>{plat.label}</Badge>
                    <Badge tone={scoreTone(a.score)}>{a.score}/100</Badge>
                    <span className="text-sm leading-none" title={trouverMarche(a.marche).nom[langue]}>
                      {trouverMarche(a.marche).drapeau}
                    </span>
                  </div>
                  <p className="mt-1.5 line-clamp-2 text-sm font-medium leading-snug text-mist-100">
                    {a.produit}
                  </p>
                  <p className="mt-1 line-clamp-2 text-xs leading-snug text-mist-400">{a.titre}</p>
                  <p className="mt-1.5 text-[11px] text-mist-400">
                    {new Date(a.createdAt).toLocaleString(locale(langue), {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </p>
                </div>
              </div>
            </Link>
            {supprimable && (
              <div className="absolute right-2 top-2 opacity-0 transition group-hover:opacity-100">
                <DeleteAnalysisButton id={a.id} langue={langue} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
