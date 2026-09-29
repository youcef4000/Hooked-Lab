"use client";

import { useState } from "react";
import { Badge } from "../ui";
import { OverviewTab } from "./OverviewTab";
import { ScriptTab } from "./ScriptTab";
import { AnglesTab } from "./AnglesTab";
import { SourcingTab } from "./SourcingTab";
import { ProfitTab } from "./ProfitTab";
import { LaunchTab } from "./LaunchTab";
import { PartageResume } from "./PartageResume";
import { RapportProvider, niveauProduction, nomPlateforme } from "./contexte";
import { useLangue } from "../Langue";
import { locale } from "@/lib/langue";
import { marche as trouverMarche } from "@/lib/marches";
import type { Report } from "@/types/analysis";

/**
 * Chaque onglet porte sa couleur : actif = pilule pleine, inactif = teinte
 * douce de la meme couleur. La barre reste collee sous l'en-tete au scroll.
 */
const ONGLETS = [
  {
    id: "apercu",
    label: { fr: "Vue d'ensemble", en: "Overview" },
    actif: "bg-[#d4af37] text-[#120e04] shadow-lg shadow-[#d4af37]/25",
    repos: "bg-[#d4af37]/12 text-[#f2dfa0] ring-1 ring-inset ring-[#d4af37]/30 hover:bg-[#d4af37]/22",
  },
  {
    id: "script",
    label: { fr: "Script et séquences", en: "Script & sequences" },
    actif: "bg-[#c9a227] text-[#120e04] shadow-lg shadow-[#c9a227]/25",
    repos: "bg-[#c9a227]/12 text-[#e0be55] ring-1 ring-inset ring-[#c9a227]/30 hover:bg-[#c9a227]/22",
  },
  {
    id: "angles",
    label: { fr: "Angles et mots-clés", en: "Angles & keywords" },
    actif: "bg-[#b87333] text-[#120e04] shadow-lg shadow-[#b87333]/25",
    repos: "bg-[#b87333]/12 text-[#d99457] ring-1 ring-inset ring-[#b87333]/30 hover:bg-[#b87333]/22",
  },
  {
    id: "sourcing",
    label: { fr: "Sourcing", en: "Sourcing" },
    actif: "bg-[#e08c3a] text-[#120e04] shadow-lg shadow-[#e08c3a]/25",
    repos: "bg-[#e08c3a]/12 text-[#eda86a] ring-1 ring-inset ring-[#e08c3a]/30 hover:bg-[#e08c3a]/22",
  },
  {
    id: "rentabilite",
    label: { fr: "Rentabilité", en: "Profitability" },
    actif: "bg-[#3f7d6b] text-white shadow-lg shadow-[#3f7d6b]/25",
    repos: "bg-[#3f7d6b]/12 text-[#6fb5a1] ring-1 ring-inset ring-[#3f7d6b]/30 hover:bg-[#3f7d6b]/22",
  },
  {
    id: "lancement",
    label: { fr: "Pack de lancement", en: "Launch pack" },
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
  const langue = useLangue();
  const fr = langue === "fr";
  const loc = locale(langue);
  const m = trouverMarche(report.marche);

  return (
    <RapportProvider marcheId={report.marche}>
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
            <Badge tone="bleu">{nomPlateforme(source.platform, fr)}</Badge>
            <Badge tone="neutre">
              {m.drapeau} {m.nom[langue]}
            </Badge>
            <Badge tone={scoreTone(dz.score.global_sur_100)}>
              {fr ? "Potentiel" : "Potential"} {dz.score.global_sur_100}/100
            </Badge>
            {source.dureeSecondes > 0 && <Badge tone="neutre">{Math.round(source.dureeSecondes)} s</Badge>}
            <Badge tone="neutre">{niveauProduction(creative.structure.ugc_ou_pro, fr)}</Badge>
            {creative.produit.confiance < 0.6 && (
              <Badge tone="ambre">{fr ? "Produit identifié avec doute" : "Product identified with doubt"}</Badge>
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
            {source.auteur && <span>{fr ? "Compte :" : "Account:"} {source.auteur}</span>}
            {source.vues != null && <span>{source.vues.toLocaleString(loc)} {fr ? "vues" : "views"}</span>}
            {source.likes != null && <span>{source.likes.toLocaleString(loc)} likes</span>}
            {source.commentaires != null && (
              <span>{source.commentaires.toLocaleString(loc)} {fr ? "commentaires" : "comments"}</span>
            )}
            {/* Un fichier depose n'a pas d'URL d'origine : pas de lien mort, et le
                badge "Video deposee" le dit deja. */}
            {report.url.startsWith("http") && (
              <a
                href={report.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-400 hover:text-brand-300"
              >
                {fr ? "Voir le post d'origine" : "See the original post"}
              </a>
            )}
          </div>

          <PartageResume report={report} />

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
                {fr ? "Télécharger l'audio" : "Download audio"}
              </a>
            </div>
          )}
        </div>
      </div>

      {proprietaire && report.avertissements.length > 0 && (
        <div className="mb-6 rounded-xl border border-amber-glow/25 bg-amber-glow/[0.07] px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-amber-glow">
            {fr ? "Limites de cette analyse" : "Limits of this analysis"}
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
      <div className="sticky top-14 z-30 -mx-4 mb-6 border-b border-ink-800 bg-ink-950/85 px-4 py-3 backdrop-blur sm:-mx-5 sm:px-5">
        <div className="barre-masquee flex gap-2 overflow-x-auto pb-0.5">
          {ONGLETS.map((o) => (
            <button
              key={o.id}
              onClick={() => setOnglet(o.id)}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition ${
                onglet === o.id ? o.actif : o.repos
              }`}
            >
              {o.label[langue]}
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
          {fr ? "Analyse produite le" : "Analysis produced on"}{" "}
          {new Date(report.createdAt).toLocaleString(loc, {
            dateStyle: "long",
            timeStyle: "short",
          })}{" "}
          — {report.cout_ia.input_tokens.toLocaleString(loc)} {fr ? "tokens en entrée" : "input tokens"},{" "}
          {report.cout_ia.output_tokens.toLocaleString(loc)} {fr ? "en sortie, coût estimé" : "output, estimated cost"}{" "}
          ${report.cout_ia.usd_estime.toFixed(3)}
        </p>
      )}
    </div>
    </RapportProvider>
  );
}
