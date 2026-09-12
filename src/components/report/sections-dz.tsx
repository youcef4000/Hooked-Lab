"use client";

import { Badge, Card, Champ, CopyButton, Mots, Puces, TexteMultilingue } from "./ui";
import { WILAYAS_SURCOUT } from "@/lib/dz";
import type { CopyLanding, Report } from "@/types/analysis";

function BlocLanding({ copy, langue }: { copy: CopyLanding; langue: "fr" | "ar" }) {
  const rtl = langue === "ar";
  const texteComplet = [
    copy.titre,
    copy.sous_titre,
    "",
    ...copy.bullets.map((b) => `• ${b}`),
    "",
    copy.offre,
    copy.garantie,
    "",
    ...copy.faq.map((f) => `${f.question}\n${f.reponse}`),
    "",
    copy.cta,
  ].join("\n");

  return (
    <div dir={rtl ? "rtl" : "ltr"}>
      <div className="mb-3 flex justify-end" dir="ltr">
        <CopyButton texte={texteComplet} label="Copier la page" />
      </div>
      <h4 className="text-lg font-semibold leading-snug">{copy.titre}</h4>
      <p className="mt-1 text-[14px] text-ink-300">{copy.sous_titre}</p>

      <ul className="mt-3 space-y-1.5">
        {copy.bullets.map((b, i) => (
          <li key={i} className="flex gap-2 text-[13px] leading-relaxed text-ink-200">
            <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />
            <span>{b}</span>
          </li>
        ))}
      </ul>

      <div className="mt-4 rounded-lg bg-brand-500/10 p-3 ring-1 ring-brand-500/25">
        <p className="text-[13px] font-medium text-brand-300">{copy.offre}</p>
        <p className="mt-1 text-[12px] text-ink-300">{copy.garantie}</p>
      </div>

      {copy.faq.length > 0 && (
        <div className="mt-4 space-y-2">
          {copy.faq.map((f, i) => (
            <details key={i} className="rounded-lg bg-ink-850 p-3">
              <summary className="cursor-pointer text-[13px] font-medium text-ink-200">
                {f.question}
              </summary>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-300">{f.reponse}</p>
            </details>
          ))}
        </div>
      )}

      <div className="mt-4 inline-block rounded-lg bg-brand-500 px-5 py-2.5 text-[14px] font-semibold text-white">
        {copy.cta}
      </div>
    </div>
  );
}

export function TabAlgeria({ report }: { report: Report }) {
  const { dz } = report;

  return (
    <div className="space-y-4">
      <Card titre="Script en darija" sousTitre="Pret à tourner, ecrit comme on le parle en Algerie">
        <div className="mb-3 flex justify-end">
          <CopyButton texte={dz.script_darija.texte} label="Copier le script" />
        </div>
        <div className="rounded-lg bg-ink-850 p-4">
          <TexteMultilingue texte={dz.script_darija.texte} className="text-[14px]" />
        </div>
        {dz.script_darija.notes.length > 0 && (
          <div className="mt-3">
            <p className="mb-1.5 text-[11px] uppercase tracking-wide text-ink-400">Notes de tournage</p>
            <Puces items={dz.script_darija.notes} />
          </div>
        )}
      </Card>

      <Card titre="Angles publicitaires adaptés à l'Algérie">
        <div className="grid gap-3 sm:grid-cols-2">
          {dz.angles_pub_dz.map((a, i) => (
            <div key={i} className="rounded-xl border border-ink-800 bg-ink-850/40 p-3.5">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-[13px] font-semibold">{a.nom}</h4>
                <Badge tone={a.score_sur_10 >= 7 ? "vert" : a.score_sur_10 >= 5 ? "ambre" : "rouge"}>
                  {a.score_sur_10}/10
                </Badge>
              </div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-300">{a.angle}</p>
              <dl className="mt-2.5 space-y-2">
                <Champ label="Promesse">{a.promesse}</Champ>
                <Champ label="Cible">{a.public_cible}</Champ>
              </dl>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card titre="Page de vente — français">
          <BlocLanding copy={dz.copy_landing_fr} langue="fr" />
        </Card>
        <Card titre="Page de vente — arabe algérien">
          <BlocLanding copy={dz.copy_landing_ar} langue="ar" />
        </Card>
      </div>

      <Card titre="Annonces prêtes a publier">
        <div className="grid gap-3 sm:grid-cols-2">
          {dz.annonces.map((a, i) => (
            <div key={i} className="rounded-xl border border-ink-800 bg-ink-850/40 p-3.5">
              <div className="flex items-center justify-between gap-2">
                <Badge tone={a.plateforme === "tiktok" ? "rouge" : a.plateforme === "facebook" ? "bleu" : "ambre"}>
                  {a.plateforme}
                </Badge>
                <CopyButton texte={`${a.accroche}\n\n${a.texte}\n\n${a.cta}`} />
              </div>
              <TexteMultilingue texte={a.accroche} className="mt-2.5 !text-[14px] font-semibold" />
              <TexteMultilingue texte={a.texte} className="mt-1.5" />
              <p className="mt-2.5 inline-block rounded-md bg-ink-900 px-2.5 py-1 text-[12px] font-medium text-brand-300">
                {a.cta}
              </p>
              <p className="mt-2 text-[11px] text-ink-500">Angle : {a.angle_utilise}</p>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card titre="Objections clients et réponses" sousTitre="A utiliser au telephone et en commentaires">
          <ul className="space-y-2.5">
            {dz.objections.map((o, i) => (
              <li key={i} className="rounded-lg bg-ink-850 p-3">
                <TexteMultilingue texte={`« ${o.objection} »`} className="!text-ink-100 font-medium" />
                <TexteMultilingue texte={o.reponse} className="mt-1.5 !text-ink-300" />
              </li>
            ))}
          </ul>
        </Card>

        <Card titre="Ciblage publicitaire">
          <dl className="grid gap-3 sm:grid-cols-2">
            <Champ label="Age">{dz.ciblage.tranche_age}</Champ>
            <Champ label="Genre">{dz.ciblage.genre}</Champ>
            <Champ label="Budget de test / jour">
              {Math.round(dz.ciblage.budget_test_conseille_dzd).toLocaleString("fr-FR")} DA
            </Champ>
          </dl>

          <div className="mt-4">
            <p className="mb-1.5 text-[11px] uppercase tracking-wide text-ink-400">Wilayas prioritaires</p>
            <Mots mots={dz.ciblage.wilayas_prioritaires} tone="vert" />
            <p className="mt-2 text-[11px] leading-relaxed text-ink-500">
              Rappel : les wilayas du sud ({WILAYAS_SURCOUT.slice(0, 5).join(", ")}…) coutent nettement
              plus cher en livraison et retournent davantage.
            </p>
          </div>

          <div className="mt-4">
            <p className="mb-1.5 text-[11px] uppercase tracking-wide text-ink-400">Intérêts</p>
            <Mots mots={dz.ciblage.interets} tone="bleu" />
          </div>

          <div className="mt-4">
            <p className="mb-1.5 text-[11px] uppercase tracking-wide text-ink-400">Créneaux de diffusion</p>
            <Mots mots={dz.ciblage.moments_de_diffusion} tone="ambre" />
          </div>
        </Card>
      </div>

      <Card titre="Créatives à tourner toi-même">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {dz.idees_creatives.map((idee, i) => (
            <div key={i} className="rounded-xl border border-ink-800 bg-ink-850/40 p-3.5">
              <div className="flex items-start justify-between gap-2">
                <h4 className="text-[13px] font-semibold">{idee.titre}</h4>
                <Badge
                  tone={idee.difficulte === "facile" ? "vert" : idee.difficulte === "moyenne" ? "ambre" : "rouge"}
                >
                  {idee.difficulte}
                </Badge>
              </div>
              <TexteMultilingue texte={idee.hook} className="mt-2 italic" />
              <ol className="mt-2.5 space-y-1">
                {idee.deroule.map((d, j) => (
                  <li key={j} className="flex gap-2 text-[12px] leading-relaxed text-ink-300">
                    <span className="font-mono text-ink-600">{j + 1}.</span>
                    <span>{d}</span>
                  </li>
                ))}
              </ol>
              <p className="mt-2.5 text-[11px] text-ink-500">Materiel : {idee.materiel_necessaire}</p>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card titre="Concurrence en Algérie">
          <Puces items={dz.concurrence_dz} />
        </Card>
        <Card titre="Risques">
          <Puces items={dz.risques} tone="rouge" />
        </Card>
        <Card titre="Plan de lancement">
          <ol className="space-y-2">
            {dz.plan_de_lancement.map((etape, i) => (
              <li key={i} className="flex gap-2.5 text-[13px] leading-relaxed text-ink-300">
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-500/15 font-mono text-[11px] text-brand-300">
                  {i + 1}
                </span>
                <span>{etape}</span>
              </li>
            ))}
          </ol>
        </Card>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ medias */

export function TabMedia({ report }: { report: Report }) {
  const { media, id, source } = report;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        {media.video && (
          <Card titre="Vidéo source">
            <video
              controls
              src={`/api/media/${id}/${media.video}`}
              className="max-h-[70vh] w-full rounded-lg bg-black"
            />
            <a
              href={`/api/media/${id}/${media.video}`}
              download
              className="mt-3 inline-block rounded-lg border border-ink-700 px-3 py-1.5 text-[12px] text-ink-300 transition hover:text-ink-100"
            >
              Télécharger la vidéo
            </a>
          </Card>
        )}

        <Card titre="Fichiers exploitables">
          {media.audio ? (
            <div>
              <p className="mb-1.5 text-[11px] uppercase tracking-wide text-ink-400">Audio extrait</p>
              <audio controls src={`/api/media/${id}/${media.audio}`} className="w-full" />
              <a
                href={`/api/media/${id}/${media.audio}`}
                download
                className="mt-2 inline-block rounded-lg border border-ink-700 px-3 py-1.5 text-[12px] text-ink-300 transition hover:text-ink-100"
              >
                Télécharger l&apos;audio (MP3)
              </a>
            </div>
          ) : (
            <p className="text-sm text-ink-400">Aucune piste audio n&apos;a pu être extraite.</p>
          )}

          <div className="mt-5 border-t border-ink-800 pt-4">
            <p className="mb-2 text-[11px] uppercase tracking-wide text-ink-400">Post d&apos;origine</p>
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block truncate text-[13px] text-brand-300 hover:underline"
            >
              {source.url}
            </a>
            <dl className="mt-3 grid gap-2.5 sm:grid-cols-2">
              {source.auteur && <Champ label="Compte">{source.auteur}</Champ>}
              {source.datePublication && <Champ label="Publie le">{source.datePublication}</Champ>}
              {source.vues != null && <Champ label="Vues">{source.vues.toLocaleString("fr-FR")}</Champ>}
              {source.likes != null && <Champ label="Likes">{source.likes.toLocaleString("fr-FR")}</Champ>}
              {source.commentaires != null && (
                <Champ label="Commentaires">{source.commentaires.toLocaleString("fr-FR")}</Champ>
              )}
              {source.musique && <Champ label="Musique">{source.musique}</Champ>}
            </dl>
            {source.hashtags.length > 0 && (
              <div className="mt-3">
                <Mots mots={source.hashtags.map((h) => `#${h}`)} />
              </div>
            )}
          </div>
        </Card>
      </div>

      <Card
        titre={`Images clés (${media.frames.length})`}
        sousTitre="Clique pour ouvrir en grand, puis depose l'image sur Alibaba ou 1688 pour la recherche par image."
      >
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-8">
          {media.frames.map((f) => (
            <a
              key={f.file}
              href={`/api/media/${id}/${f.file}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative overflow-hidden rounded-lg bg-ink-850"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/media/${id}/${f.file}`}
                alt={`Image a ${f.t}s`}
                loading="lazy"
                className="aspect-[9/16] w-full object-cover transition group-hover:scale-105"
              />
              <span className="absolute bottom-1 left-1 rounded bg-black/70 px-1.5 py-0.5 font-mono text-[10px] text-white">
                {f.t.toFixed(1)}s
              </span>
              {f.coupe && <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-brand-400" />}
            </a>
          ))}
        </div>
      </Card>
    </div>
  );
}
