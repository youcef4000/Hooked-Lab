"use client";

import { createContext, useContext } from "react";
import { useRouter } from "next/navigation";
import { COOKIE_LANGUE, type Langue } from "@/lib/langue";

/* ============================================================================
   Langue cote navigateur.

   Le serveur decide de la langue (cookie, puis navigateur) et la transmet
   une fois, via le layout racine. Chaque composant client la lit avec
   useLangue() et choisit ses textes avec useT({ fr: {...}, en: {...} }).
   ========================================================================== */

const Contexte = createContext<Langue>("en");

export function LangueProvider({ langue, children }: { langue: Langue; children: React.ReactNode }) {
  return <Contexte.Provider value={langue}>{children}</Contexte.Provider>;
}

export function useLangue(): Langue {
  return useContext(Contexte);
}

/** Les textes d'un composant, dans la langue courante. */
export function useT<T>(textes: Record<Langue, T>): T {
  return textes[useContext(Contexte)];
}

/** Bascule FR / EN : le choix est retenu un an, et la page se re-rend aussitot. */
export function SelecteurLangue({ className = "" }: { className?: string }) {
  const langue = useLangue();
  const router = useRouter();

  function choisir(l: Langue) {
    if (l === langue) return;
    document.cookie = `${COOKIE_LANGUE}=${l}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  }

  return (
    <div
      role="radiogroup"
      aria-label={langue === "fr" ? "Langue" : "Language"}
      className={`inline-flex shrink-0 rounded-full border border-ink-700 bg-ink-900/80 p-0.5 ${className}`}
    >
      {(["fr", "en"] as const).map((l) => (
        <button
          key={l}
          role="radio"
          aria-checked={langue === l}
          onClick={() => choisir(l)}
          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide transition ${
            langue === l ? "bg-mist-100 text-ink-950" : "text-mist-400 hover:text-mist-100"
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
