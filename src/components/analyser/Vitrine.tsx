"use client";

import Link from "next/link";
import { UploadDropzone } from "../UploadDropzone";
import { AnalyzeForm } from "../AnalyzeForm";
import { CarteVivante, Reveal } from "../Reveal";
import type { ReportSummary } from "@/types/analysis";

/* ============================================================================
   Page d'analyse, version visiteur.

   Ancrage : Framer. Densite aeree, grandes zones, rayons genereux, ombres
   teintees d'or, mouvement assume entre 250 et 400 ms.

   Cette page a un travail precis : quelqu'un arrive d'une publicite, ne
   connait pas le produit, et doit comprendre en dix secondes ce qu'il va
   recevoir. Elle montre donc le livrable — de vrais chiffres, un vrai
   decoupage — plutot que de le decrire.

   Le rythme vertical varie volontairement d'une section a l'autre : une
   page dont toutes les sections font la meme hauteur se lit comme un
   formulaire administratif.
   ========================================================================== */

/** Etapes du traitement, avec ce que chacune produit reellement. */
const ETAPES = [
  {
    n: "01",
    titre: "Tu déposes",
    texte: "Une vidéo TikTok, un reel Instagram, une image publicitaire. Fichier ou lien.",
    detail: "mp4 · mov · webm · jpg · png — jusqu'à 300 Mo",
  },
  {
    n: "02",
    titre: "L'IA décortique",
    texte:
      "Audio transcrit, plans détectés, script reconstitué, angles de persuasion notés un par un.",
    detail: "environ 3 minutes",
  },
  {
    n: "03",
    titre: "Tu reçois le dossier",
    texte:
      "Produit identifié chez le fournisseur, rentabilité calculée au taux de livraison réel, annonces prêtes.",
    detail: "sourcing · COD · darija · Meta",
  },
];

/** Extrait d'un vrai rapport : ce sont les valeurs que produit le calculateur. */
const EXTRAIT_COD = [
  { poste: "Chiffre d'affaires encaissé", valeur: "+ 747 500 DA", ton: "positif" },
  { poste: "Marchandise", valeur: "− 231 660 DA", ton: "negatif" },
  { poste: "Livraison et retours", valeur: "− 49 625 DA", ton: "negatif" },
  { poste: "Publicité (134 prospects)", valeur: "− 70 000 DA", ton: "negatif" },
];

const ANGLES = [
  { nom: "Hook choc", note: 8 },
  { nom: "Problème / solution", note: 7 },
  { nom: "Preuve en démonstration", note: 9 },
  { nom: "Urgence stock limité", note: 6 },
];

export function Vitrine({ recentes }: { recentes: ReportSummary[] }) {
  return (
    <Reveal className="-mx-4 overflow-x-clip sm:-mx-5">
      {/* ============================================================ HERO */}
      <section
        data-rev-groupe
        className="aurora-glow grain relative px-4 pb-24 pt-14 sm:px-6 sm:pb-32 sm:pt-24"
      >
        <div className="relative z-10 mx-auto max-w-6xl">
          <div className="rev mx-auto max-w-5xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/[0.07] px-4 py-1.5 text-xs text-brand-300">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-400" />
              Pour les e-commerçants algériens
            </span>

            <h1 className="mt-6 text-[34px] font-medium leading-[1.08] tracking-[-0.03em] text-mist-100 sm:text-5xl lg:text-6xl">
              Décortique n&apos;importe quelle créative,{" "}
              <span className="text-gold-titre">et trouve le produit derrière.</span>
            </h1>

            <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-mist-200 sm:text-[17px]">
              Dépose une publicité qui tourne. Tu récupères le script, les angles qui font vendre,
              le fournisseur sur 1688, et le calcul de rentabilité au taux de livraison algérien.
            </p>
          </div>

          {/* La zone de depot est le sujet de la page : elle est mise en
              scene, encadree d'un halo, et non reléguee en bas. */}
          <div className="rev mx-auto mt-10 max-w-2xl">
            <div className="relative">
              <div
                aria-hidden
                className="pointer-events-none absolute -inset-6 rounded-[36px] bg-brand-500/[0.06] blur-2xl"
              />
              <div className="relative rounded-[var(--r-xl)] border border-ink-700 bg-ink-900/70 p-2 shadow-[var(--ombre-levee)] backdrop-blur">
                <UploadDropzone />
              </div>
            </div>

            <div className="mt-5">
              <div className="mb-3 flex items-center gap-3">
                <span className="h-px flex-1 bg-ink-800" />
                <span className="text-[11px] uppercase tracking-[0.14em] text-mist-500">
                  ou depuis un lien
                </span>
                <span className="h-px flex-1 bg-ink-800" />
              </div>
              <AnalyzeForm />
            </div>
          </div>

          <div className="rev mx-auto mt-8 flex max-w-2xl flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-mist-400">
            <span>3 minutes par analyse</span>
            <span className="h-3 w-px bg-ink-700" />
            <span>Vidéos et images</span>
            <span className="h-3 w-px bg-ink-700" />
            <span>58 wilayas dans le calcul</span>
          </div>
        </div>
      </section>

      {/* ====================================================== LES ETAPES */}
      <section data-rev-groupe className="border-t border-ink-800 px-4 py-14 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="rev max-w-lg text-2xl font-medium tracking-[-0.02em] text-mist-100 sm:text-3xl">
            Ce qui se passe pendant que tu attends
          </h2>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {ETAPES.map((e) => (
              <div key={e.n} className="rev">
                <CarteVivante className="h-full p-6">
                  <span className="font-display text-3xl font-medium text-brand-500/40">{e.n}</span>
                  <h3 className="mt-4 text-base font-medium text-mist-100">{e.titre}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-mist-300">{e.texte}</p>
                  <p className="mt-4 border-t border-ink-800 pt-3 text-xs text-mist-500">
                    {e.detail}
                  </p>
                </CarteVivante>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================ LE LIVRABLE REEL */}
      {/* Section volontairement plus dense et plus haute : c'est la preuve,
          elle doit peser plus lourd que le reste. */}
      <section
        data-rev-groupe
        className="relative border-t border-ink-800 bg-ink-900/30 px-4 py-20 sm:px-6 sm:py-36"
      >
        <div className="mx-auto max-w-6xl">
          <div className="rev max-w-xl">
            <span className="text-[11px] uppercase tracking-[0.14em] text-brand-400">
              Le livrable
            </span>
            <h2 className="mt-3 text-2xl font-medium tracking-[-0.02em] text-mist-100 sm:text-3xl">
              Pas un résumé. Un dossier que tu peux exécuter.
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-mist-300">
              Voici des extraits réels d&apos;un rapport, sur une créative de caméra de
              surveillance.
            </p>
          </div>

          {/* Hierarchie : un bloc large et dominant, deux plus petits. Une
              grille de trois cartes egales ne dit rien de ce qui compte. */}
          <div className="mt-10 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
            <div className="rev">
              <CarteVivante className="h-full p-6 sm:p-7">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="text-sm font-medium text-mist-100">Rentabilité COD</h3>
                  <span className="text-[11px] text-mist-500">sur 100 commandes confirmées</span>
                </div>

                <p className="mt-5 font-display text-4xl font-medium tracking-tight text-jade sm:text-5xl">
                  + 1 240 DA
                </p>
                <p className="mt-1 text-xs text-mist-400">de profit net par commande livrée</p>

                <dl className="mt-6 space-y-2.5 border-t border-ink-800 pt-5">
                  {EXTRAIT_COD.map((l) => (
                    <div key={l.poste} className="flex items-baseline justify-between gap-4">
                      <dt className="text-sm text-mist-300">{l.poste}</dt>
                      <dd
                        className={`shrink-0 text-sm tabular-nums ${
                          l.ton === "positif" ? "text-jade" : "text-rose-warn"
                        }`}
                      >
                        {l.valeur}
                      </dd>
                    </div>
                  ))}
                </dl>

                <p className="mt-5 rounded-[var(--r-sm)] bg-ink-950/60 px-3.5 py-2.5 text-xs leading-relaxed text-mist-400">
                  Chaque hypothèse est ajustable : taux de confirmation, taux de livraison, coût des
                  retours, douane, casse, production des créatives.
                </p>
              </CarteVivante>
            </div>

            <div className="grid gap-4">
              <div className="rev">
                <CarteVivante className="p-6">
                  <h3 className="text-sm font-medium text-mist-100">Angles notés sur 10</h3>
                  <ul className="mt-4 space-y-3">
                    {ANGLES.map((a) => (
                      <li key={a.nom}>
                        <div className="flex items-baseline justify-between gap-3">
                          <span className="text-sm text-mist-200">{a.nom}</span>
                          <span className="text-sm tabular-nums text-brand-300">{a.note}</span>
                        </div>
                        <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-ink-800">
                          <div
                            className="h-full rounded-full bg-brand-500/70"
                            style={{ width: `${a.note * 10}%` }}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                </CarteVivante>
              </div>

              <div className="rev">
                <CarteVivante className="p-6">
                  <h3 className="text-sm font-medium text-mist-100">Sourcing fournisseur</h3>
                  <p className="mt-3 font-mono text-xs leading-relaxed text-brand-300">
                    视频信号发生器 · HDMI测试仪
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-mist-300">
                    Les requêtes sont traduites dans le chinois réel des fiches fournisseur, pas en
                    traduction littérale — c&apos;est ce qui fait la différence entre trouver et ne
                    rien trouver.
                  </p>
                  <p className="mt-4 border-t border-ink-800 pt-3 text-xs text-mist-500">
                    1688 · Alibaba · recherche par image
                  </p>
                </CarteVivante>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================ ANALYSES RECENTES */}
      {recentes.length > 0 && (
        <section data-rev-groupe className="border-t border-ink-800 px-4 py-14 sm:px-6 sm:py-16">
          <div className="mx-auto max-w-6xl">
            <div className="rev flex flex-wrap items-end justify-between gap-3">
              <h2 className="text-2xl font-medium tracking-[-0.02em] text-mist-100">
                Exemples de dossiers
              </h2>
              <p className="text-sm text-mist-400">Ouvre-en un : c&apos;est exactement ce que tu recevras.</p>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {recentes.slice(0, 4).map((a) => (
                <Link key={a.id} href={`/analyse/${a.id}`} className="rev block">
                  <CarteVivante className="h-full overflow-hidden">
                    <div className="relative aspect-[4/5] overflow-hidden bg-ink-950">
                      {a.miniature && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={`/api/media/${a.id}/${a.miniature}`}
                          alt=""
                          className="h-full w-full object-cover transition duration-300 hover:scale-[1.03]"
                        />
                      )}
                      <span className="absolute left-2.5 top-2.5 rounded-full bg-ink-950/85 px-2 py-0.5 text-[11px] font-medium text-brand-300 backdrop-blur">
                        {a.score}/100
                      </span>
                    </div>
                    <div className="p-3.5">
                      <p className="line-clamp-2 text-sm leading-snug text-mist-100">{a.produit}</p>
                      <p className="mt-1.5 text-[11px] text-mist-500">
                        {new Date(a.createdAt).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                  </CarteVivante>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ======================================================== CTA FINAL */}
      <section
        data-rev-groupe
        className="aurora-glow grain relative border-t border-ink-800 px-4 py-20 sm:px-6 sm:py-32"
      >
        <div className="relative z-10 mx-auto max-w-2xl text-center">
          <h2 className="rev text-2xl font-medium tracking-[-0.02em] text-mist-100 sm:text-3xl">
            La prochaine créative que tu vois passer peut devenir ton produit gagnant.
          </h2>
          <p className="rev mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-mist-300">
            Crée ton compte, on t&apos;appelle pour l&apos;activer, et tu lances ta première analyse
            dans la foulée.
          </p>
          <div className="rev mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/inscription"
              className="cta-aurora w-full rounded-full px-8 py-3.5 text-sm font-semibold sm:w-auto"
            >
              Créer mon compte
            </Link>
            <Link
              href="/tarifs"
              className="w-full rounded-full border border-ink-600 px-8 py-3.5 text-sm font-medium text-mist-200 transition hover:border-brand-500/50 hover:text-brand-300 sm:w-auto"
            >
              Voir les formules
            </Link>
          </div>
        </div>
      </section>
    </Reveal>
  );
}
