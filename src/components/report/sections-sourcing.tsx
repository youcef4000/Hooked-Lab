"use client";

import { Badge, Card, Champ, CopyButton, Jauge, Mots, Puces } from "./ui";
import { RECHERCHE_PAR_IMAGE } from "@/lib/sourcing";
import { formatUSD } from "@/lib/dz";
import type { Report } from "@/types/analysis";

/* ------------------------------------------------------- angles & mots-cles */

export function TabAngles({ report }: { report: Report }) {
  const { creative } = report;

  return (
    <div className="space-y-4">
      <Card
        titre="Angles marketing exploités"
        sousTitre="Classes par potentiel, avec l'adaptation necessaire pour l'Algerie"
      >
        <ol className="space-y-3">
          {creative.angles_marketing.map((a, i) => (
            <li key={i} className="rounded-xl border border-ink-800 bg-ink-850/40 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h4 className="text-[14px] font-semibold">{a.nom}</h4>
                  <p className="mt-1 text-[13px] leading-relaxed text-ink-300">{a.angle}</p>
                </div>
                <div className="w-20 shrink-0">
                  <Jauge valeur={a.score_sur_10} max={10} label="Score" />
                </div>
              </div>
              <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                <Champ label="Émotion visee">{a.emotion_ciblee}</Champ>
                <Champ label="Public cible">{a.public_cible}</Champ>
                <Champ label="Promesse">{a.promesse}</Champ>
                <Champ label="Preuve utilisée">{a.preuve_utilisee}</Champ>
              </dl>
              <p className="mt-3 rounded-lg bg-ink-900 px-3 py-2 text-[12px] leading-relaxed text-accent-400/90">
                <span className="text-ink-400">Adaptation Algérie : </span>
                {a.pertinence_dz}
              </p>
            </li>
          ))}
        </ol>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card titre="Mots-clés produit">
          <Mots mots={creative.mots_cles.produit} tone="bleu" />
        </Card>
        <Card titre="Declencheurs émotionnels">
          <Mots mots={creative.mots_cles.emotionnels} tone="ambre" />
        </Card>
        <Card titre="Hashtags">
          <div className="mb-2 flex justify-end">
            <CopyButton texte={creative.mots_cles.hashtags.map((h) => `#${h.replace(/^#/, "")}`).join(" ")} />
          </div>
          <Mots mots={creative.mots_cles.hashtags.map((h) => `#${h.replace(/^#/, "")}`)} tone="vert" />
        </Card>
        <Card titre="Intérêts pour le ciblage publicitaire">
          <Mots mots={creative.mots_cles.ciblage_pub} tone="vert" />
        </Card>
        <Card titre="Recherche en français">
          <Mots mots={creative.mots_cles.seo_fr} />
        </Card>
        <Card titre="Recherche en arabe / darija">
          <div dir="rtl">
            <Mots mots={creative.mots_cles.seo_ar} />
          </div>
        </Card>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------- sourcing */

export function TabSourcing({ report }: { report: Report }) {
  const { sourcing } = report;
  const e = sourcing.estimation;

  const fiabiliteTone = e.fiabilite === "bonne" ? "vert" : e.fiabilite === "moyenne" ? "ambre" : "rouge";

  return (
    <div className="space-y-4">
      <Card
        titre="Liens fournisseurs"
        sousTitre="Recherches pretes a ouvrir. Les liens 1688 et Taobao sont en chinois : ce sont les prix les plus bas."
      >
        <div className="grid gap-2 sm:grid-cols-2">
          {sourcing.liens.map((l) => (
            <a
              key={l.url}
              href={l.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-between gap-3 rounded-lg border border-ink-800 bg-ink-850/50 px-3 py-2.5 transition hover:border-brand-500/40 hover:bg-ink-800"
            >
              <span className="min-w-0">
                <span className="flex items-center gap-2">
                  <Badge tone={l.langue === "zh" ? "ambre" : "bleu"}>{l.plateforme}</Badge>
                </span>
                <span className="mt-1 block truncate text-[13px] text-ink-300 group-hover:text-ink-100">
                  {l.label}
                </span>
              </span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="shrink-0 text-ink-500">
                <path
                  d="M7 17 17 7M17 7H8m9 0v9"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
          ))}
        </div>

        <div className="mt-4 border-t border-ink-800 pt-4">
          <p className="mb-2 text-[11px] uppercase tracking-wide text-ink-400">
            Recherche par image — la methode la plus fiable
          </p>
          <p className="mb-2.5 text-[12px] leading-relaxed text-ink-400">
            Télécharge une keyframe depuis l&apos;onglet Medias, puis dépose-la sur l&apos;une de ces
            pages pour retrouver le produit exact.
          </p>
          <div className="flex flex-wrap gap-2">
            {RECHERCHE_PAR_IMAGE.map((r) => (
              <a
                key={r.plateforme}
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                title={r.aide}
                className="rounded-lg border border-ink-700 px-3 py-1.5 text-[12px] text-ink-300 transition hover:border-brand-500/40 hover:text-ink-100"
              >
                {r.plateforme} ↗
              </a>
            ))}
          </div>
        </div>
      </Card>

      <Card titre="Requêtes de recherche">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[11px] uppercase tracking-wide text-ink-400">Anglais (Alibaba)</p>
              <CopyButton texte={sourcing.requetes.en.join("\n")} />
            </div>
            <Mots mots={sourcing.requetes.en} tone="bleu" />
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[11px] uppercase tracking-wide text-ink-400">Chinois (1688, Taobao)</p>
              <CopyButton texte={[...sourcing.requetes.zh, ...sourcing.requetes.alias_zh].join("\n")} />
            </div>
            <Mots mots={sourcing.requetes.zh} tone="ambre" />
            {sourcing.requetes.alias_zh.length > 0 && (
              <div className="mt-2">
                <p className="mb-1 text-[11px] text-ink-500">Appellations alternatives</p>
                <Mots mots={sourcing.requetes.alias_zh} />
              </div>
            )}
          </div>
        </div>
      </Card>

      <Card titre="Estimation de prix" sousTitre="Ordres de grandeur produits par l'IA, a confirmer avec les fournisseurs">
        <div className="mb-4 flex items-center gap-2">
          <Badge tone={fiabiliteTone}>fiabilite {e.fiabilite}</Badge>
          <Badge>MOQ estime : {e.moq_estime} pièces</Badge>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg bg-ink-850 p-3.5">
            <p className="text-[11px] uppercase tracking-wide text-ink-400">Achat unitaire</p>
            <p className="mt-1 text-lg font-semibold tabular-nums">
              {formatUSD(e.prix_achat_unitaire_usd_min)} – {formatUSD(e.prix_achat_unitaire_usd_max)}
            </p>
            <p className="mt-0.5 text-[11px] text-ink-500">depart Chine</p>
          </div>
          <div className="rounded-lg bg-ink-850 p-3.5">
            <p className="text-[11px] uppercase tracking-wide text-ink-400">Fret unitaire</p>
            <p className="mt-1 text-lg font-semibold tabular-nums">
              {formatUSD(e.frais_port_unitaire_usd_min)} – {formatUSD(e.frais_port_unitaire_usd_max)}
            </p>
            <p className="mt-0.5 text-[11px] text-ink-500">vers l&apos;Algérie</p>
          </div>
          <div className="rounded-lg bg-brand-500/10 p-3.5 ring-1 ring-brand-500/25">
            <p className="text-[11px] uppercase tracking-wide text-brand-300/80">Prix de vente marche</p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-brand-300">
              {Math.round(e.prix_vente_dz_dzd_min).toLocaleString("fr-FR")} –{" "}
              {Math.round(e.prix_vente_dz_dzd_max).toLocaleString("fr-FR")} DA
            </p>
            <p className="mt-0.5 text-[11px] text-brand-300/60">pratique en Algérie</p>
          </div>
        </div>

        <div className="mt-4">
          <p className="mb-1.5 text-[11px] uppercase tracking-wide text-ink-400">Hypothèses retenues</p>
          <Puces items={e.hypotheses} />
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card titre="Negocier avec le fournisseur">
          <Puces items={sourcing.conseils_negociation} tone="vert" />
        </Card>
        <Card titre="Risques a l'import">
          <Puces items={sourcing.risques_import} tone="rouge" />
        </Card>
      </div>
    </div>
  );
}
