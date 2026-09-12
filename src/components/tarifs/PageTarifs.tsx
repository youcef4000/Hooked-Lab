"use client";

import Link from "next/link";
import { useState } from "react";
import { CarteVivante, Reveal } from "../Reveal";
import {
  COUT_CREDITS,
  ENGAGEMENTS,
  PALIERS,
  RECHARGES,
  creditsBonus,
  prixMensuelAvecRemise,
  prixParCredit,
  prixTotalEngagement,
} from "@/lib/tarifs";

/* ============================================================================
   Page tarifs.

   Meme registre que la vitrine : densite aeree, rayons genereux, revelation
   au scroll. Deux idees guident la mise en page.

   D'abord, le prix ne se comprend pas seul. Quelqu'un qui lit "2 400 DA pour
   60 credits" ne sait pas ce qu'il achete : on traduit donc systematiquement
   en nombre d'analyses, qui est la seule unite qui lui parle.

   Ensuite, ce marche paie a la livraison depuis toujours. La page explique
   donc le circuit d'encaissement en clair, tot, plutot que de le decouvrir
   au moment de payer — c'est la question qui bloque le plus d'inscriptions.
   ========================================================================== */

const fmt = (n: number) => n.toLocaleString("fr-FR");

const CONSOMMATION = [
  { quoi: "Image publicitaire", cout: COUT_CREDITS.image, detail: "visuel statique, carrousel" },
  { quoi: "Vidéo courte", cout: COUT_CREDITS.videoCourte, detail: "moins de 30 secondes" },
  { quoi: "Vidéo moyenne", cout: COUT_CREDITS.videoMoyenne, detail: "30 à 60 secondes" },
  { quoi: "Vidéo longue", cout: COUT_CREDITS.videoLongue, detail: "plus d'une minute" },
];

const QUESTIONS = [
  {
    q: "Que se passe-t-il si une analyse échoue ?",
    r: "Les crédits sont rendus automatiquement. Une vidéo que la plateforme refuse de laisser télécharger, une panne de notre côté, un fichier illisible : tu ne paies rien. Le remboursement est immédiat, tu n'as personne à contacter.",
  },
  {
    q: "Mes crédits non utilisés sont-ils perdus à la fin du mois ?",
    r: "Non. Les crédits restent sur ton compte tant que ton abonnement court. Si tu recharges avant l'échéance, les jours restants s'ajoutent à la nouvelle période au lieu d'être écrasés.",
  },
  {
    q: "Pourquoi une vidéo longue coûte-t-elle plus cher ?",
    r: "Une minute de vidéo, c'est deux fois plus d'images à examiner, deux fois plus d'audio à transcrire. Le coût de traitement suit la durée, et le tarif aussi — plutôt que de faire payer un forfait moyen à tout le monde.",
  },
  {
    q: "Puis-je changer de formule en cours d'abonnement ?",
    r: "Oui. Prends une recharge si tu manques de crédits ce mois-ci, ou passe à la formule supérieure à l'échéance. Écris-nous sur WhatsApp, on ajuste.",
  },
  {
    q: "Y a-t-il une version gratuite ?",
    r: "Non, et c'est volontaire : chaque analyse a un coût réel de notre côté, et une offre gratuite serait vidée par des comptes jetables. En échange, il n'y a aucun engagement caché — la formule mensuelle s'arrête quand tu veux.",
  },
];

export function PageTarifs() {
  const [dureeIndex, setDureeIndex] = useState(1); // 6 mois : le meilleur rapport
  const engagement = ENGAGEMENTS[dureeIndex];

  return (
    <Reveal className="-mx-4 overflow-x-clip sm:-mx-5">
      {/* ============================================================ HERO */}
      <section
        data-rev-groupe
        className="aurora-glow grain relative px-4 pb-16 pt-14 sm:px-6 sm:pb-20 sm:pt-24"
      >
        <div className="relative z-10 mx-auto max-w-5xl text-center">
          <h1 className="rev text-[32px] font-medium leading-[1.1] tracking-[-0.03em] text-mist-100 sm:text-5xl">
            Une analyse coûte moins cher{" "}
            <span className="text-gold-titre">qu&apos;une livraison ratée.</span>
          </h1>
          <p className="rev mx-auto mt-6 max-w-xl text-base leading-relaxed text-mist-200 sm:text-[17px]">
            Et bien moins cher qu&apos;un stock de 300 pièces d&apos;un produit qui ne se vendra
            jamais. Paiement par BaridiMob ou CCP, activation dans l&apos;heure.
          </p>

          {/* Selecteur de duree */}
          <div className="rev mt-9 flex justify-center">
            <div className="inline-flex rounded-full border border-ink-700 bg-ink-900/80 p-1 backdrop-blur">
              {ENGAGEMENTS.map((e, i) => (
                <button
                  key={e.mois}
                  onClick={() => setDureeIndex(i)}
                  className={`relative rounded-full px-4 py-2 text-xs font-medium transition-[background-color,color] duration-200 sm:px-6 sm:text-sm ${
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
          </div>

          {engagement.moisBonus > 0 && (
            <p className="rev mt-4 text-sm text-jade">
              {engagement.moisBonus} mois de crédits offerts en plus, versés dès l&apos;activation.
            </p>
          )}
        </div>
      </section>

      {/* ========================================================= PALIERS */}
      <section data-rev-groupe className="px-4 pb-20 sm:px-6 sm:pb-28">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-4 lg:grid-cols-3">
            {PALIERS.map((p) => {
              const mensuel = prixMensuelAvecRemise(p.base, engagement.remise);
              const total = prixTotalEngagement(p.base, engagement.remise, engagement.mois);
              const bonus = creditsBonus(p.creditsMensuels, engagement.moisBonus);
              const creditsTotal = p.creditsMensuels * engagement.mois + bonus;
              const videos = Math.floor(p.creditsMensuels / COUT_CREDITS.videoMoyenne);

              return (
                <div key={p.nom} className="rev">
                  <CarteVivante
                    className={`relative flex h-full flex-col p-6 sm:p-7 ${
                      p.populaire ? "border-brand-500/45" : ""
                    }`}
                  >
                    {p.populaire && (
                      <span className="absolute -top-2.5 left-6 rounded-full bg-brand-500 px-2.5 py-0.5 text-[11px] font-semibold text-ink-950">
                        Le plus pris
                      </span>
                    )}

                    <h2 className="text-lg font-medium text-mist-100">{p.nom}</h2>
                    <p className="mt-1 text-sm text-mist-400">{p.cible}</p>

                    <div className="mt-6">
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-display text-4xl font-medium tracking-tight text-mist-100">
                          {fmt(mensuel)}
                        </span>
                        <span className="text-sm text-mist-400">DA / mois</span>
                      </div>
                      {engagement.mois > 1 && (
                        <p className="mt-1.5 text-xs text-mist-500">
                          {fmt(total)} DA réglés en une fois pour {engagement.mois} mois
                        </p>
                      )}
                    </div>

                    <div className="mt-5 rounded-[var(--r-md)] border border-ink-800 bg-ink-950/50 px-4 py-3">
                      <p className="text-sm text-mist-100">
                        <span className="font-semibold text-brand-300">
                          {fmt(p.creditsMensuels)} crédits
                        </span>{" "}
                        par mois
                      </p>
                      <p className="mt-0.5 text-xs text-mist-400">
                        environ {videos} vidéos analysées
                      </p>
                      {bonus > 0 && (
                        <p className="mt-2 border-t border-ink-800 pt-2 text-xs text-jade">
                          + {fmt(bonus)} crédits offerts · {fmt(creditsTotal)} au total
                        </p>
                      )}
                    </div>

                    <ul className="mt-5 flex-1 space-y-2.5">
                      {p.avantages.map((a) => (
                        <li key={a} className="flex gap-2.5 text-sm leading-snug text-mist-300">
                          <svg
                            viewBox="0 0 24 24"
                            className="mt-0.5 h-4 w-4 shrink-0 text-brand-500"
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
                      className={`mt-6 block rounded-[var(--r-md)] px-4 py-3 text-center text-sm font-semibold transition ${
                        p.populaire
                          ? "cta-aurora"
                          : "border border-ink-600 text-mist-100 hover:border-brand-500/50 hover:text-brand-300"
                      }`}
                    >
                      Choisir {p.nom}
                    </Link>
                    <p className="mt-2.5 text-center text-[11px] text-mist-500">
                      {prixParCredit(mensuel, p.creditsMensuels)} DA le crédit
                    </p>
                  </CarteVivante>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =================================================== CONSOMMATION */}
      <section
        data-rev-groupe
        className="border-t border-ink-800 bg-ink-900/30 px-4 py-16 sm:px-6 sm:py-24"
      >
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14">
            <div className="rev">
              <span className="text-[11px] uppercase tracking-[0.14em] text-brand-400">
                Consommation
              </span>
              <h2 className="mt-3 text-2xl font-medium tracking-[-0.02em] text-mist-100 sm:text-3xl">
                Ce que coûte chaque analyse
              </h2>
              <p className="mt-4 text-[15px] leading-relaxed text-mist-300">
                Le tarif suit la durée : une vidéo d&apos;une minute demande deux fois plus de
                travail qu&apos;une vidéo de vingt secondes. Tu ne paies donc pas un forfait moyen
                pour tout le monde.
              </p>
              <p className="mt-4 rounded-[var(--r-md)] border border-jade/25 bg-jade/[0.06] px-4 py-3 text-sm leading-relaxed text-mist-200">
                Une analyse qui échoue ne consomme rien. Les crédits reviennent sur ton compte
                automatiquement.
              </p>
            </div>

            <div className="rev">
              <CarteVivante className="overflow-hidden">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-ink-800">
                      <th className="px-5 py-3.5 text-xs font-medium uppercase tracking-wide text-mist-400">
                        Type de créative
                      </th>
                      <th className="px-5 py-3.5 text-right text-xs font-medium uppercase tracking-wide text-mist-400">
                        Crédits
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {CONSOMMATION.map((c) => (
                      <tr key={c.quoi} className="border-b border-ink-800/60 last:border-0">
                        <td className="px-5 py-4">
                          <p className="text-sm text-mist-100">{c.quoi}</p>
                          <p className="mt-0.5 text-xs text-mist-500">{c.detail}</p>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <span className="font-display text-xl font-medium text-brand-300">
                            {c.cout}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CarteVivante>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================= RECHARGES */}
      <section data-rev-groupe className="border-t border-ink-800 px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="rev max-w-2xl">
            <span className="text-[11px] uppercase tracking-[0.14em] text-brand-400">
              Recharges
            </span>
            <h2 className="mt-3 text-2xl font-medium tracking-[-0.02em] text-mist-100 sm:text-3xl">
              Plus de crédits avant la fin du mois ?
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-mist-300">
              Ça arrive quand une campagne marche et qu&apos;il faut tester dix créatives d&apos;un
              coup. Une recharge s&apos;ajoute à ton solde immédiatement, sans toucher à ton
              abonnement ni à sa date d&apos;échéance.
            </p>
          </div>

          <div className="mt-9 grid gap-4 md:grid-cols-3">
            {RECHARGES.map((r) => {
              const videos = Math.floor(r.credits / COUT_CREDITS.videoMoyenne);
              const populaire = "populaire" in r && r.populaire;
              return (
                <div key={r.credits} className="rev">
                  <CarteVivante
                    className={`flex h-full flex-col p-6 ${populaire ? "border-brand-500/40" : ""}`}
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-sm font-medium text-mist-100">{r.libelle}</span>
                      {populaire && (
                        <span className="rounded-full bg-brand-500/12 px-2 py-0.5 text-[11px] font-medium text-brand-300">
                          courant
                        </span>
                      )}
                    </div>

                    <p className="mt-4 font-display text-3xl font-medium tracking-tight text-brand-300">
                      {fmt(r.credits)}
                      <span className="ml-1.5 text-sm font-normal text-mist-400">crédits</span>
                    </p>
                    <p className="mt-1 text-xs text-mist-500">environ {videos} vidéos</p>

                    <div className="mt-auto pt-5">
                      <p className="text-lg font-medium text-mist-100">{fmt(r.prix)} DA</p>
                      <p className="mt-0.5 text-xs text-mist-500">
                        {prixParCredit(r.prix, r.credits)} DA le crédit
                      </p>
                    </div>
                  </CarteVivante>
                </div>
              );
            })}
          </div>

          <p className="rev mt-5 text-sm leading-relaxed text-mist-400">
            La recharge est volontairement plus chère au crédit que l&apos;abonnement : elle dépanne,
            elle ne remplace pas une formule. Si tu recharges tous les mois, la formule au-dessus te
            revient moins cher.
          </p>
        </div>
      </section>

      {/* ================================================== L'ENCAISSEMENT */}
      <section
        data-rev-groupe
        className="border-t border-ink-800 bg-ink-900/30 px-4 py-16 sm:px-6 sm:py-24"
      >
        <div className="mx-auto max-w-6xl">
          <h2 className="rev max-w-lg text-2xl font-medium tracking-[-0.02em] text-mist-100 sm:text-3xl">
            Comment tu payes, concrètement
          </h2>

          <div className="mt-9 grid gap-4 md:grid-cols-4">
            {[
              {
                n: "01",
                t: "Tu crées ton compte",
                d: "Nom, téléphone, email. Deux minutes, aucune carte demandée.",
              },
              {
                n: "02",
                t: "On t'appelle",
                d: "Pour confirmer la formule et te donner les coordonnées de paiement.",
              },
              {
                n: "03",
                t: "Tu payes",
                d: "BaridiMob ou CCP. Tu envoies la capture sur WhatsApp.",
              },
              {
                n: "04",
                t: "Tu reçois ton code",
                d: "Tu le saisis dans ton compte, tes crédits arrivent aussitôt.",
              },
            ].map((e) => (
              <div key={e.n} className="rev">
                <CarteVivante className="h-full p-5">
                  <span className="font-display text-2xl font-medium text-brand-500/40">{e.n}</span>
                  <h3 className="mt-3 text-sm font-medium text-mist-100">{e.t}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-mist-300">{e.d}</p>
                </CarteVivante>
              </div>
            ))}
          </div>

          <p className="rev mt-6 text-sm leading-relaxed text-mist-400">
            Aucun paiement en ligne, aucune carte à saisir. C&apos;est un appel téléphonique qui
            valide ton compte — et c&apos;est aussi l&apos;occasion de nous poser tes questions.
          </p>
        </div>
      </section>

      {/* ============================================================= FAQ */}
      <section data-rev-groupe className="border-t border-ink-800 px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-3xl">
          <h2 className="rev text-2xl font-medium tracking-[-0.02em] text-mist-100 sm:text-3xl">
            Questions fréquentes
          </h2>

          <div className="mt-8 space-y-2.5">
            {QUESTIONS.map((f) => (
              <details
                key={f.q}
                className="rev group rounded-[var(--r-lg)] border border-ink-800 bg-ink-900 px-5 py-4 transition hover:border-ink-700"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium text-mist-100 [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4 shrink-0 text-mist-400 transition group-open:rotate-45"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                  </svg>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-mist-300">{f.r}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ======================================================== CTA FINAL */}
      <section
        data-rev-groupe
        className="aurora-glow grain relative border-t border-ink-800 px-4 py-20 sm:px-6 sm:py-28"
      >
        <div className="relative z-10 mx-auto max-w-2xl text-center">
          <h2 className="rev text-2xl font-medium tracking-[-0.02em] text-mist-100 sm:text-3xl">
            Teste un produit avant d&apos;acheter le stock.
          </h2>
          <p className="rev mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-mist-300">
            Crée ton compte maintenant, on t&apos;appelle pour l&apos;activer.
          </p>
          <div className="rev mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/inscription"
              className="cta-aurora w-full rounded-full px-8 py-3.5 text-sm font-semibold sm:w-auto"
            >
              Créer mon compte
            </Link>
            <Link
              href="/analyser"
              className="w-full rounded-full border border-ink-600 px-8 py-3.5 text-sm font-medium text-mist-200 transition hover:border-brand-500/50 hover:text-brand-300 sm:w-auto"
            >
              Voir l&apos;outil
            </Link>
          </div>
        </div>
      </section>
    </Reveal>
  );
}
