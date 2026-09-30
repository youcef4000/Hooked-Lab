"use client";

import Link from "next/link";
import { CarteVivante, Reveal } from "../Reveal";
import { useT } from "../Langue";
import { GrilleTarifs } from "./Grille";

/* ============================================================================
   Page tarifs.

   Meme registre que la vitrine : densite aeree, rayons genereux, revelation
   au scroll. Trois temps : le prix (grille partagee avec l'accueil), le
   paiement explique en clair, puis les questions qui retiennent l'achat.
   ========================================================================== */

const TEXTES = {
  fr: {
    titre1: "Une analyse coûte moins cher",
    titre2: "qu'un test raté.",
    intro: "Et bien moins cher qu'un stock de 300 pièces d'un produit qui ne se vendra jamais.",
    paiementCarte: "Paiement par carte, crédits ajoutés à la seconde.",
    etapesTitre: "De l'inscription à la première analyse",
    etapes: [
          { t: "Crée ton compte", d: "Nom, email, mot de passe. Une minute." },
          { t: "Choisis ta formule", d: "Mensuelle sans engagement, ou annuelle 20 % moins chère." },
          { t: "Paie en 30 secondes", d: "Visa, Mastercard, Apple Pay ou Google Pay, sur une page sécurisée par Stripe." },
          { t: "Analyse", d: "Ton accès s'ouvre à la seconde. Colle ta première créative." },
        ],
    etapesNote: "Aucun numéro de carte ne passe par Hooked Lab : le paiement est entièrement géré par Stripe.",
    faqTitre: "Questions fréquentes",
    questions: [
      {
        q: "Que se passe-t-il si une analyse échoue ?",
        r: "Les crédits sont rendus automatiquement. Une vidéo que la plateforme refuse de laisser télécharger, une panne de notre côté, un fichier illisible : tu ne paies rien.",
      },
      {
        q: "Mes crédits non utilisés sont-ils perdus à la fin du mois ?",
        r: "Non. Ils restent sur ton compte tant que ton abonnement court. Si tu renouvelles avant l'échéance, les jours restants s'ajoutent à la nouvelle période.",
      },
      {
        q: "Une vidéo longue coûte-t-elle plus cher ?",
        r: "Non. Une vidéo coûte 3 crédits quelle que soit sa durée (les 3 premières minutes sont analysées), une image 2 crédits. Tu sais toujours ce que tu dépenses avant de lancer.",
      },
      {
        q: "Quels marchés sont couverts ?",
        r: "États-Unis, Royaume-Uni, France et Belgique, reste de l'Europe, Australie et Algérie. Tu choisis le marché à chaque analyse : prix, devise, paiement, langue des annonces et réglementation s'adaptent.",
      },
      {
        q: "Puis-je changer de formule ?",
        r: "Oui. Prends une recharge si tu manques de crédits ce mois-ci, ou passe à la formule supérieure à l'échéance.",
      },
      {
        q: "Y a-t-il une version gratuite ?",
        r: "Non : chaque analyse a un coût réel, et une offre gratuite serait vidée par des comptes jetables. En échange, aucun engagement caché — la formule mensuelle s'arrête quand tu veux, et tu peux parcourir un rapport d'exemple sans compte.",
      },
    ],
    ctaTitre: "Teste un produit avant d'acheter le stock.",
    ctaTexte: "Crée ton compte, paie, et ta première analyse part dans la minute.",
    creer: "Créer mon compte",
    outil: "Voir un exemple",
  },
  en: {
    titre1: "An analysis costs less",
    titre2: "than a failed test.",
    intro: "And far less than a stock of 300 units of a product that will never sell.",
    paiementCarte: "Card payment, credits added instantly.",
    etapesTitre: "From sign-up to your first analysis",
    etapes: [
          { t: "Create your account", d: "Name, email, password. One minute." },
          { t: "Pick your plan", d: "Monthly with no commitment, or yearly and 20% cheaper." },
          { t: "Pay in 30 seconds", d: "Visa, Mastercard, Apple Pay or Google Pay, on a page secured by Stripe." },
          { t: "Analyse", d: "Access opens instantly. Paste your first creative." },
        ],
    etapesNote: "No card number ever goes through Hooked Lab: payment is fully handled by Stripe.",
    faqTitre: "Frequently asked questions",
    questions: [
      {
        q: "What happens if an analysis fails?",
        r: "Credits are refunded automatically. A video the platform won't let us download, an outage on our side, an unreadable file: you pay nothing.",
      },
      {
        q: "Do unused credits expire at the end of the month?",
        r: "No. They stay on your account as long as your subscription runs. Renew early and the remaining days are added to the new period.",
      },
      {
        q: "Does a longer video cost more?",
        r: "No. A video costs 3 credits whatever its length (the first 3 minutes are analysed), an image 2 credits. You always know the cost before you start.",
      },
      {
        q: "Which markets are covered?",
        r: "United States, United Kingdom, France & Belgium, the rest of Europe, Australia and Algeria. You pick the market for each analysis: prices, currency, payment model, ad language and regulations adapt.",
      },
      {
        q: "Can I change plans?",
        r: "Yes. Grab a top-up if you run short this month, or move up a plan at renewal.",
      },
      {
        q: "Is there a free plan?",
        r: "No: every analysis has a real cost, and a free plan would be drained by throwaway accounts. In return, no hidden commitment — the monthly plan stops whenever you want, and you can browse a sample report without an account.",
      },
    ],
    ctaTitre: "Test a product before you buy the stock.",
    ctaTexte: "Create your account, pay, and your first analysis starts within a minute.",
    creer: "Create my account",
    outil: "See a sample",
  },
};

export function PageTarifs() {
  const t = useT(TEXTES);

  return (
    <Reveal className="-mx-4 overflow-x-clip sm:-mx-5">
      {/* ============================================================ HERO */}
      <section data-rev-groupe className="aurora-glow grain relative px-4 pb-12 pt-14 sm:px-6 sm:pb-16 sm:pt-24">
        <div className="relative z-10 mx-auto max-w-5xl text-center">
          <h1 className="rev text-[32px] font-medium leading-[1.1] tracking-[-0.03em] text-mist-100 sm:text-5xl">
            {t.titre1} <span className="text-gold-titre">{t.titre2}</span>
          </h1>
          <p className="rev mx-auto mt-6 max-w-xl text-base leading-relaxed text-mist-200 sm:text-[17px]">
            {t.intro} {t.paiementCarte}
          </p>
        </div>
      </section>

      {/* ========================================================= GRILLE */}
      <section data-rev-groupe className="px-4 pb-20 sm:px-6 sm:pb-28">
        <div className="mx-auto max-w-6xl">
          <GrilleTarifs classeReveal="rev" />
        </div>
      </section>

      {/* ======================================================== PAIEMENT */}
      <section data-rev-groupe className="border-t border-ink-800 bg-ink-900/30 px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="rev max-w-lg text-2xl font-medium tracking-[-0.02em] text-mist-100 sm:text-3xl">
            {t.etapesTitre}
          </h2>
          <div className="mt-9 grid gap-4 md:grid-cols-4">
            {t.etapes.map((e, i) => (
              <div key={e.t} className="rev">
                <CarteVivante className="h-full p-5">
                  <span className="font-display text-2xl font-medium text-brand-500/40">0{i + 1}</span>
                  <h3 className="mt-3 text-sm font-medium text-mist-100">{e.t}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-mist-300">{e.d}</p>
                </CarteVivante>
              </div>
            ))}
          </div>
          <p className="rev mt-6 text-sm leading-relaxed text-mist-400">{t.etapesNote}</p>
        </div>
      </section>

      {/* ============================================================= FAQ */}
      <section data-rev-groupe className="border-t border-ink-800 px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-3xl">
          <h2 className="rev text-2xl font-medium tracking-[-0.02em] text-mist-100 sm:text-3xl">{t.faqTitre}</h2>
          <div className="mt-8 space-y-2.5">
            {t.questions.map((f) => (
              <details
                key={f.q}
                className="rev group rounded-[var(--r-lg)] border border-ink-800 bg-ink-900 px-5 py-4 transition hover:border-ink-700"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium text-mist-100 [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-mist-400 transition group-open:rotate-45" fill="none" stroke="currentColor" strokeWidth="2">
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
      <section data-rev-groupe className="aurora-glow grain relative border-t border-ink-800 px-4 py-20 sm:px-6 sm:py-28">
        <div className="relative z-10 mx-auto max-w-2xl text-center">
          <h2 className="rev text-2xl font-medium tracking-[-0.02em] text-mist-100 sm:text-3xl">{t.ctaTitre}</h2>
          <p className="rev mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-mist-300">{t.ctaTexte}</p>
          <div className="rev mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/inscription" className="cta-aurora w-full rounded-full px-8 py-3.5 text-sm font-semibold sm:w-auto">
              {t.creer}
            </Link>
            <Link
              href="/analyser"
              className="w-full rounded-full border border-ink-600 px-8 py-3.5 text-sm font-medium text-mist-200 transition hover:border-brand-500/50 hover:text-brand-300 sm:w-auto"
            >
              {t.outil}
            </Link>
          </div>
        </div>
      </section>
    </Reveal>
  );
}
