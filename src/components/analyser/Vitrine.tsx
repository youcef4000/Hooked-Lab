"use client";

import Link from "next/link";
import { UploadDropzone } from "../UploadDropzone";
import { AnalyzeForm } from "../AnalyzeForm";
import { CarteVivante, Reveal } from "../Reveal";
import { SelecteurMarche } from "../Marche";
import { useLangue, useT } from "../Langue";
import { marche as trouverMarche } from "@/lib/marches";
import { locale } from "@/lib/langue";
import type { ReportSummary } from "@/types/analysis";

/* ============================================================================
   Page d'analyse, version visiteur.

   Ancrage : Framer. Densite aeree, grandes zones, rayons genereux, ombres
   teintees d'or, mouvement assume entre 250 et 400 ms.

   Quelqu'un arrive d'une publicite, ne connait pas le produit, et doit
   comprendre en dix secondes ce qu'il va recevoir. La page montre donc le
   livrable — de vrais chiffres, un vrai decoupage — plutot que de le
   decrire. Le rythme vertical varie volontairement d'une section a l'autre.
   ========================================================================== */

const TEXTES = {
  fr: {
    badge: "Pour les e-commerçants · 6 marchés",
    titre1: "Décortique n'importe quelle créative,",
    titre2: "et trouve le produit derrière.",
    intro:
      "Dépose une publicité qui tourne. Tu récupères le script, les angles qui font vendre, le fournisseur sur 1688, et la rentabilité calculée pour ton marché.",
    lien: "ou depuis un lien",
    puces: ["3 minutes par analyse", "Vidéos et images", "US · UK · Europe · Australie · Algérie"],
    etapesTitre: "Ce qui se passe pendant que tu attends",
    etapes: [
      { n: "01", titre: "Tu déposes", texte: "Une vidéo TikTok, un reel Instagram, une image publicitaire. Fichier ou lien.", detail: "mp4 · mov · webm · jpg · png — jusqu'à 95 Mo" },
      { n: "02", titre: "L'IA décortique", texte: "Audio transcrit, plans détectés, script reconstitué, angles de persuasion notés un par un.", detail: "environ 3 minutes" },
      { n: "03", titre: "Tu reçois le dossier", texte: "Produit identifié chez le fournisseur, rentabilité calculée pour ton marché, annonces prêtes.", detail: "sourcing · rentabilité · annonces Meta" },
    ],
    livrable: "Le livrable",
    livrableTitre: "Pas un résumé. Un dossier que tu peux exécuter.",
    livrableIntro: "Extraits d'un rapport réel, pour un support de téléphone de voiture vendu aux États-Unis.",
    renta: "Rentabilité",
    base: "sur 100 commandes",
    profitNet: "de profit net par commande",
    postes: [
      { poste: "Chiffre d'affaires encaissé", valeur: "+ $2,375", ton: "positif" },
      { poste: "Marchandise et port", valeur: "− $836", ton: "negatif" },
      { poste: "Remboursements (5 %)", valeur: "− $44", ton: "negatif" },
      { poste: "Publicité", valeur: "− $800", ton: "negatif" },
    ],
    hypotheses: "Chaque hypothèse est ajustable : prix, taxes à l'import, taux de remboursement, coût d'acquisition, production des créatives.",
    anglesTitre: "Angles notés sur 10",
    angles: [
      { nom: "Chauffeurs VTC", note: 9 },
      { nom: "Démonstration mains libres", note: 8 },
      { nom: "Sécurité au volant", note: 7 },
      { nom: "Cadeau utile", note: 6 },
    ],
    sourcingTitre: "Sourcing fournisseur",
    sourcingTexte:
      "Les requêtes sont écrites dans le chinois réel des fiches fournisseur, pas en traduction littérale — c'est ce qui fait la différence entre trouver et ne rien trouver.",
    exemples: "Exemples de dossiers",
    exemplesIntro: "Ouvre-en un : c'est exactement ce que tu recevras.",
    ctaTitre: "La prochaine créative que tu vois passer peut devenir ton produit gagnant.",
    ctaTexte: "Crée ton compte, choisis ta formule, et ta première analyse part dans la minute.",
    creer: "Créer mon compte",
    formules: "Voir les formules",
  },
  en: {
    badge: "For e-commerce sellers · 6 markets",
    titre1: "Break down any creative,",
    titre2: "and find the product behind it.",
    intro:
      "Drop an ad that's running. You get the script, the angles that sell, the supplier on 1688, and the profitability computed for your market.",
    lien: "or from a link",
    puces: ["3 minutes per analysis", "Videos and images", "US · UK · Europe · Australia · Algeria"],
    etapesTitre: "What happens while you wait",
    etapes: [
      { n: "01", titre: "You upload", texte: "A TikTok video, an Instagram reel, an image ad. File or link.", detail: "mp4 · mov · webm · jpg · png — up to 95 MB" },
      { n: "02", titre: "The AI breaks it down", texte: "Audio transcribed, shots detected, script rebuilt, persuasion angles scored one by one.", detail: "about 3 minutes" },
      { n: "03", titre: "You get the file", texte: "Product found at the supplier, profitability computed for your market, ads ready to run.", detail: "sourcing · profitability · Meta ads" },
    ],
    livrable: "The deliverable",
    livrableTitre: "Not a summary. A playbook you can execute.",
    livrableIntro: "Excerpts from a real report, for a car phone mount sold in the United States.",
    renta: "Profitability",
    base: "over 100 orders",
    profitNet: "net profit per order",
    postes: [
      { poste: "Revenue collected", valeur: "+ $2,375", ton: "positif" },
      { poste: "Goods and shipping", valeur: "− $836", ton: "negatif" },
      { poste: "Refunds (5%)", valeur: "− $44", ton: "negatif" },
      { poste: "Advertising", valeur: "− $800", ton: "negatif" },
    ],
    hypotheses: "Every assumption is adjustable: price, import taxes, refund rate, acquisition cost, creative production.",
    anglesTitre: "Angles scored out of 10",
    angles: [
      { nom: "Rideshare drivers", note: 9 },
      { nom: "Hands-free demo", note: 8 },
      { nom: "Safety behind the wheel", note: 7 },
      { nom: "Useful gift", note: 6 },
    ],
    sourcingTitre: "Supplier sourcing",
    sourcingTexte:
      "Queries are written in the real Chinese used on supplier listings, not literal translations — that's the difference between finding it and finding nothing.",
    exemples: "Sample reports",
    exemplesIntro: "Open one: it's exactly what you'll get.",
    ctaTitre: "The next creative you scroll past could be your next winning product.",
    ctaTexte: "Create your account, pick your plan, and your first analysis starts within a minute.",
    creer: "Create my account",
    formules: "See the plans",
  },
};

export function Vitrine({ recentes }: { recentes: ReportSummary[] }) {
  const t = useT(TEXTES);
  const langue = useLangue();

  return (
    <Reveal className="-mx-4 overflow-x-clip sm:-mx-5">
      {/* ============================================================ HERO */}
      <section data-rev-groupe className="aurora-glow grain relative px-4 pb-24 pt-14 sm:px-6 sm:pb-32 sm:pt-24">
        <div className="relative z-10 mx-auto max-w-6xl">
          <div className="rev mx-auto max-w-5xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/[0.07] px-4 py-1.5 text-xs text-brand-300">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-400" />
              {t.badge}
            </span>
            <h1 className="mt-6 text-[34px] font-medium leading-[1.08] tracking-[-0.03em] text-mist-100 sm:text-5xl lg:text-6xl">
              {t.titre1} <span className="text-gold-titre">{t.titre2}</span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-mist-200 sm:text-[17px]">{t.intro}</p>
          </div>

          {/* La zone de depot est le sujet de la page : mise en scene, pas releguee. */}
          <div className="rev mx-auto mt-10 max-w-2xl">
            <SelecteurMarche className="mb-4" />
            <div className="relative">
              <div aria-hidden className="pointer-events-none absolute -inset-6 rounded-[36px] bg-brand-500/[0.06] blur-2xl" />
              <div className="relative rounded-[var(--r-xl)] border border-ink-700 bg-ink-900/70 p-2 shadow-[var(--ombre-levee)] backdrop-blur">
                <UploadDropzone />
              </div>
            </div>

            <div className="mt-5">
              <div className="mb-3 flex items-center gap-3">
                <span className="h-px flex-1 bg-ink-800" />
                <span className="text-[11px] uppercase tracking-[0.14em] text-mist-500">{t.lien}</span>
                <span className="h-px flex-1 bg-ink-800" />
              </div>
              <AnalyzeForm />
            </div>
          </div>

          <ul className="rev mx-auto mt-8 flex max-w-2xl flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-mist-400">
            {t.puces.map((p) => (
              <li key={p} className="flex items-center gap-2">
                <span className="h-1 w-1 rounded-full bg-brand-500" />
                {p}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ====================================================== LES ETAPES */}
      <section data-rev-groupe className="border-t border-ink-800 px-4 py-14 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="rev max-w-lg text-2xl font-medium tracking-[-0.02em] text-mist-100 sm:text-3xl">{t.etapesTitre}</h2>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {t.etapes.map((e) => (
              <div key={e.n} className="rev">
                <CarteVivante className="h-full p-6">
                  <span className="font-display text-3xl font-medium text-brand-500/40">{e.n}</span>
                  <h3 className="mt-4 text-base font-medium text-mist-100">{e.titre}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-mist-300">{e.texte}</p>
                  <p className="mt-4 border-t border-ink-800 pt-3 text-xs text-mist-500">{e.detail}</p>
                </CarteVivante>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================ LE LIVRABLE REEL */}
      <section data-rev-groupe className="relative border-t border-ink-800 bg-ink-900/30 px-4 py-20 sm:px-6 sm:py-36">
        <div className="mx-auto max-w-6xl">
          <div className="rev max-w-xl">
            <span className="text-[11px] uppercase tracking-[0.14em] text-brand-400">{t.livrable}</span>
            <h2 className="mt-3 text-2xl font-medium tracking-[-0.02em] text-mist-100 sm:text-3xl">{t.livrableTitre}</h2>
            <p className="mt-3 text-[15px] leading-relaxed text-mist-300">{t.livrableIntro}</p>
          </div>

          <div className="mt-10 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
            <div className="rev">
              <CarteVivante className="h-full p-6 sm:p-7">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="text-sm font-medium text-mist-100">{t.renta} 🇺🇸</h3>
                  <span className="text-[11px] text-mist-500">{t.base}</span>
                </div>
                <p className="mt-5 font-display text-4xl font-medium tracking-tight text-jade sm:text-5xl">+ $4.25</p>
                <p className="mt-1 text-xs text-mist-400">{t.profitNet}</p>
                <dl className="mt-6 space-y-2.5 border-t border-ink-800 pt-5">
                  {t.postes.map((l) => (
                    <div key={l.poste} className="flex items-baseline justify-between gap-4">
                      <dt className="text-sm text-mist-300">{l.poste}</dt>
                      <dd className={`shrink-0 text-sm tabular-nums ${l.ton === "positif" ? "text-jade" : "text-rose-warn"}`}>{l.valeur}</dd>
                    </div>
                  ))}
                </dl>
                <p className="mt-5 rounded-[var(--r-sm)] bg-ink-950/60 px-3.5 py-2.5 text-xs leading-relaxed text-mist-400">{t.hypotheses}</p>
              </CarteVivante>
            </div>

            <div className="grid gap-4">
              <div className="rev">
                <CarteVivante className="p-6">
                  <h3 className="text-sm font-medium text-mist-100">{t.anglesTitre}</h3>
                  <ul className="mt-4 space-y-3">
                    {t.angles.map((a) => (
                      <li key={a.nom}>
                        <div className="flex items-baseline justify-between gap-3">
                          <span className="text-sm text-mist-200">{a.nom}</span>
                          <span className="text-sm tabular-nums text-brand-300">{a.note}</span>
                        </div>
                        <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-ink-800">
                          <div className="h-full rounded-full bg-brand-500/70" style={{ width: `${a.note * 10}%` }} />
                        </div>
                      </li>
                    ))}
                  </ul>
                </CarteVivante>
              </div>

              <div className="rev">
                <CarteVivante className="p-6">
                  <h3 className="text-sm font-medium text-mist-100">{t.sourcingTitre}</h3>
                  <p className="mt-3 font-mono text-xs leading-relaxed text-brand-300">车载手机支架 无线充电 · 自动感应</p>
                  <p className="mt-2 text-sm leading-relaxed text-mist-300">{t.sourcingTexte}</p>
                  <p className="mt-4 border-t border-ink-800 pt-3 text-xs text-mist-500">1688 · Alibaba · {langue === "fr" ? "recherche par image" : "image search"}</p>
                </CarteVivante>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================ EXEMPLES PUBLICS */}
      {recentes.length > 0 && (
        <section data-rev-groupe className="border-t border-ink-800 px-4 py-14 sm:px-6 sm:py-16">
          <div className="mx-auto max-w-6xl">
            <div className="rev flex flex-wrap items-end justify-between gap-3">
              <h2 className="text-2xl font-medium tracking-[-0.02em] text-mist-100">{t.exemples}</h2>
              <p className="text-sm text-mist-400">{t.exemplesIntro}</p>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {recentes.slice(0, 4).map((a) => (
                <Link key={a.id} href={`/analyse/${a.id}`} className="rev block">
                  <CarteVivante className="h-full overflow-hidden">
                    <div className="relative aspect-[4/5] overflow-hidden bg-ink-950">
                      {a.miniature && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={`/api/media/${a.id}/${a.miniature}`} alt="" className="h-full w-full object-cover transition duration-300 hover:scale-[1.03]" />
                      )}
                      <span className="absolute left-2.5 top-2.5 rounded-full bg-ink-950/85 px-2 py-0.5 text-[11px] font-medium text-brand-300 backdrop-blur">
                        {a.score}/100 {trouverMarche(a.marche).drapeau}
                      </span>
                    </div>
                    <div className="p-3.5">
                      <p className="line-clamp-2 text-sm leading-snug text-mist-100">{a.produit}</p>
                      <p className="mt-1.5 text-[11px] text-mist-500">{new Date(a.createdAt).toLocaleDateString(locale(langue))}</p>
                    </div>
                  </CarteVivante>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ======================================================== CTA FINAL */}
      <section data-rev-groupe className="aurora-glow grain relative border-t border-ink-800 px-4 py-20 sm:px-6 sm:py-32">
        <div className="relative z-10 mx-auto max-w-2xl text-center">
          <h2 className="rev text-2xl font-medium tracking-[-0.02em] text-mist-100 sm:text-3xl">{t.ctaTitre}</h2>
          <p className="rev mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-mist-300">{t.ctaTexte}</p>
          <div className="rev mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/inscription" className="cta-aurora w-full rounded-full px-8 py-3.5 text-sm font-semibold sm:w-auto">
              {t.creer}
            </Link>
            <Link
              href="/tarifs"
              className="w-full rounded-full border border-ink-600 px-8 py-3.5 text-sm font-medium text-mist-200 transition hover:border-brand-500/50 hover:text-brand-300 sm:w-auto"
            >
              {t.formules}
            </Link>
          </div>
        </div>
      </section>
    </Reveal>
  );
}
