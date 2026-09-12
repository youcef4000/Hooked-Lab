"use client";

import { Badge, Card, Champ, CopyButton, Jauge, Puces, TexteMultilingue, tempsCourt } from "./ui";
import type { Report, SequenceCle } from "@/types/analysis";

const ROLE_TONE: Record<SequenceCle["role"], "vert" | "ambre" | "rouge" | "bleu" | "neutre"> = {
  hook: "rouge",
  probleme: "ambre",
  agitation: "ambre",
  solution: "vert",
  demonstration: "vert",
  preuve_sociale: "bleu",
  benefice: "vert",
  offre: "ambre",
  cta: "rouge",
  autre: "neutre",
};

const ROLE_LABEL: Record<SequenceCle["role"], string> = {
  hook: "Hook",
  probleme: "Probleme",
  agitation: "Agitation",
  solution: "Solution",
  demonstration: "Demonstration",
  preuve_sociale: "Preuve sociale",
  benefice: "Benefice",
  offre: "Offre",
  cta: "Appel a l'action",
  autre: "Autre",
};

/* ------------------------------------------------------------ vue d'ensemble */

export function TabOverview({ report }: { report: Report }) {
  const { creative, dz } = report;
  const p = creative.produit;

  return (
    <div className="space-y-4">
      <Card titre="Synthese">
        <p className="text-[14px] leading-relaxed text-ink-200">{creative.resume_executif}</p>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card titre="Produit identifié" className="lg:col-span-2">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="text-lg font-semibold">{p.nom_fr}</span>
            <Badge tone="bleu">{p.categorie}</Badge>
            <Badge tone={p.confiance >= 0.7 ? "vert" : p.confiance >= 0.4 ? "ambre" : "rouge"}>
              confiance {Math.round(p.confiance * 100)}%
            </Badge>
            {p.fragile && <Badge tone="rouge">fragile en livraison</Badge>}
          </div>
          <p className="text-[13px] leading-relaxed text-ink-300">{p.description}</p>

          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            <Champ label="Nom anglais (sourcing)">{p.nom_en}</Champ>
            <Champ label="Nom arabe">
              <span dir="rtl" className="inline-block">
                {p.nom_ar}
              </span>
            </Champ>
            <Champ label="Poids estimé">{p.poids_estime_g} g</Champ>
            <Champ label="Saisonnalité">{p.saisonnalite}</Champ>
          </dl>

          {p.caracteristiques.length > 0 && (
            <div className="mt-4">
              <p className="mb-1.5 text-[11px] uppercase tracking-wide text-ink-400">Caractéristiques</p>
              <Puces items={p.caracteristiques} />
            </div>
          )}
          {p.variantes.length > 0 && (
            <div className="mt-3">
              <p className="mb-1.5 text-[11px] uppercase tracking-wide text-ink-400">Variantes</p>
              <Puces items={p.variantes} />
            </div>
          )}
        </Card>

        <Card titre="Potentiel sur le marche algérien">
          <div className="mb-4 text-center">
            <div
              className={`text-4xl font-semibold tabular-nums ${
                dz.score.global_sur_100 >= 70
                  ? "text-brand-400"
                  : dz.score.global_sur_100 >= 45
                    ? "text-accent-400"
                    : "text-red-400"
              }`}
            >
              {dz.score.global_sur_100}
              <span className="text-lg text-ink-400">/100</span>
            </div>
            <p className="mt-1 text-[13px] font-medium text-ink-200">{dz.score.verdict}</p>
          </div>
          <div className="space-y-2.5">
            <Jauge valeur={dz.score.demande} max={20} label="Demande" />
            <Jauge valeur={dz.score.concurrence} max={20} label="Concurrence favorable" />
            <Jauge valeur={dz.score.marge} max={20} label="Marge" />
            <Jauge valeur={dz.score.logistique} max={20} label="Logistique" />
            <Jauge valeur={dz.score.facilite_creative} max={20} label="Facilité créative" />
          </div>
          <p className="mt-4 text-[12px] leading-relaxed text-ink-400">{dz.score.justification}</p>
        </Card>
      </div>

      <Card titre="Le hook" sousTitre="Les 3 premieres secondes decident de tout">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="shrink-0 text-center">
            <div
              className={`text-3xl font-semibold tabular-nums ${
                creative.hook.force_sur_10 >= 7
                  ? "text-brand-400"
                  : creative.hook.force_sur_10 >= 5
                    ? "text-accent-400"
                    : "text-red-400"
              }`}
            >
              {creative.hook.force_sur_10}
              <span className="text-base text-ink-400">/10</span>
            </div>
            <p className="mt-0.5 text-[11px] text-ink-400">{creative.hook.duree_s}s · {creative.hook.type}</p>
          </div>
          <div className="min-w-0 flex-1">
            <blockquote className="border-l-2 border-brand-500/50 pl-3">
              <TexteMultilingue texte={creative.hook.texte} className="italic" />
            </blockquote>
            <p className="mt-3 text-[13px] leading-relaxed text-ink-300">{creative.hook.analyse}</p>
          </div>
        </div>

        {creative.hook.variantes_proposees.length > 0 && (
          <div className="mt-4 border-t border-ink-800 pt-4">
            <p className="mb-2 text-[11px] uppercase tracking-wide text-ink-400">
              Hooks alternatifs a tester
            </p>
            <ul className="space-y-2">
              {creative.hook.variantes_proposees.map((v, i) => (
                <li
                  key={i}
                  className="flex items-start justify-between gap-3 rounded-lg bg-ink-850 px-3 py-2"
                >
                  <TexteMultilingue texte={v} />
                  <CopyButton texte={v} />
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card titre="Ce qui marche">
          <Puces items={creative.ce_qui_marche} tone="vert" />
        </Card>
        <Card titre="Ce qui manque">
          <Puces items={creative.ce_qui_manque} tone="rouge" />
        </Card>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- creative */

export function TabCreative({ report }: { report: Report }) {
  const { creative, media, id, transcript } = report;
  const frames = media.frames;

  const frameLaPlusProche = (t: number) =>
    frames.reduce(
      (best, f) => (Math.abs(f.t - t) < Math.abs(best.t - t) ? f : best),
      frames[0] ?? { file: "", t: 0, coupe: false },
    );

  return (
    <div className="space-y-4">
      <Card
        titre="Script complet"
        sousTitre={`Langue detectee : ${creative.script.langue_detectee} · source audio : ${transcript.source}`}
      >
        <div className="mb-3 flex justify-end">
          <CopyButton texte={creative.script.texte_complet} label="Copier le script" />
        </div>
        <div className="rounded-lg bg-ink-850 p-4">
          <TexteMultilingue texte={creative.script.texte_complet} />
        </div>

        {creative.script.traduction_fr?.trim() && (
          <details className="mt-3 rounded-lg bg-ink-850/60 p-3">
            <summary className="cursor-pointer text-[12px] font-medium text-ink-300">
              Traduction française
            </summary>
            <p className="mt-2 whitespace-pre-wrap text-[13px] leading-relaxed text-ink-300">
              {creative.script.traduction_fr}
            </p>
          </details>
        )}

        {creative.script.segments.length > 0 && (
          <details className="mt-3">
            <summary className="cursor-pointer text-[12px] font-medium text-ink-300">
              Script minute par minute ({creative.script.segments.length} segments)
            </summary>
            <ul className="mt-2 divide-y divide-ink-800">
              {creative.script.segments.map((s, i) => (
                <li key={i} className="flex gap-3 py-2">
                  <span className="w-14 shrink-0 font-mono text-[11px] text-ink-500">
                    {tempsCourt(s.start)}
                  </span>
                  <span className="shrink-0">
                    <Badge tone={s.type === "voix_off" ? "vert" : s.type === "texte_ecran" ? "bleu" : "neutre"}>
                      {s.type.replace("_", " ")}
                    </Badge>
                  </span>
                  <TexteMultilingue texte={s.texte} className="min-w-0 flex-1" />
                </li>
              ))}
            </ul>
          </details>
        )}
      </Card>

      <Card titre="Séquences clés" sousTitre="Structure de vente de la creative, plan par plan">
        <ol className="space-y-3">
          {creative.sequences.map((seq, i) => {
            const frame = frameLaPlusProche(seq.start);
            return (
              <li key={i} className="flex gap-4 rounded-xl border border-ink-800 bg-ink-850/40 p-3">
                {frame.file && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`/api/media/${id}/${frame.file}`}
                    alt={`Image a ${seq.start}s`}
                    className="h-32 w-20 shrink-0 rounded-lg object-cover"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[11px] text-ink-500">
                      {tempsCourt(seq.start)} → {tempsCourt(seq.end)}
                    </span>
                    <Badge tone={ROLE_TONE[seq.role]}>{ROLE_LABEL[seq.role]}</Badge>
                    <span className="text-[13px] font-medium">{seq.titre}</span>
                  </div>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-ink-300">{seq.description}</p>
                  {seq.texte_ecran?.trim() && (
                    <div className="mt-2 rounded-md bg-ink-900 px-2.5 py-1.5">
                      <span className="text-[10px] uppercase tracking-wide text-ink-500">
                        Texte a l&apos;écran
                      </span>
                      <TexteMultilingue texte={seq.texte_ecran} />
                    </div>
                  )}
                  <p className="mt-2 text-[12px] leading-relaxed text-brand-300/90">
                    <span className="text-ink-400">Pourquoi ça marche : </span>
                    {seq.pourquoi_ca_marche}
                  </p>
                  {seq.elements_visuels.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {seq.elements_visuels.map((e, j) => (
                        <Badge key={j}>{e}</Badge>
                      ))}
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card titre="Structure et montage">
          <dl className="grid gap-3 sm:grid-cols-2">
            <Champ label="Durée">{creative.structure.duree_totale}s</Champ>
            <Champ label="Plans estimés">{creative.structure.nb_plans_estime}</Champ>
            <Champ label="Rythme de coupe">{creative.structure.rythme_coupe}</Champ>
            <Champ label="Format">{creative.structure.format}</Champ>
            <Champ label="Style de tournage">{creative.structure.style_tournage}</Champ>
            <Champ label="Niveau de production">{creative.structure.ugc_ou_pro.replace("_", " ")}</Champ>
            <Champ label="Sous-titres incrustés">
              {creative.structure.sous_titres_brules ? "oui" : "non"}
            </Champ>
          </dl>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="mb-1.5 text-[11px] uppercase tracking-wide text-ink-400">Retention</p>
              <Puces items={creative.structure.points_de_retention} tone="vert" />
            </div>
            <div>
              <p className="mb-1.5 text-[11px] uppercase tracking-wide text-ink-400">Decrochage</p>
              <Puces items={creative.structure.points_de_decrochage} tone="rouge" />
            </div>
          </div>
        </Card>

        <Card titre="Bande son">
          <dl className="grid gap-3 sm:grid-cols-2">
            <Champ label="Voix">{creative.audio.presence_voix ? creative.audio.type_voix : "aucune"}</Champ>
            <Champ label="Musique">{creative.audio.type_musique}</Champ>
            <Champ label="Ambiance">{creative.audio.ambiance}</Champ>
            <Champ label="Rythme">{creative.audio.rythme}</Champ>
          </dl>
          <p className="mt-3 text-[13px] leading-relaxed text-ink-300">{creative.audio.role_du_son}</p>
          {media.audio && (
            <div className="mt-4">
              <p className="mb-1.5 text-[11px] uppercase tracking-wide text-ink-400">Audio extrait</p>
              <audio controls src={`/api/media/${id}/${media.audio}`} className="w-full" />
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
