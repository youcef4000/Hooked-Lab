"use client";

import { Badge, Card, Liste, Section, Stat } from "../ui";
import { CopyButton } from "../CopyButton";
import { RECHERCHE_PAR_IMAGE } from "@/lib/sourcing";
import type { LienSourcing, Report } from "@/types/analysis";

const COULEURS: Record<LienSourcing["plateforme"], string> = {
  Alibaba: "text-amber-glow",
  "1688": "text-amber-glow",
  AliExpress: "text-rose-warn",
  Taobao: "text-rose-warn",
  "Made-in-China": "text-mist-200",
  "Google Images": "text-sky-300",
};

export function SourcingTab({ report }: { report: Report }) {
  const { sourcing, media, id } = report;
  const est = sourcing.estimation;

  const parPlateforme = sourcing.liens.reduce<Record<string, LienSourcing[]>>((acc, l) => {
    (acc[l.plateforme] ??= []).push(l);
    return acc;
  }, {});

  return (
    <div>
      <Section
        titre="Estimation des coûts"
        soustitre={`Fiabilité : ${est.fiabilite}. Ce sont des ordres de grandeur, à confirmer auprès des fournisseurs.`}
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat
            label="Prix d'achat unitaire"
            valeur={`${est.prix_achat_unitaire_usd_min.toFixed(2)} – ${est.prix_achat_unitaire_usd_max.toFixed(2)} $`}
          />
          <Stat label="MOQ typique" valeur={`${Math.round(est.moq_estime)} pièces`} />
          <Stat
            label="Fret unitaire vers DZ"
            valeur={`${est.frais_port_unitaire_usd_min.toFixed(2)} – ${est.frais_port_unitaire_usd_max.toFixed(2)} $`}
          />
          <Stat
            label="Prix de vente en Algérie"
            valeur={`${Math.round(est.prix_vente_dz_dzd_min).toLocaleString("fr-FR")} – ${Math.round(est.prix_vente_dz_dzd_max).toLocaleString("fr-FR")} DA`}
            tone="vert"
          />
        </div>
        <Card className="mt-3 p-5">
          <h4 className="mb-2 text-xs font-medium uppercase tracking-wide text-mist-400">
            Hypothèses retenues
          </h4>
          <Liste items={est.hypotheses} />
        </Card>
      </Section>

      <Section
        titre="Requêtes fournisseurs"
        soustitre="Les requêtes en chinois donnent des prix nettement plus bas sur 1688 et Taobao."
      >
        <div className="grid gap-3 md:grid-cols-2">
          <Card className="p-5">
            <div className="mb-2.5 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-mist-100">En anglais</h3>
              <CopyButton texte={sourcing.requetes.en.join("\n")} />
            </div>
            <div className="space-y-1.5">
              {sourcing.requetes.en.map((q, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-2 rounded-md bg-ink-850 px-3 py-1.5"
                >
                  <code className="text-sm text-mist-200">{q}</code>
                  <CopyButton texte={q} label="" />
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <div className="mb-2.5 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-mist-100">En chinois</h3>
              <CopyButton texte={[...sourcing.requetes.zh, ...sourcing.requetes.alias_zh].join("\n")} />
            </div>
            <div className="space-y-1.5">
              {[...sourcing.requetes.zh, ...sourcing.requetes.alias_zh].map((q, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-2 rounded-md bg-ink-850 px-3 py-1.5"
                >
                  <code className="text-sm text-mist-200">{q}</code>
                  <CopyButton texte={q} label="" />
                </div>
              ))}
            </div>
          </Card>
        </div>
      </Section>

      <Section
        titre="Liens de recherche directs"
        soustitre="Chaque lien ouvre la recherche correspondante sur le site du fournisseur."
      >
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {Object.entries(parPlateforme).map(([plateforme, liens]) => (
            <Card key={plateforme} className="p-4">
              <h3
                className={`mb-2.5 text-sm font-semibold ${COULEURS[plateforme as LienSourcing["plateforme"]] ?? "text-mist-100"}`}
              >
                {plateforme}
              </h3>
              <ul className="space-y-1.5">
                {liens.map((l, i) => (
                  <li key={i}>
                    <a
                      href={l.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-start gap-2 rounded-md px-2 py-1.5 text-sm text-mist-300 transition hover:bg-ink-850 hover:text-mist-100"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        className="mt-0.5 h-3.5 w-3.5 shrink-0 text-mist-400 transition group-hover:text-brand-400"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                        <path d="M15 3h6v6M10 14 21 3" />
                      </svg>
                      <span className="min-w-0 break-words">{l.label.split(" — ")[1] ?? l.label}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </Section>

      <Section
        titre="Recherche par image"
        soustitre="La méthode la plus fiable pour retrouver exactement le produit vu dans la vidéo."
      >
        <Card className="p-5">
          <div className="mb-4 flex flex-wrap gap-2">
            {media.frames.slice(0, 8).map((f, i) => (
              <a
                key={i}
                href={`/api/media/${id}/${f.file}`}
                download={`keyframe-${i}.jpg`}
                className="group relative h-24 w-16 overflow-hidden rounded-md ring-1 ring-ink-800 transition hover:ring-brand-500/60"
                title="Télécharger cette image"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/media/${id}/${f.file}`}
                  alt=""
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
                <span className="absolute inset-x-0 bottom-0 bg-ink-950/80 py-0.5 text-center text-[9px] text-mist-200 opacity-0 transition group-hover:opacity-100">
                  télécharger
                </span>
              </a>
            ))}
          </div>
          <ol className="space-y-2.5">
            {RECHERCHE_PAR_IMAGE.map((r) => (
              <li key={r.plateforme} className="flex gap-3 text-sm">
                <Badge>{r.plateforme}</Badge>
                <div className="min-w-0 flex-1">
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-400 hover:text-brand-300"
                  >
                    {r.url}
                  </a>
                  <p className="mt-0.5 text-xs leading-relaxed text-mist-400">{r.aide}</p>
                </div>
              </li>
            ))}
          </ol>
        </Card>
      </Section>

      <div className="grid gap-3 md:grid-cols-2">
        <Card className="p-5">
          <h3 className="mb-3 text-sm font-semibold text-brand-300">Negocier avec le fournisseur</h3>
          <Liste items={sourcing.conseils_negociation} tone="vert" />
        </Card>
        <Card className="p-5">
          <h3 className="mb-3 text-sm font-semibold text-amber-glow">Risques a l&apos;import</h3>
          <Liste items={sourcing.risques_import} tone="rouge" />
        </Card>
      </div>
    </div>
  );
}
