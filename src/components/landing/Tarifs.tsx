"use client";

import { useState } from "react";
import Link from "next/link";
import { SelecteurDevise, useDevise } from "../Devise";
import { CARTE_ACTIVE } from "@/lib/public";
import {
  COUT_CREDITS,
  ENGAGEMENTS,
  PALIERS,
  RECHARGES,
  formatPrix,
  formatPrixCredit,
  prixPalier,
  prixRecharge,
  totalPalier,
  videosPour,
} from "@/lib/tarifs";

/* ============================================================================
   Section tarifs.

   Trois paliers, trois durees d'engagement, et des recharges ponctuelles.
   Le tableau des couts en credits est affiche : un visiteur qui comprend ce
   qu'il consomme s'abonne plus facilement qu'un visiteur qui doit deviner.
   ========================================================================== */

export function Tarifs() {
  const [dureeIndex, setDureeIndex] = useState(0); // mensuel : le plus simple pour commencer
  const engagement = ENGAGEMENTS[dureeIndex];
  const [devise, setDevise] = useDevise();

  return (
    <section id="tarifs" className="scroll-mt-20 border-b border-ink-800 px-5 py-20 sm:py-28">
      <div className="mx-auto max-w-5xl">
        <h2 className="st-titre text-center text-3xl font-medium tracking-[-0.02em] text-mist-100 sm:text-4xl">
          {(devise === "DZD" ? "Des abonnements pensés pour le marché algérien" : "Des formules simples, sans engagement").split(" ").map((m, i) => (
            <span key={i} className="st-mot inline-block">
              {m}&nbsp;
            </span>
          ))}
        </h2>
        <p className="st-reveal mx-auto mt-3 max-w-xl text-center text-sm font-light text-mist-300">
          Une analyse coûte moins cher qu&apos;une livraison ratée — et peut
          t&apos;éviter d&apos;importer un produit qui ne se vendra jamais.
        </p>

        {/* Selecteur de duree ------------------------------------------- */}
        <div className="st-reveal mt-8 flex flex-wrap items-center justify-center gap-3">
          <div className="inline-flex rounded-full border border-ink-700 bg-ink-900 p-1">
            {ENGAGEMENTS.map((e, i) => (
              <button
                key={e.mois}
                onClick={() => setDureeIndex(i)}
                className={`relative rounded-full px-4 py-2 text-xs font-medium transition sm:px-5 sm:text-sm ${
                  i === dureeIndex
                    ? "bg-brand-500 text-ink-950"
                    : "text-mist-300 hover:text-mist-100"
                }`}
              >
                {e.libelle}
                {e.remise > 0 && (
                  <span
                    className={`ml-1.5 text-[10px] ${
                      i === dureeIndex ? "text-ink-950/70" : "text-brand-400"
                    }`}
                  >
                    −{Math.round(e.remise * 100)} %
                  </span>
                )}
              </button>
            ))}
          </div>
          <SelecteurDevise devise={devise} onChange={setDevise} />
        </div>

        {/* Paliers ------------------------------------------------------ */}
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {PALIERS.map((p) => {
            const mensuel = prixPalier(p, devise, engagement.remise);
            const total = totalPalier(p, devise, engagement.remise, engagement.mois);
            const videos = videosPour(p.creditsMensuels);

            return (
              <div
                key={p.nom}
                className={`st-reveal relative flex flex-col rounded-xl border p-6 transition-transform duration-300 hover:-translate-y-1.5 ${
                  p.populaire
                    ? "border-brand-500/50 bg-ink-850 shadow-xl shadow-brand-500/10"
                    : "border-ink-700 bg-ink-900"
                }`}
              >
                {p.populaire && (
                  <span className="cta-aurora absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-[11px] font-semibold">
                    Le plus choisi
                  </span>
                )}

                <h3 className="text-center text-sm font-medium uppercase tracking-wide text-mist-400 sm:text-left">
                  {p.nom}
                </h3>
                <p className="mt-1 text-center text-xs text-mist-400 sm:text-left">{p.cible}</p>

                <div className="mt-4 text-center sm:text-left">
                  <div
                    className={`text-3xl font-medium tracking-tight ${p.populaire ? "text-gold" : "text-mist-100"}`}
                  >
                    {formatPrix(mensuel, devise)}
                    <span className="text-sm font-normal text-mist-400"> / mois</span>
                  </div>
                  {engagement.remise > 0 && (
                    <div className="mt-1 text-xs text-mist-400">
                      <span className="line-through">{formatPrix(prixPalier(p, devise, 0), devise)}</span> —
                      soit {formatPrix(total, devise)} pour {engagement.mois} mois
                    </div>
                  )}
                </div>

                <div className="mt-4 rounded-lg border border-ink-800 bg-ink-950/50 px-3 py-2.5 text-center">
                  <div className="text-lg font-bold tabular-nums text-brand-300">
                    {p.creditsMensuels} crédits
                  </div>
                  <div className="text-[11px] text-mist-400">
                    par mois — soit {videos} vidéos
                  </div>

                </div>

                <ul className="mt-5 flex-1 space-y-2">
                  {p.avantages.map((a) => (
                    <li key={a} className="flex gap-2 text-sm font-light text-mist-200">
                      <svg
                        viewBox="0 0 24 24"
                        className="mt-0.5 h-4 w-4 shrink-0 text-brand-400"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <path d="m5 13 4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {a}
                    </li>
                  ))}
                </ul>

                <Link
                  href="/inscription"
                  className={`mt-6 rounded-full px-5 py-2.5 text-center text-sm font-semibold ${
                    p.populaire
                      ? "cta-aurora"
                      : "border border-ink-600 text-mist-200 transition hover:border-brand-500/50 hover:text-brand-300"
                  }`}
                >
                  Choisir {p.nom}
                </Link>
              </div>
            );
          })}
        </div>

        {/* Ce que consomme une analyse ---------------------------------- */}
        <div className="st-reveal mt-10 rounded-xl border border-ink-700 bg-ink-900 p-6">
          <h3 className="text-center text-sm font-semibold text-mist-100">
            Ce que consomme une analyse
          </h3>
          <p className="mx-auto mt-1.5 max-w-lg text-center text-xs text-mist-400">
            Un tarif fixe, connu avant de lancer. Une analyse qui échoue ne coûte rien : les
            crédits reviennent automatiquement.
          </p>
          <div className="mx-auto mt-5 grid max-w-md grid-cols-2 gap-3">
            {[
              { t: "Vidéo", c: COUT_CREDITS.video, d: "Toutes durées" },
              { t: "Image", c: COUT_CREDITS.image, d: "Créative statique" },
            ].map((x) => (
              <div
                key={x.t}
                className="rounded-lg border border-ink-800 bg-ink-850 px-4 py-3 text-center"
              >
                <div className="text-2xl font-bold tabular-nums text-brand-300">{x.c}</div>
                <div className="mt-0.5 text-[11px] uppercase tracking-wide text-mist-400">
                  crédit{x.c > 1 ? "s" : ""}
                </div>
                <div className="mt-1.5 text-sm font-medium text-mist-100">{x.t}</div>
                <div className="text-[11px] text-mist-400">{x.d}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Recharges ---------------------------------------------------- */}
        <div className="st-reveal mt-6">
          <h3 className="text-center text-sm font-semibold text-mist-100">
            Crédits épuisés avant la fin du mois ?
          </h3>
          <p className="mx-auto mt-1.5 max-w-lg text-center text-xs text-mist-400">
            Recharge à tout moment, sans changer d&apos;abonnement. Les crédits rechargés
            n&apos;expirent pas tant que ton abonnement est actif.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {RECHARGES.map((r) => (
              <div
                key={r.credits}
                className={`rounded-xl border p-4 text-center transition-transform duration-300 hover:-translate-y-1 ${
                  "populaire" in r && r.populaire
                    ? "border-brand-500/40 bg-ink-850"
                    : "border-ink-700 bg-ink-900"
                }`}
              >
                <div className="text-[11px] uppercase tracking-wide text-mist-400">{r.libelle}</div>
                <div className="mt-1 text-xl font-bold tabular-nums text-mist-100">
                  {r.credits} crédits
                </div>
                <div className="mt-1 text-lg font-medium text-brand-300">
                  {formatPrix(prixRecharge(r, devise), devise)}
                </div>
                <div className="mt-0.5 text-[11px] text-mist-400">
                  {formatPrixCredit(prixRecharge(r, devise), r.credits, devise)} le crédit
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="st-reveal mt-6 text-center text-xs leading-relaxed text-mist-400">
          {CARTE_ACTIVE
            ? "Carte Visa, Mastercard ou RedotPay : crédits ajoutés à la seconde. En Algérie, aussi par BaridiMob ou CCP."
            : "Paiement par BaridiMob ou versement CCP, après un appel de confirmation."}{" "}
          <a href="#demarrer" className="text-brand-400 underline underline-offset-4 hover:text-brand-300">
            Voir comment ça se passe
          </a>
          .
        </p>
      </div>
    </section>
  );
}
