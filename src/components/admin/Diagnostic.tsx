"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui";
import type { Verification } from "@/types/analysis";

interface Diagnostic {
  ok: boolean;
  modele: string;
  maxFrames: number;
  maxVideoSeconds: number;
  verifications: Verification[];
}

export function Diagnostic() {
  const [diag, setDiag] = useState<Diagnostic | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  async function charger() {
    setDiag(null);
    setErreur(null);
    try {
      const res = await fetch("/api/diagnostic");
      setDiag(await res.json());
    } catch {
      setErreur("Le serveur ne repond pas.");
    }
  }

  useEffect(() => {
    charger();
  }, []);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-5 flex items-end justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-mist-100">
            Diagnostic de l&apos;installation
          </h1>
          <p className="mt-1 text-sm text-mist-400">
            Vérifie que tout est en place avant de lancer une analyse.
          </p>
        </div>
        <button
          onClick={charger}
          className="rounded-md border border-ink-700 bg-ink-800 px-3 py-1.5 text-xs text-mist-300 transition hover:text-mist-100"
        >
          Relancer
        </button>
      </div>

      {erreur && (
        <div className="rounded-lg border border-rose-warn/30 bg-rose-warn/10 px-4 py-3 text-sm text-rose-warn">
          {erreur}
        </div>
      )}

      {!diag && !erreur && (
        <p className="animate-pulse-soft text-sm text-mist-400">Vérification en cours...</p>
      )}

      {diag && (
        <>
          <div
            className={`mb-4 rounded-xl border px-5 py-4 ${
              diag.ok
                ? "border-brand-500/30 bg-brand-500/[0.07]"
                : "border-amber-glow/30 bg-amber-glow/10"
            }`}
          >
            <p className={`text-sm font-medium ${diag.ok ? "text-brand-300" : "text-amber-glow"}`}>
              {diag.ok
                ? "Tout est prêt. Tu peux lancer une analyse."
                : "Il reste des points a corriger avant de pouvoir analyser une vidéo."}
            </p>
          </div>

          <Card className="divide-y divide-ink-800">
            {diag.verifications.map((v) => (
              <div key={v.nom} className="flex gap-3 px-5 py-4">
                <span
                  className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full ring-1 ${
                    v.ok
                      ? "bg-brand-500/15 text-brand-400 ring-brand-500/30"
                      : "bg-rose-warn/15 text-rose-warn ring-rose-warn/30"
                  }`}
                >
                  <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="3.5">
                    {v.ok ? (
                      <path d="m5 13 4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                    ) : (
                      <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
                    )}
                  </svg>
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-mist-100">{v.nom}</p>
                  <p className="mt-0.5 break-words text-xs text-mist-400">{v.detail}</p>
                  {!v.ok && v.correction && (
                    <p className="mt-1.5 rounded-md bg-ink-850 px-3 py-2 text-xs leading-relaxed text-amber-glow">
                      {v.correction}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </Card>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-ink-800 bg-ink-900 px-4 py-3">
              <div className="text-[11px] uppercase tracking-wide text-mist-400">Modèle</div>
              <div className="mt-1 text-sm text-mist-100">{diag.modele}</div>
            </div>
            <div className="rounded-lg border border-ink-800 bg-ink-900 px-4 py-3">
              <div className="text-[11px] uppercase tracking-wide text-mist-400">
                Images par analyse
              </div>
              <div className="mt-1 text-sm text-mist-100">{diag.maxFrames}</div>
            </div>
            <div className="rounded-lg border border-ink-800 bg-ink-900 px-4 py-3">
              <div className="text-[11px] uppercase tracking-wide text-mist-400">
                Durée max analysée
              </div>
              <div className="mt-1 text-sm text-mist-100">{diag.maxVideoSeconds} s</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
