"use client";

import { useState } from "react";
import { Badge, Card, Chips, ChiffreCle, Liste, Repli, Section } from "../ui";
import { CopyButton } from "../CopyButton";
import { MetaAdsSection } from "./MetaAdsSection";
import { BanqueVideos } from "./BanqueVideos";
import { nomPlateforme, useRapport } from "./contexte";
import type { CopyLanding, Report } from "@/types/analysis";

/* ============================================================================
   Pack de lancement.

   Ce bloc contenait tout d'un seul tenant : de quoi noyer un debutant. Il est
   maintenant reparti en quatre volets qui suivent l'ordre reel du travail —
   on lance des publicites, puis on ecrit la page, puis on organise, puis on
   verifie le marche. Chaque volet tient dans un ecran.
   ========================================================================== */

const VOLETS = [
  {
    id: "publicite",
    label: { fr: "Publicité", en: "Ads" },
    aide: { fr: "Ce que tu lances aujourd'hui", en: "What you launch today" },
  },
  {
    id: "textes",
    label: { fr: "Textes de vente", en: "Sales copy" },
    aide: { fr: "Page produit et script", en: "Product page and script" },
  },
  {
    id: "execution",
    label: { fr: "Exécution", en: "Execution" },
    aide: { fr: "Plan, ciblage et tournage", en: "Plan, targeting and shooting" },
  },
  {
    id: "marche",
    label: { fr: "Marché", en: "Market" },
    aide: { fr: "Objections et risques", en: "Objections and risks" },
  },
] as const;

const DIFFICULTES: Record<string, { fr: string; en: string }> = {
  facile: { fr: "facile", en: "easy" },
  moyenne: { fr: "moyenne", en: "medium" },
  difficile: { fr: "difficile", en: "hard" },
};

type VoletId = (typeof VOLETS)[number]["id"];

function LandingBloc({ copy, rtl, etiquette }: { copy: CopyLanding; rtl: boolean; etiquette: string }) {
  const { fr } = useRapport();
  const texteComplet = [
    copy.titre,
    copy.sous_titre,
    "",
    ...copy.bullets.map((b) => `• ${b}`),
    "",
    copy.offre,
    copy.garantie,
    "",
    ...copy.faq.flatMap((f) => [f.question, f.reponse, ""]),
    copy.cta,
  ].join("\n");

  return (
    <Card className="p-5">
      <div className="mb-3 flex items-center justify-between">
        <Badge tone={rtl ? "ambre" : "bleu"}>{etiquette}</Badge>
        <CopyButton texte={texteComplet} label={fr ? "Copier toute la page" : "Copy the whole page"} />
      </div>
      <div dir={rtl ? "rtl" : "ltr"} className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold leading-snug text-mist-100">{copy.titre}</h3>
          <p className="mt-1 text-sm text-mist-300">{copy.sous_titre}</p>
        </div>
        <ul className="space-y-1.5">
          {copy.bullets.map((b, i) => (
            <li key={i} className="flex gap-2 text-sm text-mist-200">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />
              <span>{b}</span>
            </li>
          ))}
        </ul>
        <div className="rounded-lg border border-brand-500/25 bg-brand-500/[0.07] px-4 py-3">
          <p className="text-sm font-medium text-brand-300">{copy.offre}</p>
          <p className="mt-1 text-xs text-mist-300">{copy.garantie}</p>
        </div>
        <Repli titre={fr ? "Questions fréquentes de la page" : "Page FAQ"} compteur={copy.faq.length}>
          <div className="space-y-2.5">
            {copy.faq.map((f, i) => (
              <div key={i}>
                <p className="text-sm font-medium text-mist-100">{f.question}</p>
                <p className="mt-0.5 text-sm text-mist-300">{f.reponse}</p>
              </div>
            ))}
          </div>
        </Repli>
        <div className="cta-aurora rounded-full px-4 py-2.5 text-center text-sm font-semibold">
          {copy.cta}
        </div>
      </div>
    </Card>
  );
}

export function LaunchTab({ report }: { report: Report }) {
  const { dz } = report;
  const { fr, fmt, langue, marche, cod, pays } = useRapport();
  const algerie = marche.id === "dz";
  const [volet, setVolet] = useState<VoletId>("publicite");
  const [langueLanding, setLangueLanding] = useState<"fr" | "ar">("fr");
  const guillemets = (x: string) => (fr ? `« ${x} »` : `“${x}”`);

  // Algerie : francais + darija. Ailleurs : deux variantes a tester en A/B.
  const etiquetteA = algerie ? "Français" : fr ? "Variante A" : "Variant A";
  const etiquetteB = algerie ? "العربية" : marche.secondeVersion[langue];
  const scriptRtl = /[\u0600-\u06FF]/.test(dz.script_darija.texte);

  return (
    <div>
      {/* Sous-navigation ------------------------------------------------ */}
      <div className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {VOLETS.map((v) => (
          <button
            key={v.id}
            onClick={() => setVolet(v.id)}
            className={`rounded-lg border px-3 py-2.5 text-left transition ${
              volet === v.id
                ? "border-brand-500/50 bg-brand-500/[0.08]"
                : "border-ink-700 bg-ink-900 hover:border-ink-600"
            }`}
          >
            <div
              className={`text-sm font-medium ${
                volet === v.id ? "text-brand-300" : "text-mist-100"
              }`}
            >
              {v.label[langue]}
            </div>
            <div className="mt-0.5 text-[11px] leading-snug text-mist-400">{v.aide[langue]}</div>
          </button>
        ))}
      </div>

      <div key={volet} className="anim-tab-in">
        {/* ================================================== PUBLICITÉ */}
        {volet === "publicite" && (
          <div>
            <MetaAdsSection ads={dz.meta_ads ?? []} />

            <Section
              titre={fr ? "Autres accroches" : "More ad copy"}
              soustitre={
                fr
                  ? "Variantes courtes pour TikTok et Instagram, à adapter au format de chaque plateforme."
                  : "Short variants for TikTok and Instagram, to adapt to each platform's format."
              }
            >
              <div className="grid gap-3 md:grid-cols-2">
                {dz.annonces.map((a, i) => (
                  <Card key={i} className="p-5">
                    <div className="mb-3 flex items-center justify-between">
                      <Badge tone={a.plateforme === "tiktok" ? "neutre" : "bleu"}>
                        {nomPlateforme(a.plateforme, fr)}
                      </Badge>
                      <CopyButton texte={`${a.accroche}\n\n${a.texte}\n\n${a.cta}`} />
                    </div>
                    <p className="text-sm font-semibold text-mist-100">{a.accroche}</p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-mist-200">
                      {a.texte}
                    </p>
                    <p className="mt-3 inline-block rounded-md bg-brand-500/15 px-3 py-1 text-xs font-medium text-brand-300">
                      {a.cta}
                    </p>
                    <p className="mt-2 text-[11px] text-mist-400">Angle{fr ? " :" : ":"} {a.angle_utilise}</p>
                  </Card>
                ))}
              </div>
            </Section>
          </div>
        )}

        {/* ==================================================== TEXTES */}
        {volet === "textes" && (
          <div>
            <Section
              titre={fr ? "Page de vente" : "Sales page"}
              soustitre={
                algerie
                  ? fr
                    ? "Prête à coller dans ton constructeur de page produit."
                    : "Ready to paste into your product page builder."
                  : fr
                    ? "Deux versions prêtes à coller, à tester l'une contre l'autre."
                    : "Two ready-to-paste versions, to test against each other."
              }
              action={
                <div className="flex gap-1 rounded-lg border border-ink-700 bg-ink-850 p-0.5">
                  <button
                    onClick={() => setLangueLanding("fr")}
                    className={`rounded-md px-3 py-1 text-xs transition ${
                      langueLanding === "fr" ? "bg-ink-700 text-mist-100" : "text-mist-400"
                    }`}
                  >
                    {etiquetteA}
                  </button>
                  <button
                    onClick={() => setLangueLanding("ar")}
                    className={`rounded-md px-3 py-1 text-xs transition ${
                      langueLanding === "ar" ? "bg-ink-700 text-mist-100" : "text-mist-400"
                    }`}
                  >
                    {etiquetteB}
                  </button>
                </div>
              }
            >
              {langueLanding === "fr" ? (
                <LandingBloc copy={dz.copy_landing_fr} rtl={false} etiquette={etiquetteA} />
              ) : (
                <LandingBloc
                  copy={dz.copy_landing_ar}
                  rtl={/[\u0600-\u06FF]/.test(dz.copy_landing_ar.titre)}
                  etiquette={etiquetteB}
                />
              )}
            </Section>

            <Section
              titre={
                algerie
                  ? fr
                    ? "Script vidéo en darija"
                    : "Video script in darija"
                  : fr
                    ? `Script vidéo : ${pays}`
                    : `Video script for ${pays}`
              }
              soustitre={fr ? "Prêt à tourner avec un téléphone." : "Ready to shoot with a phone."}
              action={<CopyButton texte={dz.script_darija.texte} label={fr ? "Copier le script" : "Copy the script"} />}
            >
              <Card className="p-5">
                <p
                  dir={scriptRtl ? "rtl" : "ltr"}
                  className={`whitespace-pre-wrap text-[15px] text-mist-100 ${scriptRtl ? "leading-loose" : "leading-relaxed"}`}
                >
                  {dz.script_darija.texte}
                </p>
                {dz.script_darija.notes.length > 0 && (
                  <div className="mt-4 border-t border-ink-800 pt-4">
                    <Repli titre={fr ? "Notes de tournage" : "Shooting notes"} compteur={dz.script_darija.notes.length}>
                      <Liste items={dz.script_darija.notes} />
                    </Repli>
                  </div>
                )}
              </Card>
            </Section>
          </div>
        )}

        {/* ================================================== EXÉCUTION */}
        {volet === "execution" && (
          <div>
            <Section
              titre={fr ? "Ciblage publicitaire" : "Ad targeting"}
              soustitre={fr ? "Où et à qui diffuser en priorité." : "Where and to whom to run ads first."}
            >
              <div className="grid gap-3 lg:grid-cols-3">
                <div className="grid gap-3 sm:grid-cols-3 lg:col-span-1 lg:grid-cols-1">
                  <ChiffreCle label={fr ? "Tranche d'âge" : "Age range"} valeur={dz.ciblage.tranche_age} />
                  <ChiffreCle label={fr ? "Genre" : "Gender"} valeur={dz.ciblage.genre} />
                  <ChiffreCle
                    label={fr ? "Budget de test / jour" : "Test budget / day"}
                    valeur={fmt(dz.ciblage.budget_test_conseille_dzd)}
                    tone="or"
                  />
                </div>
                <Card className="p-5 lg:col-span-2">
                  <h3 className="mb-2.5 text-sm font-semibold text-mist-100">
                    {marche.regions[langue]}
                  </h3>
                  <Chips items={dz.ciblage.wilayas_prioritaires} tone="vert" />
                  <h3 className="mb-2.5 mt-5 text-sm font-semibold text-mist-100">
                    {fr ? "Intérêts à cibler" : "Interests to target"}
                  </h3>
                  <Chips items={dz.ciblage.interets} tone="bleu" />
                  <h3 className="mb-2.5 mt-5 text-sm font-semibold text-mist-100">
                    {fr ? "Créneaux de diffusion" : "Best times to run"}
                  </h3>
                  <Chips items={dz.ciblage.moments_de_diffusion} />
                </Card>
              </div>
            </Section>

            <BanqueVideos pistes={dz.banque_videos ?? []} />

            <Section
              titre={fr ? "Créatives à tourner" : "Creatives to shoot"}
              soustitre={
                fr
                  ? "Des variantes à tester en plus de la créative analysée."
                  : "Variants to test alongside the analysed creative."
              }
            >
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {dz.idees_creatives.map((idee, i) => (
                  <Card key={i} className="flex flex-col overflow-hidden">
                    <div className="flex-1 p-4">
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <h3 className="text-sm font-semibold text-mist-100">{idee.titre}</h3>
                        <Badge
                          tone={
                            idee.difficulte === "facile"
                              ? "vert"
                              : idee.difficulte === "moyenne"
                                ? "ambre"
                                : "rouge"
                          }
                        >
                          {DIFFICULTES[idee.difficulte]?.[langue] ?? idee.difficulte}
                        </Badge>
                      </div>
                      <p className="rounded-md bg-ink-850 px-3 py-2 text-sm italic text-mist-200">
                        {guillemets(idee.hook)}
                      </p>
                    </div>
                    <div className="border-t border-ink-800">
                      <Repli
                        titre={fr ? "Déroulé du tournage" : "Shot list"}
                        compteur={`${idee.deroule.length} ${fr ? "plans" : "shots"}`}
                      >
                        <ol className="space-y-1.5">
                          {idee.deroule.map((d, j) => (
                            <li key={j} className="flex gap-2 text-xs leading-relaxed text-mist-300">
                              <span className="shrink-0 tabular-nums text-mist-400">{j + 1}.</span>
                              <span>{d}</span>
                            </li>
                          ))}
                        </ol>
                        <p className="mt-3 border-t border-ink-800 pt-2 text-[11px] text-mist-400">
                          {fr ? "Matériel :" : "Gear:"} {idee.materiel_necessaire}
                        </p>
                      </Repli>
                    </div>
                  </Card>
                ))}
              </div>
            </Section>

            <Section
              titre={fr ? "Plan de lancement" : "Launch plan"}
              soustitre={fr ? "De la commande fournisseur au scaling." : "From supplier order to scaling."}
            >
              <Card className="p-5">
                <ol className="space-y-3">
                  {dz.plan_de_lancement.map((etape, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-500/15 text-xs font-semibold text-brand-300 ring-1 ring-brand-500/30">
                        {i + 1}
                      </span>
                      <span className="pt-0.5 text-sm leading-relaxed text-mist-200">{etape}</span>
                    </li>
                  ))}
                </ol>
              </Card>
            </Section>
          </div>
        )}

        {/* ===================================================== MARCHÉ */}
        {volet === "marche" && (
          <div>
            <Section
              titre={fr ? "Objections clients et réponses" : "Customer objections & answers"}
              soustitre={
                cod
                  ? fr
                    ? "À utiliser au téléphone lors de la confirmation, et en commentaire sous les publicités."
                    : "Use them on the confirmation call and in replies under your ads."
                  : fr
                    ? "À utiliser dans la FAQ de la page, le service client et en commentaire sous les publicités."
                    : "Use them in your page FAQ, customer support and replies under your ads."
              }
            >
              <Card className="divide-y divide-ink-800">
                {dz.objections.map((o, i) => (
                  <div key={i} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-medium text-amber-glow">
                        {guillemets(o.objection)}
                      </p>
                      <CopyButton texte={o.reponse} />
                    </div>
                    <p className="mt-1.5 text-sm leading-relaxed text-mist-200">{o.reponse}</p>
                  </div>
                ))}
              </Card>
            </Section>

            <div className="grid gap-3 md:grid-cols-2">
              <Card className="p-5">
                <h3 className="mb-3 text-sm font-semibold text-mist-100">
                  {fr ? `Concurrence : ${pays}` : `Competition in ${pays}`}
                </h3>
                <Liste items={dz.concurrence_dz} />
              </Card>
              <Card className="p-5">
                <h3 className="mb-3 text-sm font-semibold text-rose-warn">{fr ? "Risques à surveiller" : "Risks to watch"}</h3>
                <Liste items={dz.risques} tone="rouge" />
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
