"use client";

import { useState } from "react";
import { Badge } from "../ui";
import { OverviewTab } from "./OverviewTab";
import { ScriptTab } from "./ScriptTab";
import { AnglesTab } from "./AnglesTab";
import { SourcingTab } from "./SourcingTab";
import { ProfitTab } from "./ProfitTab";
import { LaunchTab } from "./LaunchTab";
import type { Report } from "@/types/analysis";

/**
 * Chaque onglet porte sa couleur : actif = pilule pleine, inactif = teinte
 * douce de la meme couleur. La barre reste collee sous l'en-tete au scroll.
 */
const ONGLETS = [
  {
    id: "apercu",
    label: "Vue d'ensemble",
    actif: "bg-[#d4af37] text-[#120e04] shadow-lg shadow-[#d4af37]/25",
    repos: "bg-[#d4af37]/12 text-[#f2dfa0] ring-1 ring-inset ring-[#d4af37]/30 hover:bg-[#d4af37]/22",
  },
  {
    id: "script",
    label: "Script et séquences",
    actif: "bg-[#c9a227] text-[#120e04] shadow-lg shadow-[#c9a227]/25",
    repos: "bg-[#c9a227]/12 text-[#e0be55] ring-1 ring-inset ring-[#c9a227]/30 hover:bg-[#c9a227]/22",
  },
  {
    id: "angles",
    label: "Angles et mots-clés",
    actif: "bg-[#b87333] text-[#120e04] shadow-lg shadow-[#b87333]/25",
    repos: "bg-[#b87333]/12 text-[#d99457] ring-1 ring-inset ring-[#b87333]/30 hover:bg-[#b87333]/22",
  },
  {
    id: "sourcing",
    label: "Sourcing",
    actif: "bg-[#e08c3a] text-[#120e04] shadow-lg shadow-[#e08c3a]/25",
    repos: "bg-[#e08c3a]/12 text-[#eda86a] ring-1 ring-inset ring-[#e08c3a]/30 hover:bg-[#e08c3a]/22",
  },
  {
    id: "rentabilite",
    label: "Rentabilité COD",
    actif: "bg-[#3f7d6b] text-white shadow-lg shadow-[#3f7d6b]/25",
    repos: "bg-[#3f7d6b]/12 text-[#6fb5a1] ring-1 ring-inset ring-[#3f7d6b]/30 hover:bg-[#3f7d6b]/22",
  },
  {
    id: "lancement",
    label: "Pack de lancement",
    actif: "bg-[#f2dfa0] text-[#120e04] shadow-lg shadow-[#f2dfa0]/25",
    repos: "bg-[#f2dfa0]/12 text-[#cdb98a] ring-1 ring-inset ring-[#f2dfa0]/30 hover:bg-[#f2dfa0]/22",
  },
] as const;

type OngletId = (typeof ONGLETS)[number]["id"];

function scoreTone(score: number): "vert" | "ambre" | "rouge" {
  return score >= 65 ? "vert" : score >= 45 ? "ambre" : "rouge";
}

export function ReportView({
  report,
  proprietaire = false,
}: {
  report: Report;
  /** Le cout IA et les avertissements techniques ne regardent que l'administration. */
  proprietaire?: boolean;
}) {
  const [onglet, setOnglet] = useState<OngletId>("apercu");
  const { creative, source, dz } = report;

  return (
    <div>
      {/* En-tete ------------------------------------------------------- */}
      <div className="mb-6 flex flex-col gap-5 lg:flex-row lg:items-start">
        <div className="w-full max-w-[190px] shrink-0 overflow-hidden rounded-xl border border-ink-800 bg-ink-900">
          {report.media.video ? (
            <video
              src={`/api/media/${report.id}/${report.media.video}`}
              controls
              playsInline
              className="aspect-[9/16] w-full bg-black object-contain"
              poster={
                report.media.frames[0]
                  ? `/api/media/${report.id}/${report.media.frames[0].file}`
                  : undefined
              }
            />
          ) : (
            report.media.frames[0] && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={`/api/media/${report.id}/${report.media.frames[0].file}`}
                alt=""
                className="aspect-[9/16] w-full object-cover"
              />
            )
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge tone="bleu">{source.platform}</Badge>
            <Badge tone={scoreTone(dz.score.global_sur_100)}>
              Potentiel DZ {dz.score.global_sur_100}/100
            </Badge>
            {source.dureeSecondes > 0 && <Badge tone="neutre">{Math.round(source.dureeSecondes)} s</Badge>}
            <Badge tone="neutre">{creative.structure.ugc_ou_pro.toUpperCase()}</Badge>
            {creative.produit.confiance < 0.6 && (
              <Badge tone="ambre">Produit identifié avec doute</Badge>
            )}
          </div>

          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-mist-100">
            {creative.produit.nom_fr}
          </h1>
          {/* Deux lignes suffisent ici : la synthese complete est depliable
              dans l'onglet Vue d'ensemble, section "Pour aller plus loin". */}
          <p className="mt-1.5 line-clamp-2 max-w-3xl text-sm leading-relaxed text-mist-300">
            {creative.resume_executif}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-mist-400">
            {source.auteur && <span>Compte : {source.auteur}</span>}
            {source.vues != null && <span>{source.vues.toLocaleString("fr-FR")} vues</span>}
            {source.likes != null && <span>{source.likes.toLocaleString("fr-FR")} likes</span>}
            {source.commentaires != null && (
              <span>{source.commentaires.toLocaleString("fr-FR")} commentaires</span>
            )}
            {/* Un fichier depose n'a pas d'URL d'origine : pas de lien mort. */}
            {report.url.startsWith("http") ? (
              <a
                href={report.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-400 hover:text-brand-300"
              >
                Voir le post d&apos;origine
              </a>
            ) : (
              <span>Fichier déposé</span>
            )}
          </div>

          {report.media.audio && (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <audio
                src={`/api/media/${report.id}/${report.media.audio}`}
                controls
                className="h-9 max-w-sm flex-1"
              />
              <a
                href={`/api/media/${report.id}/${report.media.audio}`}
                download={`audio-${report.id}.mp3`}
                className="rounded-md border border-ink-700 bg-ink-800 px-3 py-1.5 text-xs text-mist-300 transition hover:text-mist-100"
              >
                Télécharger l&apos;audio
              </a>
            </div>
          )}
        </div>
      </div>

      {proprietaire && report.avertissements.length > 0 && (
        <div className="mb-6 rounded-xl border border-amber-glow/25 bg-amber-glow/[0.07] px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-amber-glow">
            Limites de cette analyse
          </p>
          <ul className="mt-1.5 space-y-1">
            {report.avertissements.map((a, i) => (
              <li key={i} className="text-xs leading-relaxed text-mist-300">
                — {a}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Onglets : barre sticky sous l'en-tete, pilules colorees --------- */}
      <div className="sticky top-14 z-30 -mx-5 mb-6 border-b border-ink-800 bg-ink-950/85 px-5 py-3 backdrop-blur">
        <div className="barre-masquee flex gap-2 overflow-x-auto pb-0.5">
          {ONGLETS.map((o) => (
            <button
              key={o.id}
              onClick={() => setOnglet(o.id)}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition ${
                onglet === o.id ? o.actif : o.repos
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {/* La cle force un remontage : le contenu glisse a chaque changement d'onglet. */}
      <div key={onglet} className="anim-tab-in">
        {onglet === "apercu" && <OverviewTab report={report} />}
        {onglet === "script" && <ScriptTab report={report} />}
        {onglet === "angles" && <AnglesTab report={report} />}
        {onglet === "sourcing" && <SourcingTab report={report} />}
        {onglet === "rentabilite" && <ProfitTab report={report} />}
        {onglet === "lancement" && <LaunchTab report={report} />}
      </div>

      {proprietaire && report.cout_ia && (
        <p className="mt-10 text-center text-[11px] text-mist-400">
          Analyse produite le{" "}
          {new Date(report.createdAt).toLocaleString("fr-FR", {
            dateStyle: "long",
            timeStyle: "short",
          })}{" "}
          — {report.cout_ia.input_tokens.toLocaleString("fr-FR")} tokens en entree,{" "}
          {report.cout_ia.output_tokens.toLocaleString("fr-FR")} en sortie, cout estime{" "}
          {report.cout_ia.usd_estime.toFixed(3)} $
        </p>
      )}
    </div>
  );
}
