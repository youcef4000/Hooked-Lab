"use client";

import { CarteVivante } from "../Reveal";
import { useT } from "../Langue";

/* ============================================================================
   Sections de persuasion de l'accueil.

   « Pour qui » : le visiteur doit se reconnaitre en trois secondes, sinon il
   repart. « Avant / apres » : le vrai produit vendu, c'est du temps — on le
   chiffre, ligne par ligne, sur les taches qu'il fait deja a la main.
   ========================================================================== */

const ICONES = {
  colis: "M3 7l9-4 9 4-9 4-9-4zm0 0v10l9 4 9-4V7M12 11v10",
  marque: "M4 7h16M6 7V5h12v2M5 7l1.5 12h11L19 7M9 11h6",
  cible: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zm0-5a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm0-3a1 1 0 1 0 0-2 1 1 0 0 0 0 2z",
  camion: "M3 6h11v9H3zM14 9h4l3 3v3h-7M7 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm10 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
};

const TEXTES_QUI = {
  fr: {
    titre: "Fait pour ceux qui testent vite",
    sousTitre: "Une créative repérée le matin, un produit commandé le soir.",
    profils: [
      { icone: ICONES.colis, titre: "Dropshippers", texte: "Tu repères une pub qui cartonne : en 3 minutes tu sais quoi commander, à quel fournisseur et à quel prix vendre." },
      { icone: ICONES.marque, titre: "Marques e-commerce", texte: "Décortique les créatives de tes concurrents : leurs angles, leurs hooks, et ce qu'ils n'exploitent pas encore." },
      { icone: ICONES.cible, titre: "Media buyers et agences", texte: "Des scripts, des annonces Meta et leur variante B prêts pour chaque client, sur le marché de chaque client." },
      { icone: ICONES.camion, titre: "Vendeurs COD", texte: "Algérie : taux de livraison, retours, stop desk et darija intégrés au calcul et aux annonces." },
    ],
  },
  en: {
    titre: "Built for people who test fast",
    sousTitre: "Spot a creative in the morning, order the product by evening.",
    profils: [
      { icone: ICONES.colis, titre: "Dropshippers", texte: "Spot an ad that's crushing it: in 3 minutes you know what to order, from which supplier, and at what price to sell." },
      { icone: ICONES.marque, titre: "E-commerce brands", texte: "Reverse-engineer your competitors' creatives: their angles, their hooks, and what they aren't using yet." },
      { icone: ICONES.cible, titre: "Media buyers & agencies", texte: "Scripts, Meta ads and their variant B, ready for every client, in every client's market." },
      { icone: ICONES.camion, titre: "COD sellers", texte: "Algeria: delivery rates, returns, pick-up points and darija built into the numbers and the ads." },
    ],
  },
};

export function PourQui() {
  const t = useT(TEXTES_QUI);
  return (
    <section className="border-b border-ink-800 px-5 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <h2 className="st-titre text-3xl font-medium tracking-[-0.02em] text-mist-100 sm:text-4xl">
            {t.titre.split(" ").map((m, i) => (
              <span key={i} className="st-mot inline-block">
                {m}&nbsp;
              </span>
            ))}
          </h2>
          <p className="st-reveal mt-3 text-sm font-light text-mist-300 sm:text-base">{t.sousTitre}</p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {t.profils.map((p) => (
            <div key={p.titre} className="st-reveal">
              <CarteVivante className="h-full p-6">
                <span className="grid h-10 w-10 place-items-center rounded-[var(--r-sm)] border border-brand-500/25 bg-brand-500/[0.08] text-brand-300">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                    <path d={p.icone} />
                  </svg>
                </span>
                <h3 className="mt-4 text-base font-medium text-mist-100">{p.titre}</h3>
                <p className="mt-2 text-sm font-light leading-relaxed text-mist-300">{p.texte}</p>
              </CarteVivante>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const TEXTES_AVANT = {
  fr: {
    titre: "Trois heures de recherche, ou trois minutes",
    sans: "À la main",
    avec: "Avec Hooked Lab",
    lignes: [
      { tache: "Retranscrire le script", sans: "Pause, retour, recopie : 30 min", avec: "Extrait et chronométré, plan par plan" },
      { tache: "Comprendre pourquoi ça vend", sans: "À l'intuition", avec: "Angles notés sur 10, hook analysé" },
      { tache: "Trouver le fournisseur", sans: "1 h sur 1688 avec un traducteur", avec: "Requêtes en vrai chinois, liens directs" },
      { tache: "Savoir si c'est rentable", sans: "Un tableur approximatif", avec: "Calcul au modèle de ton marché, CPA max" },
      { tache: "Écrire les annonces", sans: "Page blanche", avec: "Annonces Meta prêtes, variante B incluse" },
    ],
    total: "Temps total",
    totalSans: "≈ 3 heures",
    totalAvec: "≈ 3 minutes",
  },
  en: {
    titre: "Three hours of research, or three minutes",
    sans: "By hand",
    avec: "With Hooked Lab",
    lignes: [
      { tache: "Transcribe the script", sans: "Pause, rewind, type: 30 min", avec: "Extracted and timed, shot by shot" },
      { tache: "Understand why it sells", sans: "Gut feeling", avec: "Angles scored out of 10, hook analysed" },
      { tache: "Find the supplier", sans: "1 h on 1688 with a translator", avec: "Real Chinese queries, direct links" },
      { tache: "Know if it's profitable", sans: "A rough spreadsheet", avec: "Your market's cost model, max CPA" },
      { tache: "Write the ads", sans: "Blank page", avec: "Meta ads ready, variant B included" },
    ],
    total: "Total time",
    totalSans: "≈ 3 hours",
    totalAvec: "≈ 3 minutes",
  },
};

export function AvantApres() {
  const t = useT(TEXTES_AVANT);
  return (
    <section className="border-b border-ink-800 bg-ink-900/30 px-5 py-20 sm:py-28">
      <div className="mx-auto max-w-5xl">
        <h2 className="st-titre text-center text-3xl font-medium tracking-[-0.02em] text-mist-100 sm:text-4xl">
          {t.titre.split(" ").map((m, i) => (
            <span key={i} className="st-mot inline-block">
              {m}&nbsp;
            </span>
          ))}
        </h2>

        <div className="st-reveal mt-10 overflow-hidden rounded-[var(--r-xl)] border border-ink-700 bg-ink-900">
          <div className="grid grid-cols-[1fr_1fr] border-b border-ink-800 text-xs font-semibold uppercase tracking-wide sm:grid-cols-[1.1fr_1fr_1fr]">
            <span className="hidden px-5 py-3.5 text-mist-500 sm:block" />
            <span className="px-4 py-3.5 text-mist-500 sm:px-5">{t.sans}</span>
            <span className="bg-brand-500/[0.07] px-4 py-3.5 text-brand-300 sm:px-5">{t.avec}</span>
          </div>
          {t.lignes.map((l) => (
            <div key={l.tache} className="grid grid-cols-[1fr_1fr] border-b border-ink-800/70 last:border-0 sm:grid-cols-[1.1fr_1fr_1fr]">
              <p className="col-span-2 px-4 pb-1 pt-3.5 text-sm font-medium text-mist-100 sm:col-span-1 sm:px-5 sm:py-4">{l.tache}</p>
              <p className="flex items-start gap-2 px-4 py-3 text-sm text-mist-400 sm:px-5 sm:py-4">
                <span className="mt-0.5 text-rose-warn">✕</span>
                {l.sans}
              </p>
              <p className="flex items-start gap-2 bg-brand-500/[0.07] px-4 py-3 text-sm text-mist-100 sm:px-5 sm:py-4">
                <span className="mt-0.5 text-jade">✓</span>
                {l.avec}
              </p>
            </div>
          ))}
          <div className="grid grid-cols-[1fr_1fr] border-t border-ink-700 sm:grid-cols-[1.1fr_1fr_1fr]">
            <p className="col-span-2 px-4 pb-1 pt-4 text-sm font-semibold text-mist-100 sm:col-span-1 sm:px-5 sm:py-5">{t.total}</p>
            <p className="px-4 py-4 text-lg font-semibold text-mist-400 line-through decoration-rose-warn/60 sm:px-5 sm:py-5">{t.totalSans}</p>
            <p className="bg-brand-500/[0.07] px-4 py-4 text-lg font-semibold text-gold sm:px-5 sm:py-5">{t.totalAvec}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
