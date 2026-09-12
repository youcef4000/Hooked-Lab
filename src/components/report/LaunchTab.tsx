"use client";

import { useState } from "react";
import { Badge, Card, Chips, ChiffreCle, Liste, Repli, Section } from "../ui";
import { CopyButton } from "../CopyButton";
import { MetaAdsSection } from "./MetaAdsSection";
import { BanqueVideos } from "./BanqueVideos";
import { formatDZD } from "@/lib/dz";
import type { CopyLanding, Report } from "@/types/analysis";

/* ============================================================================
   Pack de lancement.

   Ce bloc contenait tout d'un seul tenant : de quoi noyer un debutant. Il est
   maintenant reparti en quatre volets qui suivent l'ordre reel du travail —
   on lance des publicites, puis on ecrit la page, puis on organise, puis on
   verifie le marche. Chaque volet tient dans un ecran.
   ========================================================================== */

const VOLETS = [
  { id: "publicite", label: "Publicité", aide: "Ce que tu lances aujourd'hui" },
  { id: "textes", label: "Textes de vente", aide: "Page produit et script" },
  { id: "execution", label: "Exécution", aide: "Plan, ciblage et tournage" },
  { id: "marche", label: "Marché", aide: "Objections et risques" },
] as const;

type VoletId = (typeof VOLETS)[number]["id"];

function LandingBloc({ copy, rtl }: { copy: CopyLanding; rtl: boolean }) {
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
        <Badge tone={rtl ? "ambre" : "bleu"}>{rtl ? "Arabe algérien" : "Français"}</Badge>
        <CopyButton texte={texteComplet} label="Copier toute la page" />
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
        <Repli titre="Questions fréquentes de la page" compteur={copy.faq.length}>
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
  const [volet, setVolet] = useState<VoletId>("publicite");
  const [langueLanding, setLangueLanding] = useState<"fr" | "ar">("fr");

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
              {v.label}
            </div>
            <div className="mt-0.5 text-[11px] leading-snug text-mist-400">{v.aide}</div>
          </button>
        ))}
      </div>

      <div key={volet} className="anim-tab-in">
        {/* ================================================== PUBLICITÉ */}
        {volet === "publicite" && (
          <div>
            <MetaAdsSection ads={dz.meta_ads ?? []} />

            <Section
              titre="Autres accroches"
              soustitre="Variantes courtes pour TikTok et Instagram, à adapter au format de chaque plateforme."
            >
              <div className="grid gap-3 md:grid-cols-2">
                {dz.annonces.map((a, i) => (
                  <Card key={i} className="p-5">
                    <div className="mb-3 flex items-center justify-between">
                      <Badge tone={a.plateforme === "tiktok" ? "neutre" : "bleu"}>
                        {a.plateforme}
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
                    <p className="mt-2 text-[11px] text-mist-400">Angle : {a.angle_utilise}</p>
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
              titre="Page de vente"
              soustitre="Prête à coller dans ton constructeur de page produit."
              action={
                <div className="flex gap-1 rounded-lg border border-ink-700 bg-ink-850 p-0.5">
                  <button
                    onClick={() => setLangueLanding("fr")}
                    className={`rounded-md px-3 py-1 text-xs transition ${
                      langueLanding === "fr" ? "bg-ink-700 text-mist-100" : "text-mist-400"
                    }`}
                  >
                    Français
                  </button>
                  <button
                    onClick={() => setLangueLanding("ar")}
                    className={`rounded-md px-3 py-1 text-xs transition ${
                      langueLanding === "ar" ? "bg-ink-700 text-mist-100" : "text-mist-400"
                    }`}
                  >
                    العربية
                  </button>
                </div>
              }
            >
              {langueLanding === "fr" ? (
                <LandingBloc copy={dz.copy_landing_fr} rtl={false} />
              ) : (
                <LandingBloc copy={dz.copy_landing_ar} rtl />
              )}
            </Section>

            <Section
              titre="Script vidéo en darija"
              soustitre="Prêt à tourner avec un téléphone."
              action={<CopyButton texte={dz.script_darija.texte} label="Copier le script" />}
            >
              <Card className="p-5">
                <p dir="rtl" className="whitespace-pre-wrap text-[15px] leading-loose text-mist-100">
                  {dz.script_darija.texte}
                </p>
                {dz.script_darija.notes.length > 0 && (
                  <div className="mt-4 border-t border-ink-800 pt-4">
                    <Repli titre="Notes de tournage" compteur={dz.script_darija.notes.length}>
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
            <Section titre="Ciblage publicitaire" soustitre="Où et à qui diffuser en priorité.">
              <div className="grid gap-3 lg:grid-cols-3">
                <div className="grid gap-3 sm:grid-cols-3 lg:col-span-1 lg:grid-cols-1">
                  <ChiffreCle label="Tranche d'âge" valeur={dz.ciblage.tranche_age} />
                  <ChiffreCle label="Genre" valeur={dz.ciblage.genre} />
                  <ChiffreCle
                    label="Budget de test / jour"
                    valeur={formatDZD(dz.ciblage.budget_test_conseille_dzd)}
                    tone="or"
                  />
                </div>
                <Card className="p-5 lg:col-span-2">
                  <h3 className="mb-2.5 text-sm font-semibold text-mist-100">
                    Wilayas prioritaires
                  </h3>
                  <Chips items={dz.ciblage.wilayas_prioritaires} tone="vert" />
                  <h3 className="mb-2.5 mt-5 text-sm font-semibold text-mist-100">
                    Intérêts à cibler
                  </h3>
                  <Chips items={dz.ciblage.interets} tone="bleu" />
                  <h3 className="mb-2.5 mt-5 text-sm font-semibold text-mist-100">
                    Créneaux de diffusion
                  </h3>
                  <Chips items={dz.ciblage.moments_de_diffusion} />
                </Card>
              </div>
            </Section>

            <BanqueVideos pistes={dz.banque_videos ?? []} />

            <Section
              titre="Créatives à tourner"
              soustitre="Des variantes à tester en plus de la créative analysée."
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
                          {idee.difficulte}
                        </Badge>
                      </div>
                      <p className="rounded-md bg-ink-850 px-3 py-2 text-sm italic text-mist-200">
                        &laquo; {idee.hook} &raquo;
                      </p>
                    </div>
                    <div className="border-t border-ink-800">
                      <Repli titre="Déroulé du tournage" compteur={`${idee.deroule.length} plans`}>
                        <ol className="space-y-1.5">
                          {idee.deroule.map((d, j) => (
                            <li key={j} className="flex gap-2 text-xs leading-relaxed text-mist-300">
                              <span className="shrink-0 tabular-nums text-mist-400">{j + 1}.</span>
                              <span>{d}</span>
                            </li>
                          ))}
                        </ol>
                        <p className="mt-3 border-t border-ink-800 pt-2 text-[11px] text-mist-400">
                          Matériel : {idee.materiel_necessaire}
                        </p>
                      </Repli>
                    </div>
                  </Card>
                ))}
              </div>
            </Section>

            <Section titre="Plan de lancement" soustitre="De la commande fournisseur au scaling.">
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
              titre="Objections clients et réponses"
              soustitre="À utiliser au téléphone lors de la confirmation, et en commentaire sous les publicités."
            >
              <Card className="divide-y divide-ink-800">
                {dz.objections.map((o, i) => (
                  <div key={i} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-medium text-amber-glow">
                        &laquo; {o.objection} &raquo;
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
                <h3 className="mb-3 text-sm font-semibold text-mist-100">Concurrence en Algérie</h3>
                <Liste items={dz.concurrence_dz} />
              </Card>
              <Card className="p-5">
                <h3 className="mb-3 text-sm font-semibold text-rose-warn">Risques à surveiller</h3>
                <Liste items={dz.risques} tone="rouge" />
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
