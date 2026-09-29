"use client";

import Link from "next/link";
import { useState } from "react";
import { useLangue, useT } from "../Langue";
import { SelecteurDevise, useDevise } from "../Devise";
import {
  COUT_CREDITS,
  ENGAGEMENTS,
  PALIERS,
  RECHARGES,
  formatPrix,
  formatPrixCredit,
  prixPalier,
  totalPalier,
  videosPour,
} from "@/lib/tarifs";

/* ============================================================================
   Grille tarifaire, partagee par l'accueil et la page Tarifs.

   Deux reglages seulement : mensuel ou annuel, et la devise (devinee, mais
   modifiable). Chaque palier se traduit en nombre d'analyses — la seule
   unite qui parle a un e-commercant — et son bouton mene droit au paiement
   de CETTE formule apres l'inscription : pas un clic de trop.
   ========================================================================== */

const TEXTES = {
  fr: {
    mois: "/ mois",
    factureAnnuel: (total: string) => `soit ${total} facturés une fois par an`,
    economie: (pct: number) => `−${pct} %`,
    credits: (n: number) => `${n} crédits par mois`,
    videos: (n: number) => `soit ${n} analyses vidéo`,
    choisir: (nom: string) => `Choisir ${nom}`,
    populaire: "Le plus choisi",
    parCredit: (p: string) => `${p} le crédit`,
    consoTitre: "Ce que consomme une analyse",
    consoTexte: "Un tarif fixe, connu avant de lancer. Une analyse qui échoue ne coûte rien : les crédits reviennent automatiquement.",
    video: "Vidéo",
    videoDetail: "Toutes durées",
    image: "Image",
    imageDetail: "Créative statique",
    creditsMot: (n: number): string => (n > 1 ? "crédits" : "crédit"),
    rechargesTitre: "Crédits épuisés avant la fin du mois ?",
    rechargesTexte: "Recharge à tout moment, sans changer de formule. Les crédits rechargés restent tant que ton abonnement est actif.",
    creditsRecharge: (n: number) => `${n} crédits`,
  },
  en: {
    mois: "/ month",
    factureAnnuel: (total: string) => `${total} billed once a year`,
    economie: (pct: number) => `−${pct}%`,
    credits: (n: number) => `${n} credits per month`,
    videos: (n: number) => `${n} video analyses`,
    choisir: (nom: string) => `Choose ${nom}`,
    populaire: "Most popular",
    parCredit: (p: string) => `${p} per credit`,
    consoTitre: "What an analysis costs",
    consoTexte: "A fixed price, known before you start. A failed analysis costs nothing: credits are refunded automatically.",
    video: "Video",
    videoDetail: "Any length",
    image: "Image",
    imageDetail: "Static creative",
    creditsMot: (n: number): string => (n > 1 ? "credits" : "credit"),
    rechargesTitre: "Out of credits before the end of the month?",
    rechargesTexte: "Top up anytime without changing plans. Top-up credits stay as long as your subscription is active.",
    creditsRecharge: (n: number) => `${n} credits`,
  },
};

const Coche = () => (
  <svg viewBox="0 0 24 24" className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="m5 13 4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export function GrilleTarifs({ classeReveal = "st-reveal" }: { classeReveal?: string }) {
  const langue = useLangue();
  const t = useT(TEXTES);
  const [devise, setDevise] = useDevise();
  const [indexDuree, setIndexDuree] = useState(0);
  const engagement = ENGAGEMENTS[indexDuree];
  const annuel = engagement.mois === 12;

  return (
    <div>
      {/* Reglages ---------------------------------------------------------- */}
      <div className={`${classeReveal} flex flex-wrap items-center justify-center gap-3`}>
        <div className="inline-flex rounded-full border border-ink-700 bg-ink-900 p-1">
          {ENGAGEMENTS.map((e, i) => (
            <button
              key={e.mois}
              onClick={() => setIndexDuree(i)}
              className={`rounded-full px-5 py-2 text-sm font-medium transition ${
                i === indexDuree ? "bg-brand-500 text-ink-950" : "text-mist-300 hover:text-mist-100"
              }`}
            >
              {e.libelle[langue]}
              {e.remise > 0 && (
                <span className={`ml-1.5 text-[11px] font-semibold ${i === indexDuree ? "text-ink-950/70" : "text-jade"}`}>
                  {t.economie(Math.round(e.remise * 100))}
                </span>
              )}
            </button>
          ))}
        </div>
        <SelecteurDevise devise={devise} onChange={setDevise} />
      </div>

      {/* Paliers ----------------------------------------------------------- */}
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {PALIERS.map((p) => {
          const mensuel = prixPalier(p, engagement.remise);
          const total = totalPalier(p, engagement.remise, engagement.mois);
          return (
            <div
              key={p.nom}
              className={`${classeReveal} relative flex flex-col rounded-[var(--r-lg)] border p-6 transition-transform duration-300 hover:-translate-y-1 sm:p-7 ${
                p.populaire
                  ? "border-brand-500/50 bg-ink-850 shadow-xl shadow-brand-500/10"
                  : "border-ink-700 bg-ink-900"
              }`}
            >
              {p.populaire && (
                <span className="cta-aurora absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-3 py-1 text-[11px] font-semibold">
                  {t.populaire}
                </span>
              )}

              <h3 className="text-lg font-medium text-mist-100">{p.nom}</h3>
              <p className="mt-1 text-sm text-mist-400">{p.cible[langue]}</p>

              <div className="mt-5 flex items-baseline gap-1.5">
                <span className={`font-display text-4xl font-medium tracking-tight ${p.populaire ? "text-gold" : "text-mist-100"}`}>
                  {formatPrix(mensuel, devise, langue)}
                </span>
                <span className="text-sm text-mist-400">{t.mois}</span>
                {annuel && (
                  <span className="ml-1 text-sm text-mist-500 line-through">{formatPrix(p.prix, devise, langue)}</span>
                )}
              </div>
              <p className="mt-1 h-4 text-xs text-mist-500">{annuel ? t.factureAnnuel(formatPrix(total, devise, langue)) : ""}</p>

              <div className="mt-5 rounded-[var(--r-md)] border border-ink-800 bg-ink-950/50 px-4 py-3">
                <p className="text-sm font-semibold text-brand-300">{t.credits(p.creditsMensuels)}</p>
                <p className="mt-0.5 text-xs text-mist-400">{t.videos(videosPour(p.creditsMensuels))}</p>
              </div>

              <ul className="mt-5 flex-1 space-y-2.5">
                {p.avantages[langue].map((a) => (
                  <li key={a} className="flex gap-2.5 text-sm leading-snug text-mist-200">
                    <Coche />
                    {a}
                  </li>
                ))}
              </ul>

              <Link
                href={`/inscription?formule=${encodeURIComponent(p.nom)}&periode=${engagement.mois}`}
                className={`mt-6 block rounded-full px-5 py-3 text-center text-sm font-semibold transition ${
                  p.populaire
                    ? "cta-aurora"
                    : "border border-ink-600 text-mist-100 hover:border-brand-500/50 hover:text-brand-300"
                }`}
              >
                {t.choisir(p.nom)}
              </Link>
              <p className="mt-2.5 text-center text-[11px] text-mist-500">
                {t.parCredit(formatPrixCredit(mensuel, p.creditsMensuels, devise, langue))}
              </p>
            </div>
          );
        })}
      </div>

      {/* Consommation et recharges ----------------------------------------- */}
      <div className="mt-6 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div className={`${classeReveal} rounded-[var(--r-lg)] border border-ink-700 bg-ink-900 p-6`}>
          <h3 className="text-sm font-semibold text-mist-100">{t.consoTitre}</h3>
          <p className="mt-1.5 text-xs leading-relaxed text-mist-400">{t.consoTexte}</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {[
              { titre: t.video, detail: t.videoDetail, c: COUT_CREDITS.video },
              { titre: t.image, detail: t.imageDetail, c: COUT_CREDITS.image },
            ].map((x) => (
              <div key={x.titre} className="rounded-[var(--r-md)] border border-ink-800 bg-ink-950/50 px-4 py-3 text-center">
                <div className="text-2xl font-bold tabular-nums text-brand-300">{x.c}</div>
                <div className="text-[11px] uppercase tracking-wide text-mist-400">{t.creditsMot(x.c)}</div>
                <div className="mt-1.5 text-sm font-medium text-mist-100">{x.titre}</div>
                <div className="text-[11px] text-mist-500">{x.detail}</div>
              </div>
            ))}
          </div>
        </div>

        <div className={`${classeReveal} rounded-[var(--r-lg)] border border-ink-700 bg-ink-900 p-6`}>
          <h3 className="text-sm font-semibold text-mist-100">{t.rechargesTitre}</h3>
          <p className="mt-1.5 text-xs leading-relaxed text-mist-400">{t.rechargesTexte}</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {RECHARGES.map((r) => (
              <div
                key={r.credits}
                className={`rounded-[var(--r-md)] border px-4 py-3 text-center ${
                  "populaire" in r && r.populaire ? "border-brand-500/40 bg-ink-850" : "border-ink-800 bg-ink-950/50"
                }`}
              >
                <div className="text-[11px] uppercase tracking-wide text-mist-500">{r.libelle[langue]}</div>
                <div className="mt-1 text-base font-semibold tabular-nums text-mist-100">{t.creditsRecharge(r.credits)}</div>
                <div className="mt-0.5 text-lg font-medium text-brand-300">{formatPrix(r.prix, devise, langue)}</div>
                <div className="text-[11px] text-mist-500">{t.videos(videosPour(r.credits))}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
