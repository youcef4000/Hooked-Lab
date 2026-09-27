"use client";

import { useState } from "react";
import { formatDZD } from "@/lib/dz";
import type { Report } from "@/types/analysis";

/* ============================================================================
   Le rapport en un message.

   Un vendeur ne decide presque jamais seul : il envoie le produit a son
   associe, a son agent en Chine, a son confirmateur. Ce resume tient dans
   un message WhatsApp — verdict, prix, profit, lien fournisseur — et part
   en un clic, sans recopier quoi que ce soit.
   ========================================================================== */

export function resumeTexte(report: Report): string {
  const { creative, dz, sourcing, rentabilite } = report;
  const r = rentabilite.resultats;
  const achat = `${sourcing.estimation.prix_achat_unitaire_usd_min.toFixed(2)} – ${sourcing.estimation.prix_achat_unitaire_usd_max.toFixed(2)} $`;
  const lien1688 = sourcing.liens.find((l) => l.plateforme === "1688") ?? sourcing.liens[0];

  return [
    `📦 ${creative.produit.nom_fr}`,
    `Score : ${dz.score.global_sur_100}/100 — ${dz.score.verdict}`,
    "",
    `Achat : ${achat}`,
    `Vente conseillée : ${formatDZD(rentabilite.params.prix_vente_dzd)} (livraison)`,
    `Profit / commande : ${formatDZD(r.profit_par_commande_dzd)}`,
    `Budget pub max / commande : ${formatDZD(r.cpa_max_dzd)}`,
    lien1688 ? `\n🔎 Fournisseur : ${lien1688.url}` : "",
    "",
    "— Analyse Hooked Lab",
  ]
    .filter((l, i, t) => !(l === "" && t[i - 1] === ""))
    .join("\n")
    .trim();
}

export function PartageResume({ report }: { report: Report }) {
  const [copie, setCopie] = useState(false);
  const texte = resumeTexte(report);

  async function copier() {
    try {
      await navigator.clipboard.writeText(texte);
      setCopie(true);
      setTimeout(() => setCopie(false), 2000);
    } catch {
      /* presse-papiers bloque : le bouton WhatsApp reste disponible */
    }
  }

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      <a
        href={`https://wa.me/?text=${encodeURIComponent(texte)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-full border border-jade/40 bg-jade/10 px-4 py-2 text-xs font-semibold text-jade transition hover:bg-jade/20"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
          <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2z" />
        </svg>
        Envoyer le résumé sur WhatsApp
      </a>
      <button
        onClick={copier}
        className="rounded-full border border-ink-700 px-4 py-2 text-xs font-medium text-mist-300 transition hover:border-brand-500/50 hover:text-brand-300"
      >
        {copie ? "Résumé copié ✓" : "Copier le résumé"}
      </button>
    </div>
  );
}
