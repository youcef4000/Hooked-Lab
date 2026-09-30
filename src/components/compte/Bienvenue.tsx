"use client";

import { useEffect, useState } from "react";
import { evenement } from "../Pixels";
import { useLangue } from "../Langue";

/* Premier passage dans l'outil juste apres un paiement : on confirme que
   l'acces est ouvert, on remonte l'achat aux pixels publicitaires, puis on
   nettoie l'adresse pour qu'un rechargement ne le refasse pas. */
export function Bienvenue({ credits, palier }: { credits: number; palier: string }) {
  const fr = useLangue() === "fr";
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    evenement("Purchase", { content_name: palier });
    window.history.replaceState(null, "", "/analyser");
  }, [palier]);

  if (!visible) return null;
  return (
    <div className="mb-6 flex items-start justify-between gap-4 rounded-[var(--r-lg)] border border-jade/35 bg-jade/10 px-5 py-4">
      <div>
        <p className="text-sm font-semibold text-jade">
          {fr ? "Paiement confirmé — ton accès est ouvert." : "Payment confirmed — your access is open."}
        </p>
        <p className="mt-1 text-sm text-mist-200">
          {fr
            ? `${credits} crédits disponibles. Colle le lien d'une pub ou dépose une vidéo pour lancer ta première analyse.`
            : `${credits} credits available. Paste an ad link or drop a video to run your first analysis.`}
        </p>
      </div>
      <button
        onClick={() => setVisible(false)}
        aria-label={fr ? "Fermer" : "Close"}
        className="shrink-0 text-lg leading-none text-mist-400 transition hover:text-mist-100"
      >
        ×
      </button>
    </div>
  );
}
