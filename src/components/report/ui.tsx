"use client";

import { useState } from "react";

export function Card({
  titre,
  sousTitre,
  children,
  className = "",
}: {
  titre?: string;
  sousTitre?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-xl border border-ink-800 bg-ink-900/50 p-5 ${className}`}>
      {titre && (
        <header className="mb-3.5">
          <h3 className="text-sm font-semibold tracking-tight text-ink-100">{titre}</h3>
          {sousTitre && <p className="mt-0.5 text-xs text-ink-400">{sousTitre}</p>}
        </header>
      )}
      {children}
    </section>
  );
}

export function Badge({
  children,
  tone = "neutre",
}: {
  children: React.ReactNode;
  tone?: "neutre" | "vert" | "ambre" | "rouge" | "bleu";
}) {
  const tones = {
    neutre: "bg-ink-800 text-ink-300 ring-ink-700",
    vert: "bg-brand-500/15 text-brand-300 ring-brand-500/25",
    ambre: "bg-accent-500/15 text-accent-400 ring-accent-500/25",
    rouge: "bg-red-500/15 text-red-300 ring-red-500/25",
    bleu: "bg-blue-500/15 text-blue-300 ring-blue-500/25",
  };
  return (
    <span className={`inline-block rounded-md px-2 py-0.5 text-[11px] font-medium ring-1 ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function Puces({ items, tone }: { items: string[]; tone?: "vert" | "rouge" }) {
  if (!items?.length) return <p className="text-sm text-ink-400">Rien a signaler.</p>;
  const couleur = tone === "vert" ? "bg-brand-400" : tone === "rouge" ? "bg-red-400" : "bg-ink-600";
  return (
    <ul className="space-y-1.5">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2.5 text-[13px] leading-relaxed text-ink-300">
          <span className={`mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full ${couleur}`} />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function Champ({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wide text-ink-400">{label}</dt>
      <dd className="mt-0.5 text-[13px] leading-relaxed text-ink-100">{children}</dd>
    </div>
  );
}

export function CopyButton({ texte, label = "Copier" }: { texte: string; label?: string }) {
  const [copie, setCopie] = useState(false);

  async function copier() {
    try {
      await navigator.clipboard.writeText(texte);
      setCopie(true);
      setTimeout(() => setCopie(false), 1600);
    } catch {
      setCopie(false);
    }
  }

  return (
    <button
      onClick={copier}
      className="no-print shrink-0 rounded-lg border border-ink-700 px-2.5 py-1 text-[11px] font-medium text-ink-300 transition hover:border-ink-600 hover:text-ink-100"
    >
      {copie ? "Copie !" : label}
    </button>
  );
}

export function Mots({ mots, tone }: { mots: string[]; tone?: "vert" | "ambre" | "bleu" }) {
  if (!mots?.length) return <p className="text-sm text-ink-400">—</p>;
  const t = tone === "vert" ? "vert" : tone === "ambre" ? "ambre" : tone === "bleu" ? "bleu" : "neutre";
  return (
    <div className="flex flex-wrap gap-1.5">
      {mots.map((m, i) => (
        <Badge key={`${m}-${i}`} tone={t}>
          {m}
        </Badge>
      ))}
    </div>
  );
}

/** Barre de note sur 10 ou sur 20 selon `max`. */
export function Jauge({ valeur, max = 10, label }: { valeur: number; max?: number; label?: string }) {
  const pct = Math.max(0, Math.min(100, (valeur / max) * 100));
  const couleur = pct >= 70 ? "bg-brand-400" : pct >= 45 ? "bg-accent-400" : "bg-red-400";
  return (
    <div>
      {label && (
        <div className="mb-1 flex items-baseline justify-between text-[12px]">
          <span className="text-ink-300">{label}</span>
          <span className="font-mono tabular-nums text-ink-400">
            {valeur}/{max}
          </span>
        </div>
      )}
      <div className="h-1.5 overflow-hidden rounded-full bg-ink-800">
        <div className={`h-full rounded-full ${couleur} transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function tempsCourt(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, "0")}`;
}

/** Bloc de texte pouvant contenir de l'arabe : bascule la direction de lecture. */
export function TexteMultilingue({ texte, className = "" }: { texte: string; className?: string }) {
  const arabe = /[؀-ۿ]/.test(texte);
  return (
    <p
      dir={arabe ? "rtl" : "ltr"}
      className={`whitespace-pre-wrap text-[13px] leading-relaxed text-ink-200 ${className}`}
    >
      {texte}
    </p>
  );
}
