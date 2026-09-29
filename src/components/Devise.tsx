"use client";

import { useEffect, useState } from "react";
import type { Devise } from "@/lib/tarifs";
import { useLangue } from "./Langue";

/* ============================================================================
   Devise d'affichage des prix : dollar, euro ou livre.

   Devinee sans aucun service externe : le fuseau horaire du navigateur dit
   ou se trouve le visiteur. Europe continentale -> euro, Royaume-Uni ->
   livre, partout ailleurs (Ameriques, Algerie, Golfe, Asie...) -> dollar,
   la devise de reference du e-commerce. Le choix manuel du visiteur est
   retenu et l'emporte ensuite toujours.

   Le rendu serveur affiche le dollar ; la devise detectee s'applique des le
   premier affichage cote navigateur.
   ========================================================================== */

const CLE = "hkl_devise";

export function deviseDetectee(): Devise {
  try {
    const choix = localStorage.getItem(CLE);
    if (choix === "USD" || choix === "EUR" || choix === "GBP") return choix;
  } catch {
    /* stockage indisponible : on devine */
  }
  const fuseau = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "";
  if (fuseau === "Europe/London") return "GBP";
  if (fuseau.startsWith("Europe/")) return "EUR";
  return "USD";
}

export function useDevise(): [Devise, (d: Devise) => void] {
  const [devise, setDevise] = useState<Devise>("USD");
  useEffect(() => setDevise(deviseDetectee()), []);
  const choisir = (d: Devise) => {
    setDevise(d);
    try {
      localStorage.setItem(CLE, d);
    } catch {
      /* le choix vaudra pour cette page seulement */
    }
  };
  return [devise, choisir];
}

const OPTIONS: { d: Devise; label: string; titre: Record<"fr" | "en", string> }[] = [
  { d: "USD", label: "$", titre: { fr: "Dollars", en: "US dollars" } },
  { d: "EUR", label: "€", titre: { fr: "Euros", en: "Euros" } },
  { d: "GBP", label: "£", titre: { fr: "Livres sterling", en: "Pounds sterling" } },
];

export function SelecteurDevise({
  devise,
  onChange,
  className = "",
}: {
  devise: Devise;
  onChange: (d: Devise) => void;
  className?: string;
}) {
  const langue = useLangue();
  return (
    <div
      role="radiogroup"
      aria-label={langue === "fr" ? "Devise" : "Currency"}
      className={`inline-flex rounded-full border border-ink-700 bg-ink-900 p-1 ${className}`}
    >
      {OPTIONS.map((o) => (
        <button
          key={o.d}
          role="radio"
          aria-checked={devise === o.d}
          title={o.titre[langue]}
          onClick={() => onChange(o.d)}
          className={`min-w-10 rounded-full px-3 py-1.5 text-xs font-semibold transition sm:text-sm ${
            devise === o.d ? "bg-mist-100 text-ink-950" : "text-mist-300 hover:text-mist-100"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
