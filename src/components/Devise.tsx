"use client";

import { useEffect, useState } from "react";
import type { Devise } from "@/lib/tarifs";
import { CARTE_ACTIVE } from "@/lib/public";

/* ============================================================================
   Devise d'affichage des prix.

   Devinee sans aucun service externe : le fuseau horaire du navigateur dit
   ou se trouve le visiteur (Africa/Algiers, Europe/Paris...), et sa langue
   complete l'indice (fr-DZ, ar-DZ). Le choix manuel du visiteur est retenu
   et l'emporte ensuite toujours.

   Le rendu serveur affiche les dinars ; la devise detectee s'applique des le
   premier affichage cote navigateur. Pas d'appel a un service de
   geolocalisation par IP : plus lent, payant a l'echelle, et moins fiable
   que le fuseau pour ce qu'on veut savoir.
   ========================================================================== */

const CLE = "hkl_devise";

export function deviseDetectee(): Devise {
  // Sans paiement par carte, seuls les dinars sont payables : on n'affiche qu'eux.
  if (!CARTE_ACTIVE) return "DZD";
  try {
    const choix = localStorage.getItem(CLE);
    if (choix === "DZD" || choix === "EUR" || choix === "USD") return choix;
  } catch {
    /* stockage indisponible : on devine */
  }
  const fuseau = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "";
  const langues = navigator.languages ?? [navigator.language];
  if (fuseau === "Africa/Algiers" || langues.some((l) => /-DZ$/i.test(l))) return "DZD";
  if (fuseau.startsWith("Europe/") && fuseau !== "Europe/London") return "EUR";
  return "USD";
}

export function useDevise(): [Devise, (d: Devise) => void] {
  const [devise, setDevise] = useState<Devise>("DZD");
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

const OPTIONS: { d: Devise; label: string; titre: string }[] = [
  { d: "DZD", label: "DA", titre: "Dinars — BaridiMob ou CCP" },
  { d: "EUR", label: "€", titre: "Euros — carte bancaire" },
  { d: "USD", label: "$", titre: "Dollars — carte bancaire" },
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
  if (!CARTE_ACTIVE) return null;
  return (
    <div
      role="radiogroup"
      aria-label="Devise"
      className={`inline-flex rounded-full border border-ink-700 bg-ink-900 p-1 ${className}`}
    >
      {OPTIONS.map((o) => (
        <button
          key={o.d}
          role="radio"
          aria-checked={devise === o.d}
          title={o.titre}
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
