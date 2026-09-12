"use client";

import Link from "next/link";
import { UploadDropzone } from "../UploadDropzone";
import { AnalyzeForm } from "../AnalyzeForm";
import { CarteVivante, Reveal } from "../Reveal";
import { COUT_CREDITS } from "@/lib/tarifs";
import type { ReportSummary } from "@/types/analysis";

/* ============================================================================
   Page d'analyse, version abonne.

   Meme systeme visuel que la vitrine, mais l'inverse en priorites : celui
   qui paie vient travailler, pas decouvrir. La zone de depot occupe le haut
   de l'ecran, l'historique est immediatement accessible, et le discours de
   vente a disparu — il a deja achete.

   Le mouvement se limite a une entree unique. Quelqu'un qui ouvre cette page
   quinze fois par jour n'a pas envie d'assister quinze fois au meme spectacle.
   ========================================================================== */

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
  const prenom = nom.split(" ")[0];
  // Ce que le solde permet encore, en langage concret plutot qu'en credits.
  const videosPossibles = Math.floor(credits / COUT_CREDITS.videoMoyenne);

  return (
    <Reveal cascade={50}>
      <div className="rev mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-medium tracking-[-0.02em] text-mist-100 sm:text-2xl">
            {illimite ? "Espace de travail" : `Bonjour ${prenom}`}
          </h1>
          <p className="mt-1 text-sm text-mist-400">
            {illimite
              ? "Accès propriétaire — tes analyses ne sont pas décomptées."
              : `${credits} crédits — de quoi analyser environ ${videosPossibles} vidéo${
                  videosPossibles > 1 ? "s" : ""
                }.`}
          </p>
        </div>
        <Link
          href={illimite ? "/admin" : "/compte"}
          className="rounded-full border border-ink-700 px-4 py-1.5 text-xs font-medium text-mist-300 transition hover:border-brand-500/50 hover:text-brand-300"
        >
          {illimite ? "Administration" : "Recharger"}
        </Link>
      </div>

      {/* La zone de depot, pleine largeur, sans rien au-dessus */}
      <div className="rev">
        <div className="rounded-[var(--r-xl)] border border-ink-700 bg-ink-900/70 p-2 shadow-[var(--ombre-pose)]">
          <UploadDropzone />
        </div>

        <div className="mt-4">
          <div className="mb-3 flex items-center gap-3">
            <span className="h-px flex-1 bg-ink-800" />
            <span className="text-[11px] uppercase tracking-[0.14em] text-mist-500">
              ou depuis un lien
            </span>
            <span className="h-px flex-1 bg-ink-800" />
          </div>
          <AnalyzeForm />
        </div>
      </div>

      {recentes.length > 0 && (
        <section data-rev-groupe className="mt-12">
          <div className="rev mb-4 flex flex-wrap items-end justify-between gap-3">
            <h2 className="text-base font-medium text-mist-100">Reprendre où tu en étais</h2>
            <Link
              href="/historique"
              className="text-sm text-brand-300 underline underline-offset-4 transition hover:text-brand-400"
            >
              Tout l&apos;historique
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {recentes.map((a) => (
              <Link key={a.id} href={`/analyse/${a.id}`} className="rev block">
                <CarteVivante className="flex h-full gap-3 overflow-hidden p-3">
                  <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-[var(--r-sm)] bg-ink-950">
                    {a.miniature && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={`/api/media/${a.id}/${a.miniature}`}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-brand-500/12 px-2 py-0.5 text-[11px] font-medium text-brand-300">
                        {a.score}/100
                      </span>
                    </div>
                    <p className="mt-1.5 line-clamp-2 text-sm leading-snug text-mist-100">
                      {a.produit}
                    </p>
                    <p className="mt-1 text-[11px] text-mist-500">
                      {new Date(a.createdAt).toLocaleDateString("fr-FR")}
                    </p>
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
