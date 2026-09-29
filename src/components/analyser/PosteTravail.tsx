"use client";

import Link from "next/link";
import { UploadDropzone } from "../UploadDropzone";
import { AnalyzeForm } from "../AnalyzeForm";
import { CarteVivante, Reveal } from "../Reveal";
import { SelecteurMarche } from "../Marche";
import { useLangue, useT } from "../Langue";
import { videosPour } from "@/lib/tarifs";
import { marche as trouverMarche } from "@/lib/marches";
import { locale } from "@/lib/langue";
import type { ReportSummary } from "@/types/analysis";

/* ============================================================================
   Page d'analyse, version abonne.

   Celui qui paie vient travailler, pas decouvrir. Le marche vise d'abord
   (retenu d'une fois sur l'autre), la zone de depot ensuite, l'historique
   dessous. Le mouvement se limite a une entree unique : quelqu'un qui ouvre
   cette page quinze fois par jour n'a pas envie d'assister quinze fois au
   meme spectacle.
   ========================================================================== */

const TEXTES = {
  fr: {
    espace: "Espace de travail",
    bonjour: (p: string) => `Bonjour ${p}`,
    proprietaire: "Accès propriétaire — tes analyses ne sont pas décomptées.",
    solde: (c: number, v: number) => `${c} crédits — de quoi analyser environ ${v} vidéo${v > 1 ? "s" : ""}.`,
    admin: "Administration",
    recharger: "Reprendre des crédits",
    lien: "ou depuis un lien",
    reprendre: "Reprendre où tu en étais",
    tout: "Tout l'historique",
  },
  en: {
    espace: "Workspace",
    bonjour: (p: string) => `Hi ${p}`,
    proprietaire: "Owner access — your analyses are not charged.",
    solde: (c: number, v: number) => `${c} credits — enough for about ${v} video${v > 1 ? "s" : ""}.`,
    admin: "Admin",
    recharger: "Get more credits",
    lien: "or from a link",
    reprendre: "Pick up where you left off",
    tout: "Full history",
  },
};

export function PosteTravail({
  recentes,
  credits,
  nom,
  illimite = false,
}: {
  recentes: ReportSummary[];
  credits: number;
  nom: string;
  /** Le proprietaire : aucun debit, donc aucun solde a afficher. */
  illimite?: boolean;
}) {
  const t = useT(TEXTES);
  const langue = useLangue();
  const prenom = nom.split(" ")[0];

  return (
    <Reveal cascade={50}>
      <div className="rev mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-medium tracking-[-0.02em] text-mist-100 sm:text-2xl">
            {illimite ? t.espace : t.bonjour(prenom)}
          </h1>
          <p className="mt-1 text-sm text-mist-400">{illimite ? t.proprietaire : t.solde(credits, videosPour(credits))}</p>
        </div>
        <Link
          href={illimite ? "/admin" : "/compte"}
          className="rounded-full border border-ink-700 px-4 py-1.5 text-xs font-medium text-mist-300 transition hover:border-brand-500/50 hover:text-brand-300"
        >
          {illimite ? t.admin : t.recharger}
        </Link>
      </div>

      <div className="rev">
        <SelecteurMarche className="mb-4" />

        <div className="rounded-[var(--r-xl)] border border-ink-700 bg-ink-900/70 p-2 shadow-[var(--ombre-pose)]">
          <UploadDropzone />
        </div>

        <div className="mt-4">
          <div className="mb-3 flex items-center gap-3">
            <span className="h-px flex-1 bg-ink-800" />
            <span className="text-[11px] uppercase tracking-[0.14em] text-mist-500">{t.lien}</span>
            <span className="h-px flex-1 bg-ink-800" />
          </div>
          <AnalyzeForm />
        </div>
      </div>

      {recentes.length > 0 && (
        <section data-rev-groupe className="mt-12">
          <div className="rev mb-4 flex flex-wrap items-end justify-between gap-3">
            <h2 className="text-base font-medium text-mist-100">{t.reprendre}</h2>
            <Link href="/historique" className="text-sm text-brand-300 underline underline-offset-4 transition hover:text-brand-400">
              {t.tout}
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {recentes.map((a) => (
              <Link key={a.id} href={`/analyse/${a.id}`} className="rev block">
                <CarteVivante className="flex h-full gap-3 overflow-hidden p-3">
                  <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-[var(--r-sm)] bg-ink-950">
                    {a.miniature && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={`/api/media/${a.id}/${a.miniature}`} alt="" className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-brand-500/12 px-2 py-0.5 text-[11px] font-medium text-brand-300">{a.score}/100</span>
                      <span className="text-sm leading-none" title={trouverMarche(a.marche).nom[langue]}>
                        {trouverMarche(a.marche).drapeau}
                      </span>
                    </div>
                    <p className="mt-1.5 line-clamp-2 text-sm leading-snug text-mist-100">{a.produit}</p>
                    <p className="mt-1 text-[11px] text-mist-500">{new Date(a.createdAt).toLocaleDateString(locale(langue))}</p>
                  </div>
                </CarteVivante>
              </Link>
            ))}
          </div>
        </section>
      )}
    </Reveal>
  );
}
