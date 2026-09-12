"use client";

import {
  Badge,
  Card,
  ChiffreCle,
  Duo,
  Ligne,
  Liste,
  Repli,
  ScoreBar,
  Section,
  Verdict,
} from "../ui";
import { formatDZD } from "@/lib/dz";
import type { Report } from "@/types/analysis";

/* ============================================================================
   Vue d'ensemble.

   Ordre de lecture voulu : verdict -> chiffres qui decident -> forces et
   faiblesses -> detail replie. Un debutant s'arrete apres les chiffres ;
   un utilisateur avance deplie ce qui l'interesse.
   ========================================================================== */

export function OverviewTab({ report }: { report: Report }) {
  const { creative, dz, sourcing, rentabilite } = report;
  const p = creative.produit;
  const hook = creative.hook;
  const r = rentabilite.resultats;

  const rentable = r.profit_par_commande_dzd > 0;

  return (
    <div className="space-y-8">
      {/* 1. La decision ------------------------------------------------- */}
      <Verdict score={dz.score.global_sur_100} verdict={dz.score.verdict}>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <ChiffreCle
            label="Profit par commande"
            valeur={formatDZD(r.profit_par_commande_dzd)}
            tone={rentable ? "vert" : "rouge"}
            detail={`Marge ${r.marge_pct.toFixed(0)} %`}
          />
          <ChiffreCle
            label="Prix de vente conseillé"
            valeur={formatDZD(rentabilite.params.prix_vente_dzd)}
            tone="or"
            detail="Paiement à la livraison"
          />
          <ChiffreCle
            label="Coût d'achat estimé"
            valeur={`${sourcing.estimation.prix_achat_unitaire_usd_min.toFixed(2)} – ${sourcing.estimation.prix_achat_unitaire_usd_max.toFixed(2)} $`}
            detail={`Fiabilité ${sourcing.estimation.fiabilite}`}
          />
          <ChiffreCle
            label="Budget pub maximum"
            valeur={formatDZD(r.cpa_max_dzd)}
            tone={r.cpa_max_dzd > 0 ? "ambre" : "rouge"}
            detail="Par commande, avant perte"
          />
        </div>
      </Verdict>

      {/* 2. Le produit, en une carte ------------------------------------ */}
      <Section titre="Le produit" soustitre="Ce que la créative vend, et ce qu'il faut commander.">
        <Card className="p-5">
          <div className="grid gap-6 md:grid-cols-[1fr_1fr]">
            <div>
              <h3 className="text-lg font-semibold leading-snug text-mist-100">{p.nom_fr}</h3>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Badge tone="bleu">{p.categorie}</Badge>
                <Badge>{Math.round(p.poids_estime_g)} g</Badge>
                {p.fragile && <Badge tone="ambre">Fragile</Badge>}
                <Badge tone={p.confiance >= 0.7 ? "vert" : "ambre"}>
                  Identifie a {Math.round(p.confiance * 100)} %
                </Badge>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-mist-300">{p.description}</p>
            </div>

            <div className="text-sm">
              <Ligne label="Nom fournisseur">{p.nom_en}</Ligne>
              <Ligne label="Nom arabe">
                <span dir="rtl">{p.nom_ar}</span>
              </Ligne>
              <Ligne label="Saisonnalité">{p.saisonnalite}</Ligne>
              {p.variantes.length > 0 && (
                <Ligne label="Variantes">{p.variantes.slice(0, 3).join(", ")}</Ligne>
              )}
            </div>
          </div>

          {(p.caracteristiques.length > 0 || p.materiaux_supposes.length > 0) && (
            <div className="mt-4 border-t border-ink-800 pt-4">
              <Repli titre="Caractéristiques et materiaux" compteur={p.caracteristiques.length}>
                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <h4 className="mb-2 text-xs uppercase tracking-wide text-mist-400">
                      Caractéristiques
                    </h4>
                    <Liste items={p.caracteristiques} />
                  </div>
                  {p.materiaux_supposes.length > 0 && (
                    <div>
                      <h4 className="mb-2 text-xs uppercase tracking-wide text-mist-400">
                        Materiaux probables
                      </h4>
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
      <Section titre="Ce qui marche, ce qui manque">
        <Duo
          gauche={{ titre: "Points forts", items: creative.ce_qui_marche }}
          droite={{ titre: "A ameliorer", items: creative.ce_qui_manque }}
        />
      </Section>

      {/* 4. Le hook ------------------------------------------------------ */}
      <Section titre="Le hook" soustitre="Les 3 premières secondes decident du reste.">
        <Card className="p-5">
          <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
            <div className="shrink-0">
              <div
                className={`text-4xl font-bold tabular-nums ${
                  hook.force_sur_10 >= 7
                    ? "text-jade"
                    : hook.force_sur_10 >= 5
                      ? "text-amber-glow"
                      : "text-rose-warn"
                }`}
              >
                {hook.force_sur_10}
                <span className="text-lg text-mist-400">/10</span>
              </div>
              <div className="text-[11px] text-mist-400">arret du scroll</div>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-base font-medium leading-snug text-mist-100">
                &laquo; {hook.texte} &raquo;
              </p>
              <div className="mt-2 flex flex-wrap justify-center gap-1.5 sm:justify-start">
                <Badge tone="bleu">{hook.type}</Badge>
                <Badge>{hook.duree_s.toFixed(1)} s</Badge>
              </div>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <Repli titre="Pourquoi ce hook fonctionne" apercu={hook.analyse}>
              <p className="text-sm leading-relaxed text-mist-300">{hook.analyse}</p>
            </Repli>
            {hook.variantes_proposees.length > 0 && (
              <Repli
                titre="Hooks alternatifs a tester"
                compteur={hook.variantes_proposees.length}
                ouvert
              >
                <Liste items={hook.variantes_proposees} tone="vert" />
              </Repli>
            )}
          </div>
        </Card>
      </Section>

      {/* 5. Detail du score --------------------------------------------- */}
      <Section titre="Détail du score">
        <Card className="p-5">
          <div className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
            <ScoreBar label="Demande locale" valeur={dz.score.demande} max={20} />
            <ScoreBar label="Espace concurrentiel" valeur={dz.score.concurrence} max={20} />
            <ScoreBar label="Potentiel de marge" valeur={dz.score.marge} max={20} />
            <ScoreBar label="Facilité logistique" valeur={dz.score.logistique} max={20} />
            <ScoreBar label="Facilité de tournage" valeur={dz.score.facilite_creative} max={20} />
          </div>
          <div className="mt-4">
            <Repli titre="Justification du score" apercu={dz.score.justification}>
              <p className="text-sm leading-relaxed text-mist-300">{dz.score.justification}</p>
            </Repli>
          </div>
        </Card>
      </Section>

      {/* 6. Synthese et structure, replies ------------------------------ */}
      <Section titre="Pour aller plus loin">
        <div className="space-y-2">
          <Repli titre="Synthese de l'analyse" apercu={creative.resume_executif}>
            <p className="text-sm leading-relaxed text-mist-200">{creative.resume_executif}</p>
          </Repli>

          <Repli titre="Structure de la créative" compteur={`${Math.round(creative.structure.duree_totale)} s`}>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <ChiffreCle label="Durée" valeur={`${Math.round(creative.structure.duree_totale)} s`} />
              <ChiffreCle
                label="Plans"
                valeur={creative.structure.nb_plans_estime}
                detail={creative.structure.rythme_coupe}
              />
              <ChiffreCle label="Format" valeur={creative.structure.format} />
              <ChiffreCle label="Production" valeur={creative.structure.ugc_ou_pro.toUpperCase()} />
            </div>
            <div className="mt-4 grid gap-5 md:grid-cols-2">
              <div>
                <h4 className="mb-2 text-xs uppercase tracking-wide text-mist-400">
                  Ce qui retient l&apos;attention
                </h4>
                <Liste items={creative.structure.points_de_retention} tone="vert" />
              </div>
              <div>
                <h4 className="mb-2 text-xs uppercase tracking-wide text-mist-400">
                  Risques de decrochage
                </h4>
                <Liste items={creative.structure.points_de_decrochage} tone="rouge" />
              </div>
            </div>
          </Repli>

          <Repli titre="Bande son" apercu={creative.audio.type_musique}>
            <div className="text-sm">
              <Ligne label="Voix">
                {creative.audio.presence_voix ? creative.audio.type_voix : "Aucune"}
              </Ligne>
              <Ligne label="Musique">{creative.audio.type_musique}</Ligne>
              <Ligne label="Ambiance">{creative.audio.ambiance}</Ligne>
              <Ligne label="Rythme">{creative.audio.rythme}</Ligne>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-mist-300">{creative.audio.role_du_son}</p>
          </Repli>
        </div>
      </Section>
    </div>
  );
}
