"use client";

import Link from "next/link";
import { useT } from "../Langue";
import { GrilleTarifs } from "../tarifs/Grille";
import { CARTE_ACTIVE } from "@/lib/public";

/* ============================================================================
   Section tarifs de l'accueil : la grille partagee, un titre, et la reponse
   a la question qui bloque le plus d'achats — comment on paie.
   ========================================================================== */

const TEXTES = {
  fr: {
    titre: "Une analyse coûte moins cher qu'un test raté",
    sousTitre:
      "Et bien moins cher que 300 pièces d'un produit qui ne se vendra jamais. Sans engagement : tu arrêtes quand tu veux.",
    paiementCarte: "Paiement sécurisé par carte : Visa, Mastercard, Apple Pay, RedotPay. Crédits ajoutés à la seconde.",
    paiementManuel: "Activation par WhatsApp après ton paiement : on te répond dans l'heure.",
    details: "Tous les détails",
  },
  en: {
    titre: "An analysis costs less than a failed test",
    sousTitre:
      "And far less than 300 units of a product that will never sell. No commitment: cancel whenever you want.",
    paiementCarte: "Secure card payment: Visa, Mastercard, Apple Pay, RedotPay. Credits added instantly.",
    paiementManuel: "Activation via WhatsApp after payment: we reply within the hour.",
    details: "All the details",
  },
};

export function Tarifs() {
  const t = useT(TEXTES);
  return (
    <section id="tarifs" className="scroll-mt-20 border-b border-ink-800 px-5 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="st-titre text-3xl font-medium tracking-[-0.02em] text-mist-100 sm:text-4xl">
            {t.titre.split(" ").map((m, i) => (
              <span key={i} className="st-mot inline-block">
                {m}&nbsp;
              </span>
            ))}
          </h2>
          <p className="st-reveal mx-auto mt-3 max-w-xl text-sm font-light leading-relaxed text-mist-300 sm:text-base">
            {t.sousTitre}
          </p>
        </div>

        <div className="mt-10">
          <GrilleTarifs />
        </div>

        <p className="st-reveal mt-6 text-center text-xs leading-relaxed text-mist-400">
          {CARTE_ACTIVE ? t.paiementCarte : t.paiementManuel}{" "}
          <Link href="/tarifs" className="text-brand-400 underline underline-offset-4 hover:text-brand-300">
            {t.details}
          </Link>
        </p>
      </div>
    </section>
  );
}
