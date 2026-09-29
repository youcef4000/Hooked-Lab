"use client";

import { Badge, Card, Chips, Repli, Section } from "../ui";
import { CopyButton } from "../CopyButton";
import { useRapport } from "./contexte";
import type { AngleMarketing, Report } from "@/types/analysis";

/**
 * Carte d'angle. En surface : le nom, la note et la phrase d'angle — de quoi
 * choisir. Le detail (emotion, public, promesse, preuve, adaptation au marche)
 * attend dans le repli pour qui veut construire la campagne.
 */
function AngleCard({ angle }: { angle: AngleMarketing }) {
  const { fr, pays } = useRapport();
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
        <Repli titre={fr ? "Comment l'exploiter" : "How to use it"}>
          <div className="space-y-3 text-sm">
            <div>
              <div className="text-xs text-mist-400">{fr ? "Promesse faite au client" : "Promise to the customer"}</div>
              <p className="mt-0.5 text-mist-200">{angle.promesse}</p>
            </div>
            <div>
              <div className="text-xs text-mist-400">{fr ? "Preuve apportée" : "Proof shown"}</div>
              <p className="mt-0.5 text-mist-200">{angle.preuve_utilisee}</p>
            </div>
            <div className="rounded-md border border-brand-500/25 bg-brand-500/[0.06] px-3 py-2">
              <div className="text-xs font-medium text-brand-300">
                {fr ? `Adaptation : ${pays}` : `Adapting for: ${pays}`}
              </div>
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
  const { fr, cod, pays, marche } = useRapport();
  const mc = creative.mots_cles;
  const algerie = marche.id === "dz";
  const hashtags = mc.hashtags.map((h) => (h.startsWith("#") ? h : `#${h}`));

  return (
    <div>
      <Section
        titre={fr ? "Angles marketing de la créative" : "Marketing angles in the creative"}
        soustitre={
          fr
            ? "Les leviers de persuasion exploités dans la vidéo d'origine, notés sur 10."
            : "The persuasion levers used in the original video, scored out of 10."
        }
      >
        <div className="grid gap-3 lg:grid-cols-2">
          {creative.angles_marketing.map((a, i) => (
            <AngleCard key={i} angle={a} />
          ))}
        </div>
      </Section>

      {dz.angles_pub_dz.length > 0 && (
        <Section
          titre={fr ? `Angles réécrits pour ce marché : ${pays}` : `Angles rewritten for ${pays}`}
          soustitre={
            fr
              ? cod
                ? "Les mêmes leviers, adaptés au client local et au paiement à la livraison."
                : "Les mêmes leviers, adaptés aux habitudes d'achat et au paiement en ligne de ce marché."
              : cod
                ? "The same levers, adapted to local buyers and cash on delivery."
                : "The same levers, adapted to this market's buying habits and online payment."
          }
        >
          <div className="grid gap-3 lg:grid-cols-2">
            {dz.angles_pub_dz.map((a, i) => (
              <AngleCard key={i} angle={a} />
            ))}
          </div>
        </Section>
      )}

      <Section titre={fr ? "Mots-clés et ciblage" : "Keywords & targeting"}>
        <div className="grid gap-3 md:grid-cols-2">
          <Card className="p-5">
            <h3 className="mb-2.5 text-sm font-semibold text-mist-100">{fr ? "Mots-clés produit" : "Product keywords"}</h3>
            <Chips items={mc.produit} tone="vert" />
          </Card>
          <Card className="p-5">
            <h3 className="mb-2.5 text-sm font-semibold text-mist-100">
              {fr ? "Déclencheurs émotionnels" : "Emotional triggers"}
            </h3>
            <Chips items={mc.emotionnels} tone="bleu" />
          </Card>
          <Card className="p-5">
            <div className="mb-2.5 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-mist-100">Hashtags</h3>
              <CopyButton texte={hashtags.join(" ")} />
            </div>
            <Chips items={hashtags} />
          </Card>
          <Card className="p-5">
            <h3 className="mb-2.5 text-sm font-semibold text-mist-100">
              {fr ? "Intérêts pour Facebook et TikTok Ads" : "Interests for Facebook & TikTok Ads"}
            </h3>
            <Chips items={mc.ciblage_pub} tone="bleu" />
          </Card>
          <Card className="p-5">
            <h3 className="mb-2.5 text-sm font-semibold text-mist-100">
              {algerie
                ? fr
                  ? "Recherche en français"
                  : "Searches in French"
                : fr
                  ? "Recherches des acheteurs"
                  : "Shopper searches"}
            </h3>
            <Chips items={mc.seo_fr} />
          </Card>
          <Card className="p-5">
            <h3 className="mb-2.5 text-sm font-semibold text-mist-100">
              {algerie
                ? fr
                  ? "Recherche en arabe"
                  : "Searches in Arabic"
                : fr
                  ? "Recherches longue traîne"
                  : "Long-tail searches"}
            </h3>
            <div dir={algerie ? "rtl" : "ltr"}>
              <Chips items={mc.seo_ar} />
            </div>
          </Card>
        </div>
      </Section>
    </div>
  );
}
