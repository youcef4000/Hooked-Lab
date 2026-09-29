"use client";

import { useState } from "react";
import { useLangue } from "./Langue";

export function CopyButton({ texte, label }: { texte: string; label?: string }) {
  const fr = useLangue() === "fr";
  const [copie, setCopie] = useState(false);

  async function copier() {
    try {
      await navigator.clipboard.writeText(texte);
    } catch {
      // clipboard API indisponible (page non securisee) : repli sur textarea.
      const ta = document.createElement("textarea");
      ta.value = texte;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopie(true);
    setTimeout(() => setCopie(false), 1600);
  }

  return (
    <button
      onClick={copier}
      className="inline-flex items-center gap-1.5 rounded-md border border-ink-700 bg-ink-800 px-2.5 py-1 text-xs text-mist-300 transition hover:border-ink-600 hover:text-mist-100"
    >
      {copie ? (
        <>
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-brand-400" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="m5 13 4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {fr ? "Copié" : "Copied"}
        </>
      ) : (
        <>
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="9" y="9" width="11" height="11" rx="2" />
            <path d="M5 15V5a2 2 0 0 1 2-2h8" />
          </svg>
          {label ?? (fr ? "Copier" : "Copy")}
        </>
      )}
    </button>
  );
}
