"use client";

import { useState } from "react";
import { Badge, Card, Repli, Section, formatSecondes } from "../ui";
import { CopyButton } from "../CopyButton";
import { useRapport } from "./contexte";
import type { Report, SequenceCle } from "@/types/analysis";

type Ton = "vert" | "ambre" | "rouge" | "bleu" | "neutre";

const ROLES: Record<SequenceCle["role"], { label: { fr: string; en: string }; tone: Ton }> = {
  hook: { label: { fr: "Hook", en: "Hook" }, tone: "vert" },
  probleme: { label: { fr: "Problème", en: "Problem" }, tone: "rouge" },
  agitation: { label: { fr: "Agitation", en: "Agitation" }, tone: "rouge" },
  solution: { label: { fr: "Solution", en: "Solution" }, tone: "vert" },
  demonstration: { label: { fr: "Démonstration", en: "Demo" }, tone: "bleu" },
  preuve_sociale: { label: { fr: "Preuve sociale", en: "Social proof" }, tone: "bleu" },
  benefice: { label: { fr: "Bénéfice", en: "Benefit" }, tone: "vert" },
  offre: { label: { fr: "Offre", en: "Offer" }, tone: "ambre" },
  cta: { label: { fr: "Appel à l'action", en: "Call to action" }, tone: "ambre" },
  autre: { label: { fr: "Autre", en: "Other" }, tone: "neutre" },
};

const TYPES_SEGMENT: Record<string, { fr: string; en: string }> = {
  voix_off: { fr: "voix off", en: "voice-over" },
  texte_ecran: { fr: "texte écran", en: "on-screen text" },
  dialogue: { fr: "dialogue", en: "dialogue" },
  son_ambiant: { fr: "son ambiant", en: "ambient sound" },
};

/** Retourne la keyframe la plus proche d'un instant donne. */
function frameLaPlusProche(frames: Report["media"]["frames"], t: number) {
  if (!frames.length) return null;
  return frames.reduce((best, f) => (Math.abs(f.t - t) < Math.abs(best.t - t) ? f : best));
}

function estArabe(texte: string): boolean {
  return /[؀-ۿ]/.test(texte);
}

export function ScriptTab({ report }: { report: Report }) {
  const { creative, media, transcript } = report;
  const { fr, langue } = useRapport();
  const [zoom, setZoom] = useState<string | null>(null);
  const sourceTexte =
    transcript.source === "aucune" ? (fr ? "lecture des textes à l'écran" : "on-screen text reading") : transcript.source;

  const script = creative.script;
  const rtl = estArabe(script.texte_complet);

  return (
    <div>
      {/* Le script, en second plan : ce qui aide a decider, ce sont les
          sequences. Le texte brut reste accessible d'un clic. */}
      <Section
        titre={fr ? "Le script" : "The script"}
        soustitre={
          fr
            ? `Langue : ${script.langue_detectee}. Source : ${sourceTexte}.`
            : `Language: ${script.langue_detectee}. Source: ${sourceTexte}.`
        }
        action={<CopyButton texte={script.texte_complet} label={fr ? "Copier le script" : "Copy the script"} />}
      >
        <div className="space-y-2">
          <Repli
            titre={fr ? "Script complet" : "Full script"}
            compteur={`${script.texte_complet.length} ${fr ? "car." : "chars"}`}
            apercu={script.texte_complet.slice(0, 90)}
          >
            <p
              dir={rtl ? "rtl" : "ltr"}
              className="whitespace-pre-wrap text-[15px] leading-relaxed text-mist-100"
            >
              {script.texte_complet}
            </p>
            {script.traduction_fr && script.traduction_fr.trim() && (
              <div className="mt-4 border-t border-ink-800 pt-4">
                <div className="mb-2 flex items-center justify-between">
                  <h4 className="text-xs font-medium uppercase tracking-wide text-mist-400">
                    {fr ? "Traduction française" : "Translation"}
                  </h4>
                  <CopyButton texte={script.traduction_fr} />
                </div>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-mist-300">
                  {script.traduction_fr}
                </p>
              </div>
            )}
          </Repli>

          {script.segments.length > 0 && (
            <Repli titre={fr ? "Script horodaté, ligne par ligne" : "Timestamped script, line by line"} compteur={script.segments.length}>
              <div className="divide-y divide-ink-800">
                {script.segments.map((s, i) => (
                  <div key={i} className="flex gap-4 py-2.5">
                    <span className="w-16 shrink-0 pt-0.5 text-xs tabular-nums text-mist-400">
                      {formatSecondes(s.start)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p
                        dir={estArabe(s.texte) ? "rtl" : "ltr"}
                        className="text-sm leading-relaxed text-mist-100"
                      >
                        {s.texte}
                      </p>
                    </div>
                    <Badge tone={s.type === "voix_off" ? "bleu" : "neutre"}>
                      {TYPES_SEGMENT[s.type]?.[langue] ?? s.type.replace("_", " ")}
                    </Badge>
                  </div>
                ))}
              </div>
            </Repli>
          )}
        </div>
      </Section>

      {/* Sequences cles : le vrai contenu utile, en pleine page ---------- */}
      <Section
        titre={fr ? "Séquences clés" : "Key sequences"}
        soustitre={
          fr
            ? "La structure de vente, plan par plan. C'est ce qu'il faut reproduire."
            : "The sales structure, shot by shot. This is what to replicate."
        }
      >
        <div className="space-y-3">
          {creative.sequences.map((seq, i) => {
            const frame = frameLaPlusProche(media.frames, (seq.start + seq.end) / 2);
            const role = ROLES[seq.role] ?? ROLES.autre;
            return (
              <Card key={i} className="overflow-hidden">
                <div className="flex flex-col gap-4 p-4 sm:flex-row">
                  {frame && (
                    <button
                      onClick={() => setZoom(`/api/media/${report.id}/${frame.file}`)}
                      className="group relative h-40 w-24 shrink-0 overflow-hidden rounded-lg bg-ink-850"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`/api/media/${report.id}/${frame.file}`}
                        alt={`${fr ? "Séquence" : "Sequence"} ${i + 1}`}
                        className="h-full w-full object-cover transition group-hover:scale-105"
                      />
                      <span className="absolute bottom-1 left-1 rounded bg-ink-950/80 px-1.5 py-0.5 text-[10px] tabular-nums text-mist-200">
                        {formatSecondes(frame.t)}
                      </span>
                    </button>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={role.tone}>{role.label[langue]}</Badge>
                      <span className="text-xs tabular-nums text-mist-400">
                        {formatSecondes(seq.start)} → {formatSecondes(seq.end)}
                      </span>
                    </div>
                    <h3 className="mt-1.5 text-sm font-semibold text-mist-100">{seq.titre}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-mist-300">{seq.description}</p>

                    {seq.texte_ecran && (
                      <p
                        dir={estArabe(seq.texte_ecran) ? "rtl" : "ltr"}
                        className="mt-2 rounded-md border-l-2 border-brand-500/50 bg-ink-850 px-3 py-2 text-sm text-mist-200"
                      >
                        {seq.texte_ecran}
                      </p>
                    )}

                    {seq.elements_visuels.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {seq.elements_visuels.map((e, j) => (
                          <Badge key={j}>{e}</Badge>
                        ))}
                      </div>
                    )}

                    <p className="mt-2.5 text-xs leading-relaxed text-brand-300">
                      <span className="font-medium">{fr ? "Pourquoi ça marche :" : "Why it works:"}</span>{" "}
                      {seq.pourquoi_ca_marche}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </Section>

      {/* Keyframes ------------------------------------------------------- */}
      <Section
        titre={fr ? "Images clés extraites" : "Extracted key frames"}
        soustitre={
          fr
            ? "Télécharge une image pour lancer une recherche par photo chez les fournisseurs chinois."
            : "Download a frame to run an image search on Chinese supplier sites."
        }
      >
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-10">
          {media.frames.map((f, i) => (
            <button
              key={i}
              onClick={() => setZoom(`/api/media/${report.id}/${f.file}`)}
              className="group relative aspect-[9/16] overflow-hidden rounded-md bg-ink-850 ring-1 ring-ink-800 transition hover:ring-brand-500/50"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/media/${report.id}/${f.file}`}
                alt={`${fr ? "Image à" : "Frame at"} ${f.t} s`}
                className="h-full w-full object-cover"
                loading="lazy"
              />
              <span className="absolute bottom-0.5 left-0.5 rounded bg-ink-950/80 px-1 text-[9px] tabular-nums text-mist-300">
                {formatSecondes(f.t)}
              </span>
              {f.coupe && (
                <span className="absolute right-0.5 top-0.5 h-1.5 w-1.5 rounded-full bg-brand-400" />
              )}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-mist-400">
          {fr ? "Le point vert signale un changement de plan détecté." : "The green dot marks a detected shot change."}
        </p>
      </Section>

      {/* Points de retention rappel ------------------------------------- */}
      {transcript.note && (
        <p className="text-xs text-mist-400">
          {fr ? "Note sur la transcription :" : "Transcription note:"} {transcript.note}
        </p>
      )}

      {/* Visionneuse ----------------------------------------------------- */}
      {zoom && (
        <div
          onClick={() => setZoom(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/90 p-6 backdrop-blur-sm"
        >
          <div className="flex flex-col items-center gap-3" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={zoom} alt="" className="max-h-[80vh] rounded-lg" />
            <div className="flex gap-2">
              <a
                href={zoom}
                download
                className="cta-aurora rounded-full px-4 py-2 text-sm font-semibold"
              >
                {fr ? "Télécharger l'image" : "Download image"}
              </a>
              <button
                onClick={() => setZoom(null)}
                className="rounded-lg bg-ink-800 px-4 py-2 text-sm text-mist-200 transition hover:bg-ink-700"
              >
                {fr ? "Fermer" : "Close"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
