"use client";

import { Badge, Card, Chips, Repli, Section } from "../ui";
import { CopyButton } from "../CopyButton";
import type { AngleMarketing, Report } from "@/types/analysis";

/**
 * Carte d'angle. En surface : le nom, la note et la phrase d'angle — de quoi
 * choisir. Le detail (emotion, public, promesse, preuve, adaptation DZ) attend
 * dans le repli pour qui veut construire la campagne.
 */
function AngleCard({ angle }: { angle: AngleMarketing }) {
  const tone = angle.score_sur_10 >= 7 ? "vert" : angle.score_sur_10 >= 5 ? "ambre" : "rouge";
  const note = angle.score_sur_10;

  return (
    <Card className="overflow-hidden">
      <div className="flex items-start gap-4 p-5">
        {/* La note en premier : elle sert a trier les angles d'un coup d'oeil */}
        <div className="shrink-0 text-center">
          <div
            className={`text-2xl font-bold tabular-nums ${
              note >= 7 ? "text-jade" : note >= 5 ? "text-amber-glow" : "text-rose-warn"
            }`}
          >
            {note}
          </div>
          <div className="text-[10px] text-mist-400">/10</div>
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-mist-100">{angle.nom}</h3>
          <p className="mt-1 text-sm leading-relaxed text-mist-200">{angle.angle}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Badge tone={tone}>{angle.emotion_ciblee}</Badge>
            <Badge>{angle.public_cible}</Badge>
          </div>
        </div>
      </div>

      <div className="border-t border-ink-800">
        <Repli titre="Comment l'exploiter">
          <div className="space-y-3 text-sm">
            <div>
              <div className="text-xs text-mist-400">Promesse faite au client</div>
              <p className="mt-0.5 text-mist-200">{angle.promesse}</p>
            </div>
            <div>
              <div className="text-xs text-mist-400">Preuve apportee</div>
              <p className="mt-0.5 text-mist-200">{angle.preuve_utilisee}</p>
            </div>
            <div className="rounded-md border border-brand-500/25 bg-brand-500/[0.06] px-3 py-2">
              <div className="text-xs font-medium text-brand-300">Adaptation pour l&apos;Algérie</div>
              <p className="mt-0.5 text-xs leading-relaxed text-mist-200">{angle.pertinence_dz}</p>
            </div>
          </div>
        </Repli>
      </div>
    </Card>
  );
}

export function AnglesTab({ report }: { report: Report }) {
  const { creative, dz } = report;
  const mc = creative.mots_cles;

  return (
    <div>
      <Section
        titre="Angles marketing de la créative"
        soustitre="Les leviers de persuasion exploités dans la vidéo d'origine, notes sur 10."
      >
        <div className="grid gap-3 lg:grid-cols-2">
          {creative.angles_marketing.map((a, i) => (
            <AngleCard key={i} angle={a} />
          ))}
        </div>
      </Section>

      {dz.angles_pub_dz.length > 0 && (
        <Section
          titre="Angles réécrits pour le marche algérien"
          soustitre="Les mêmes leviers, adaptés au client algérien et au paiement à la livraison."
        >
          <div className="grid gap-3 lg:grid-cols-2">
            {dz.angles_pub_dz.map((a, i) => (
              <AngleCard key={i} angle={a} />
            ))}
          </div>
        </Section>
      )}

      <Section titre="Mots-clés et ciblage">
        <div className="grid gap-3 md:grid-cols-2">
          <Card className="p-5">
            <h3 className="mb-2.5 text-sm font-semibold text-mist-100">Mots-clés produit</h3>
            <Chips items={mc.produit} tone="vert" />
          </Card>
          <Card className="p-5">
            <h3 className="mb-2.5 text-sm font-semibold text-mist-100">Declencheurs émotionnels</h3>
            <Chips items={mc.emotionnels} tone="bleu" />
          </Card>
          <Card className="p-5">
            <div className="mb-2.5 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-mist-100">Hashtags</h3>
              <CopyButton texte={mc.hashtags.map((h) => (h.startsWith("#") ? h : `#${h}`)).join(" ")} />
            </div>
            <Chips items={mc.hashtags.map((h) => (h.startsWith("#") ? h : `#${h}`))} />
          </Card>
          <Card className="p-5">
            <h3 className="mb-2.5 text-sm font-semibold text-mist-100">
              Intérêts pour Facebook et TikTok Ads
            </h3>
            <Chips items={mc.ciblage_pub} tone="bleu" />
          </Card>
          <Card className="p-5">
            <h3 className="mb-2.5 text-sm font-semibold text-mist-100">Recherche en français</h3>
            <Chips items={mc.seo_fr} />
          </Card>
          <Card className="p-5">
            <h3 className="mb-2.5 text-sm font-semibold text-mist-100">Recherche en arabe</h3>
            <div dir="rtl">
              <Chips items={mc.seo_ar} />
            </div>
          </Card>
        </div>
      </Section>
    </div>
  );
}
