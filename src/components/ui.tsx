"use client";

import { useEffect, useState, type ReactNode } from "react";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-xl border border-ink-800 bg-ink-900 ${className}`}>{children}</div>
  );
}

export function Section({
  titre,
  soustitre,
  action,
  children,
}: {
  titre: string;
  soustitre?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="mb-8">
      <div className="mb-3 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-mist-100">{titre}</h2>
          {soustitre && <p className="mt-0.5 text-sm text-mist-400">{soustitre}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function Badge({
  children,
  tone = "neutre",
}: {
  children: ReactNode;
  tone?: "neutre" | "vert" | "ambre" | "rouge" | "bleu";
}) {
  const tones = {
    neutre: "bg-ink-800 text-mist-300 ring-ink-700",
    vert: "bg-jade/12 text-jade ring-jade/30",
    ambre: "bg-amber-glow/12 text-amber-glow ring-amber-glow/30",
    rouge: "bg-rose-warn/12 text-rose-warn ring-rose-warn/30",
    bleu: "bg-copper/12 text-copper ring-copper/30",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function Stat({
  label,
  valeur,
  detail,
  tone = "neutre",
}: {
  label: string;
  valeur: ReactNode;
  detail?: string;
  tone?: "neutre" | "vert" | "rouge" | "ambre";
}) {
  const colors = {
    neutre: "text-mist-100",
    vert: "text-brand-300",
    rouge: "text-rose-warn",
    ambre: "text-amber-glow",
  };
  return (
    <div className="rounded-lg border border-ink-800 bg-ink-850 px-4 py-3">
      <div className="text-[11px] uppercase tracking-wide text-mist-400">{label}</div>
      <div className={`mt-1 text-lg font-semibold tabular-nums ${colors[tone]}`}>{valeur}</div>
      {detail && <div className="mt-0.5 text-xs text-mist-400">{detail}</div>}
    </div>
  );
}

/**
 * Barre de score horizontale, notes sur 20 et sur 10. La barre se remplit
 * depuis zero au montage : le remplissage attire l oeil sur les notes.
 */
export function ScoreBar({ valeur, max, label }: { valeur: number; max: number; label: string }) {
  const pct = Math.max(0, Math.min(100, (valeur / max) * 100));
  const couleur = pct >= 66 ? "bg-brand-400" : pct >= 40 ? "bg-amber-glow" : "bg-rose-warn";
  const [largeur, setLargeur] = useState(0);
  useEffect(() => {
    const t = requestAnimationFrame(() => setLargeur(pct));
    return () => cancelAnimationFrame(t);
  }, [pct]);
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between text-xs">
        <span className="text-mist-300">{label}</span>
        <span className="tabular-nums text-mist-400">
          {Math.round(valeur)}/{max}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-ink-800">
        <div
          className={`h-full rounded-full transition-[width] duration-1000 ease-out ${couleur}`}
          style={{ width: `${largeur}%` }}
        />
      </div>
    </div>
  );
}

export function Liste({ items, tone = "neutre" }: { items: string[]; tone?: "neutre" | "vert" | "rouge" }) {
  const puces = { neutre: "bg-mist-400", vert: "bg-brand-400", rouge: "bg-rose-warn" };
  if (!items?.length) return <p className="text-sm text-mist-400">Aucun element.</p>;
  return (
    <ul className="space-y-1.5">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-mist-200">
          <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${puces[tone]}`} />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function Chips({ items, tone = "neutre" }: { items: string[]; tone?: "neutre" | "vert" | "bleu" }) {
  if (!items?.length) return <p className="text-sm text-mist-400">Aucun element.</p>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item, i) => (
        <Badge key={i} tone={tone}>
          {item}
        </Badge>
      ))}
    </div>
  );
}

/* ============================================================================
   Briques de lecture.

   Principe : la decision d'abord, le detail ensuite. Un debutant doit pouvoir
   trancher en trois secondes sans rien lire ; un utilisateur avance deplie ce
   qui l'interesse. Rien n'est supprime, tout est hierarchise.
   ========================================================================== */

/**
 * Bandeau de verdict : la reponse a "est-ce que je me lance ?", en haut de page.
 */
export function Verdict({
  score,
  verdict,
  children,
}: {
  score: number;
  verdict: string;
  children?: ReactNode;
}) {
  const niveau =
    score >= 65
      ? { mot: "A tester", classe: "text-jade", anneau: "ring-jade/35", fond: "bg-jade/[0.07]" }
      : score >= 45
        ? { mot: "Sous conditions", classe: "text-amber-glow", anneau: "ring-amber-glow/35", fond: "bg-amber-glow/[0.07]" }
        : { mot: "A eviter", classe: "text-rose-warn", anneau: "ring-rose-warn/35", fond: "bg-rose-warn/[0.07]" };

  return (
    <div className={`rounded-xl p-5 ring-1 ring-inset ${niveau.anneau} ${niveau.fond}`}>
      <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
        <JaugeCirculaire valeur={score} />
        <div className="min-w-0 flex-1">
          <div className={`text-xs font-semibold uppercase tracking-[0.2em] ${niveau.classe}`}>
            {niveau.mot}
          </div>
          <p className="mt-1.5 text-base leading-snug text-mist-100">{verdict}</p>
        </div>
      </div>
      {children && <div className="mt-5 border-t border-ink-800 pt-4">{children}</div>}
    </div>
  );
}

/** Score sur 100 en anneau : lisible d'un coup d'oeil, sans lire un chiffre. */
export function JaugeCirculaire({ valeur, taille = 104 }: { valeur: number; taille?: number }) {
  const [anime, setAnime] = useState(0);
  useEffect(() => {
    const t = requestAnimationFrame(() => setAnime(valeur));
    return () => cancelAnimationFrame(t);
  }, [valeur]);

  const r = 44;
  const circonference = 2 * Math.PI * r;
  const couleur = valeur >= 65 ? "#3f7d6b" : valeur >= 45 ? "#e08c3a" : "#c9553d";

  return (
    <div className="relative shrink-0" style={{ width: taille, height: taille }}>
      <svg viewBox="0 0 104 104" className="h-full w-full -rotate-90">
        <circle cx="52" cy="52" r={r} fill="none" stroke="currentColor" strokeWidth="8" className="text-ink-800" />
        <circle
          cx="52"
          cy="52"
          r={r}
          fill="none"
          stroke={couleur}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circonference}
          strokeDashoffset={circonference - (anime / 100) * circonference}
          style={{ transition: "stroke-dashoffset 1.1s cubic-bezier(0.22,1,0.36,1)" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <div className="text-2xl font-bold tabular-nums text-mist-100">{Math.round(valeur)}</div>
          <div className="text-[10px] text-mist-400">/100</div>
        </div>
      </div>
    </div>
  );
}

/** Chiffre mis en avant. Sert aux 3-4 nombres qui portent la decision. */
export function ChiffreCle({
  label,
  valeur,
  detail,
  tone = "neutre",
}: {
  label: string;
  valeur: ReactNode;
  detail?: string;
  tone?: "neutre" | "vert" | "rouge" | "ambre" | "or";
}) {
  const couleurs = {
    neutre: "text-mist-100",
    vert: "text-jade",
    rouge: "text-rose-warn",
    ambre: "text-amber-glow",
    or: "text-brand-300",
  };
  return (
    <div className="rounded-lg border border-ink-800 bg-ink-850 px-4 py-3 text-center">
      <div className="text-[10px] uppercase tracking-wide text-mist-400">{label}</div>
      <div className={`mt-1 text-xl font-bold tabular-nums ${couleurs[tone]}`}>{valeur}</div>
      {detail && <div className="mt-0.5 text-[11px] leading-snug text-mist-400">{detail}</div>}
    </div>
  );
}

/**
 * Bloc repliable. C'est l'outil principal de simplification : le detail reste
 * disponible sans encombrer la page. `ouvert` sert aux sections essentielles.
 */
export function Repli({
  titre,
  compteur,
  apercu,
  ouvert = false,
  children,
}: {
  titre: string;
  compteur?: number | string;
  apercu?: string;
  ouvert?: boolean;
  children: ReactNode;
}) {
  return (
    <details
      open={ouvert}
      className="group rounded-xl border border-ink-800 bg-ink-900 transition-colors open:border-ink-700 hover:border-ink-700"
    >
      <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-3.5 marker:content-none">
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4 shrink-0 text-mist-400 transition-transform duration-200 group-open:rotate-90"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <path d="m9 6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="flex-1 text-sm font-medium text-mist-100">{titre}</span>
        {compteur !== undefined && (
          <span className="shrink-0 rounded-full bg-ink-800 px-2 py-0.5 text-[11px] tabular-nums text-mist-300">
            {compteur}
          </span>
        )}
        {apercu && (
          <span className="hidden max-w-[45%] truncate text-xs text-mist-400 group-open:hidden sm:block">
            {apercu}
          </span>
        )}
      </summary>
      <div className="border-t border-ink-800 px-5 py-4">{children}</div>
    </details>
  );
}

/** Deux colonnes comparees : ce qui marche / ce qui manque, par exemple. */
export function Duo({
  gauche,
  droite,
}: {
  gauche: { titre: string; items: string[] };
  droite: { titre: string; items: string[] };
}) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <div className="rounded-xl border border-jade/25 bg-jade/[0.05] p-4">
        <h4 className="mb-2.5 flex items-center gap-2 text-sm font-semibold text-jade">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="m5 13 4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {gauche.titre}
        </h4>
        <Liste items={gauche.items} tone="vert" />
      </div>
      <div className="rounded-xl border border-amber-glow/25 bg-amber-glow/[0.05] p-4">
        <h4 className="mb-2.5 flex items-center gap-2 text-sm font-semibold text-amber-glow">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 8v5M12 17h.01" strokeLinecap="round" />
            <circle cx="12" cy="12" r="9" />
          </svg>
          {droite.titre}
        </h4>
        <Liste items={droite.items} tone="rouge" />
      </div>
    </div>
  );
}

/** Ligne d'information : libelle a gauche, valeur a droite. Plus lisible qu'un paragraphe. */
export function Ligne({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-ink-800 py-2 last:border-0">
      <span className="shrink-0 text-xs text-mist-400">{label}</span>
      <span className="text-right text-sm text-mist-100">{children}</span>
    </div>
  );
}

export function formatSecondes(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  const cs = Math.round((s % 1) * 10);
  return m > 0
    ? `${m}:${String(sec).padStart(2, "0")}`
    : `${sec}.${cs}s`;
}
