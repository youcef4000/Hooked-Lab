"use client";

import { Badge, Card, ChiffreCle, Duo, Ligne, Liste, Repli, ScoreBar, Section, Verdict } from "../ui";
import { niveauProduction, useRapport } from "./contexte";
import type { Report } from "@/types/analysis";

/* ============================================================================
   Vue d'ensemble.

   Ordre de lecture voulu : verdict -> chiffres qui decident -> forces et
   faiblesses -> detail replie. Un debutant s'arrete apres les chiffres ;
   un utilisateur avance deplie ce qui l'interesse.
   ========================================================================== */

const TEXTES = {
  fr: {
    profit: "Profit par commande",
    marge: (m: string) => `Marge ${m} %`,
    prix: "Prix de vente conseillé",
    prixCod: "Paiement à la livraison",
    prixPrepaye: "Paiement par carte",
    achat: "Coût d'achat estimé",
    fiabilite: (f: string) => `Fiabilité ${f}`,
    cpa: "Budget pub maximum",
    cpaDetail: "Par commande, avant perte",
    produit: "Le produit",
    produitSous: "Ce que la créative vend, et ce qu'il faut commander.",
    fragile: "Fragile",
    identifie: (p: number) => `Identifié à ${p} %`,
    nomFournisseur: "Nom fournisseur",
    nomSecond: (algerie: boolean) => (algerie ? "Nom arabe" : "Nom en publicité"),
    saison: "Saisonnalité",
    variantes: "Variantes",
    caract: "Caractéristiques et matériaux",
    caractTitre: "Caractéristiques",
    materiaux: "Matériaux probables",
    forces: "Ce qui marche, ce qui manque",
    pointsForts: "Points forts",
    ameliorer: "À améliorer",
    hook: "Le hook",
    hookSous: "Les 3 premières secondes décident du reste.",
    arret: "arrêt du scroll",
    pourquoi: "Pourquoi ce hook fonctionne",
    alternatifs: "Hooks alternatifs à tester",
    score: "Détail du score",
    demande: "Demande",
    concurrence: "Espace concurrentiel",
    margeScore: "Potentiel de marge",
    logistique: "Facilité logistique",
    tournage: "Facilité de tournage",
    justification: "Justification du score",
    plus: "Pour aller plus loin",
    synthese: "Synthèse de l'analyse",
    structure: "Structure de la créative",
    duree: "Durée",
    plans: "Plans",
    format: "Format",
    production: "Production",
    retient: "Ce qui retient l'attention",
    decrochage: "Risques de décrochage",
    son: "Bande son",
    voix: "Voix",
    aucune: "Aucune",
    musique: "Musique",
    ambiance: "Ambiance",
    rythme: "Rythme",
    fiab: { faible: "faible", moyenne: "moyenne", bonne: "bonne" } as Record<string, string>,
  },
  en: {
    profit: "Profit per order",
    marge: (m: string) => `${m}% margin`,
    prix: "Suggested retail price",
    prixCod: "Cash on delivery",
    prixPrepaye: "Card payment",
    achat: "Estimated purchase cost",
    fiabilite: (f: string) => `${f} reliability`,
    cpa: "Maximum ad budget",
    cpaDetail: "Per order, before losing money",
    produit: "The product",
    produitSous: "What the creative sells, and what you need to order.",
    fragile: "Fragile",
    identifie: (p: number) => `${p}% identified`,
    nomFournisseur: "Supplier name",
    nomSecond: (algerie: boolean) => (algerie ? "Arabic name" : "Ad-facing name"),
    saison: "Seasonality",
    variantes: "Variants",
    caract: "Features and materials",
    caractTitre: "Features",
    materiaux: "Likely materials",
    forces: "What works, what's missing",
    pointsForts: "Strengths",
    ameliorer: "To improve",
    hook: "The hook",
    hookSous: "The first 3 seconds decide the rest.",
    arret: "scroll-stopping",
    pourquoi: "Why this hook works",
    alternatifs: "Alternative hooks to test",
    score: "Score breakdown",
    demande: "Demand",
    concurrence: "Competitive room",
    margeScore: "Margin potential",
    logistique: "Logistics ease",
    tournage: "Ease of shooting",
    justification: "Why this score",
    plus: "Go further",
    synthese: "Analysis summary",
    structure: "Creative structure",
    duree: "Duration",
    plans: "Shots",
    format: "Format",
    production: "Production",
    retient: "What holds attention",
    decrochage: "Drop-off risks",
    son: "Soundtrack",
    voix: "Voice",
    aucune: "None",
    musique: "Music",
    ambiance: "Mood",
    rythme: "Pace",
    fiab: { faible: "Low", moyenne: "Medium", bonne: "Good" } as Record<string, string>,
  },
};

export function OverviewTab({ report }: { report: Report }) {
  const { fr, fmt, cod, marche } = useRapport();
  const t = TEXTES[fr ? "fr" : "en"];
  const { creative, dz, sourcing, rentabilite } = report;
  const p = creative.produit;
  const hook = creative.hook;
  const r = rentabilite.resultats;
  const rentable = r.profit_par_commande_dzd > 0;
  const guillemets = (x: string) => (fr ? `« ${x} »` : `“${x}”`);

  return (
    <div className="space-y-8">
      {/* 1. La decision ------------------------------------------------- */}
      <Verdict score={dz.score.global_sur_100} verdict={dz.score.verdict}>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <ChiffreCle
            label={t.profit}
            valeur={fmt(r.profit_par_commande_dzd)}
            tone={rentable ? "vert" : "rouge"}
            detail={t.marge(r.marge_pct.toFixed(0))}
          />
          <ChiffreCle label={t.prix} valeur={fmt(rentabilite.params.prix_vente_dzd)} tone="or" detail={cod ? t.prixCod : t.prixPrepaye} />
          <ChiffreCle
            label={t.achat}
            valeur={`$${sourcing.estimation.prix_achat_unitaire_usd_min.toFixed(2)} – $${sourcing.estimation.prix_achat_unitaire_usd_max.toFixed(2)}`}
            detail={t.fiabilite(t.fiab[sourcing.estimation.fiabilite] ?? sourcing.estimation.fiabilite)}
          />
          <ChiffreCle label={t.cpa} valeur={fmt(r.cpa_max_dzd)} tone={r.cpa_max_dzd > 0 ? "ambre" : "rouge"} detail={t.cpaDetail} />
        </div>
      </Verdict>

      {/* 2. Le produit, en une carte ------------------------------------ */}
      <Section titre={t.produit} soustitre={t.produitSous}>
        <Card className="p-5">
          <div className="grid gap-6 md:grid-cols-[1fr_1fr]">
            <div>
              <h3 className="text-lg font-semibold leading-snug text-mist-100">{p.nom_fr}</h3>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Badge tone="bleu">{p.categorie}</Badge>
                <Badge>{Math.round(p.poids_estime_g)} g</Badge>
                {p.fragile && <Badge tone="ambre">{t.fragile}</Badge>}
                <Badge tone={p.confiance >= 0.7 ? "vert" : "ambre"}>{t.identifie(Math.round(p.confiance * 100))}</Badge>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-mist-300">{p.description}</p>
            </div>

            <div className="text-sm">
              <Ligne label={t.nomFournisseur}>{p.nom_en}</Ligne>
              <Ligne label={t.nomSecond(marche.id === "dz")}>
                <span dir={/[؀-ۿ]/.test(p.nom_ar) ? "rtl" : "ltr"}>{p.nom_ar}</span>
              </Ligne>
              <Ligne label={t.saison}>{p.saisonnalite}</Ligne>
              {p.variantes.length > 0 && <Ligne label={t.variantes}>{p.variantes.slice(0, 3).join(", ")}</Ligne>}
            </div>
          </div>

          {(p.caracteristiques.length > 0 || p.materiaux_supposes.length > 0) && (
            <div className="mt-4 border-t border-ink-800 pt-4">
              <Repli titre={t.caract} compteur={p.caracteristiques.length}>
                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <h4 className="mb-2 text-xs uppercase tracking-wide text-mist-400">{t.caractTitre}</h4>
                    <Liste items={p.caracteristiques} />
                  </div>
                  {p.materiaux_supposes.length > 0 && (
                    <div>
                      <h4 className="mb-2 text-xs uppercase tracking-wide text-mist-400">{t.materiaux}</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {p.materiaux_supposes.map((m, i) => (
                          <Badge key={i}>{m}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Repli>
            </div>
          )}
        </Card>
      </Section>

      {/* 3. Forces et faiblesses --------------------------------------- */}
      <Section titre={t.forces}>
        <Duo gauche={{ titre: t.pointsForts, items: creative.ce_qui_marche }} droite={{ titre: t.ameliorer, items: creative.ce_qui_manque }} />
      </Section>

      {/* 4. Le hook ------------------------------------------------------ */}
      <Section titre={t.hook} soustitre={t.hookSous}>
        <Card className="p-5">
          <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
            <div className="shrink-0">
              <div
                className={`text-4xl font-bold tabular-nums ${
                  hook.force_sur_10 >= 7 ? "text-jade" : hook.force_sur_10 >= 5 ? "text-amber-glow" : "text-rose-warn"
                }`}
              >
                {hook.force_sur_10}
                <span className="text-lg text-mist-400">/10</span>
              </div>
              <div className="text-[11px] text-mist-400">{t.arret}</div>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-base font-medium leading-snug text-mist-100">{guillemets(hook.texte)}</p>
              <div className="mt-2 flex flex-wrap justify-center gap-1.5 sm:justify-start">
                <Badge tone="bleu">{hook.type}</Badge>
                <Badge>{hook.duree_s.toFixed(1)} s</Badge>
              </div>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <Repli titre={t.pourquoi} apercu={hook.analyse}>
              <p className="text-sm leading-relaxed text-mist-300">{hook.analyse}</p>
            </Repli>
            {hook.variantes_proposees.length > 0 && (
              <Repli titre={t.alternatifs} compteur={hook.variantes_proposees.length} ouvert>
                <Liste items={hook.variantes_proposees} tone="vert" />
              </Repli>
            )}
          </div>
        </Card>
      </Section>

      {/* 5. Detail du score --------------------------------------------- */}
      <Section titre={t.score}>
        <Card className="p-5">
          <div className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
            <ScoreBar label={t.demande} valeur={dz.score.demande} max={20} />
            <ScoreBar label={t.concurrence} valeur={dz.score.concurrence} max={20} />
            <ScoreBar label={t.margeScore} valeur={dz.score.marge} max={20} />
            <ScoreBar label={t.logistique} valeur={dz.score.logistique} max={20} />
            <ScoreBar label={t.tournage} valeur={dz.score.facilite_creative} max={20} />
          </div>
          <div className="mt-4">
            <Repli titre={t.justification} apercu={dz.score.justification}>
              <p className="text-sm leading-relaxed text-mist-300">{dz.score.justification}</p>
            </Repli>
          </div>
        </Card>
      </Section>

      {/* 6. Synthese et structure, replies ------------------------------ */}
      <Section titre={t.plus}>
        <div className="space-y-2">
          <Repli titre={t.synthese} apercu={creative.resume_executif}>
            <p className="text-sm leading-relaxed text-mist-200">{creative.resume_executif}</p>
          </Repli>

          <Repli titre={t.structure} compteur={`${Math.round(creative.structure.duree_totale)} s`}>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <ChiffreCle label={t.duree} valeur={`${Math.round(creative.structure.duree_totale)} s`} />
              <ChiffreCle label={t.plans} valeur={creative.structure.nb_plans_estime} detail={creative.structure.rythme_coupe} />
              <ChiffreCle label={t.format} valeur={creative.structure.format} />
              <ChiffreCle label={t.production} valeur={niveauProduction(creative.structure.ugc_ou_pro, fr)} />
            </div>
            <div className="mt-4 grid gap-5 md:grid-cols-2">
              <div>
                <h4 className="mb-2 text-xs uppercase tracking-wide text-mist-400">{t.retient}</h4>
                <Liste items={creative.structure.points_de_retention} tone="vert" />
              </div>
              <div>
                <h4 className="mb-2 text-xs uppercase tracking-wide text-mist-400">{t.decrochage}</h4>
                <Liste items={creative.structure.points_de_decrochage} tone="rouge" />
              </div>
            </div>
          </Repli>

          <Repli titre={t.son} apercu={creative.audio.type_musique}>
            <div className="text-sm">
              <Ligne label={t.voix}>{creative.audio.presence_voix ? creative.audio.type_voix : t.aucune}</Ligne>
              <Ligne label={t.musique}>{creative.audio.type_musique}</Ligne>
              <Ligne label={t.ambiance}>{creative.audio.ambiance}</Ligne>
              <Ligne label={t.rythme}>{creative.audio.rythme}</Ligne>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-mist-300">{creative.audio.role_du_son}</p>
          </Repli>
        </div>
      </Section>
    </div>
  );
}
