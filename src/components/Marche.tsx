"use client";

import { useEffect, useState } from "react";
import { useLangue } from "./Langue";
import { MARCHES, estMarche, marcheDevine, type MarcheId } from "@/lib/marches";

/* ============================================================================
   Marche vise par la prochaine analyse.

   Devine au premier passage (fuseau horaire, langue), puis retenu : un
   vendeur travaille presque toujours le meme marche, il ne doit pas le
   choisir a chaque fois. Tous les composants qui lancent une analyse
   partagent la meme valeur, synchronisee par un evenement du navigateur.
   ========================================================================== */

const CLE = "hkl_marche";
const EVENEMENT = "hkl-marche";

function lire(langue: "fr" | "en"): MarcheId {
  try {
    const v = localStorage.getItem(CLE);
    if (estMarche(v)) return v;
  } catch {
    /* stockage indisponible */
  }
  return marcheDevine(Intl.DateTimeFormat().resolvedOptions().timeZone ?? "", langue);
}

export function useMarche(): [MarcheId, (m: MarcheId) => void] {
  const langue = useLangue();
  const [marche, setMarche] = useState<MarcheId>("us");

  useEffect(() => {
    setMarche(lire(langue));
    const suivre = () => setMarche(lire(langue));
    window.addEventListener(EVENEMENT, suivre);
    return () => window.removeEventListener(EVENEMENT, suivre);
  }, [langue]);

  const choisir = (m: MarcheId) => {
    try {
      localStorage.setItem(CLE, m);
    } catch {
      /* le choix vaudra pour cette page */
    }
    setMarche(m);
    window.dispatchEvent(new Event(EVENEMENT));
  };
  return [marche, choisir];
}

export function SelecteurMarche({ className = "" }: { className?: string }) {
  const langue = useLangue();
  const [marche, choisir] = useMarche();
  const courant = MARCHES.find((m) => m.id === marche);

  return (
    <div className={className}>
      <p className="mb-2 text-xs font-medium text-mist-300">
        {langue === "fr" ? "Marché où tu veux vendre ce produit" : "Market where you want to sell this product"}
      </p>
      <div role="radiogroup" className="barre-masquee flex gap-2 overflow-x-auto pb-1">
        {MARCHES.map((m) => (
          <button
            key={m.id}
            type="button"
            role="radio"
            aria-checked={m.id === marche}
            onClick={() => choisir(m.id)}
            className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm transition ${
              m.id === marche
                ? "border-brand-500 bg-brand-500/12 font-medium text-mist-100"
                : "border-ink-700 text-mist-300 hover:border-ink-600 hover:text-mist-100"
            }`}
          >
            <span className="text-base leading-none">{m.drapeau}</span>
            {m.nom[langue]}
          </button>
        ))}
      </div>
      {courant && (
        <p className="mt-2 text-[11px] leading-relaxed text-mist-500">
          {langue === "fr"
            ? `${courant.modele === "cod" ? "Paiement à la livraison" : "Paiement par carte"} · prix en ${courant.devise} · annonces en ${courant.langueAnnonces.fr}`
            : `${courant.modele === "cod" ? "Cash on delivery" : "Card payment"} · prices in ${courant.devise} · ads in ${courant.langueAnnonces.en}`}
        </p>
      )}
    </div>
  );
}
