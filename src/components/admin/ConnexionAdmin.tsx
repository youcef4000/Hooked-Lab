"use client";

import { useState } from "react";

/* Page de connexion a l'espace admin. */

export function ConnexionAdmin({ configure }: { configure: boolean }) {
  const [motDePasse, setMotDePasse] = useState("");
  const [erreur, setErreur] = useState("");
  const [envoi, setEnvoi] = useState(false);

  async function soumettre(e: React.FormEvent) {
    e.preventDefault();
    setErreur("");
    setEnvoi(true);
    try {
      const r = await fetch("/api/admin/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ motDePasse }),
      });
      const d = (await r.json()) as { ok: boolean; message?: string };
      if (d.ok) {
        // Rechargement complet : le layout serveur doit relire le cookie.
        window.location.reload();
        return;
      }
      setErreur(d.message ?? "Connexion refusée.");
    } catch {
      setErreur("Le serveur ne répond pas.");
    }
    setEnvoi(false);
  }

  if (!configure) {
    return (
      <div className="mx-auto max-w-lg py-16">
        <div className="rounded-xl border border-amber-glow/30 bg-amber-glow/5 p-6">
          <h1 className="text-base font-semibold text-mist-100">Espace admin non configuré</h1>
          <p className="mt-2 text-sm leading-relaxed text-mist-300">
            Aucun mot de passe n&apos;est défini. Tant qu&apos;il n&apos;y en a pas, cette page
            reste fermée — elle affiche les numéros de téléphone de tes clients, elle ne doit pas
            être ouverte à tous.
          </p>
          <ol className="mt-4 space-y-2 text-sm leading-relaxed text-mist-300">
            <li>
              <strong className="text-mist-100">1.</strong> Ouvre le fichier{" "}
              <code className="rounded bg-ink-800 px-1.5 py-0.5 text-xs">.env.local</code> à la
              racine du projet.
            </li>
            <li>
              <strong className="text-mist-100">2.</strong> Ajoute une ligne :{" "}
              <code className="rounded bg-ink-800 px-1.5 py-0.5 text-xs">
                ADMIN_MOT_DE_PASSE=ton-mot-de-passe
              </code>{" "}
              (12 caractères minimum, pas ton mot de passe habituel).
            </li>
            <li>
              <strong className="text-mist-100">3.</strong> Arrête le serveur (Ctrl+C) puis relance{" "}
              <code className="rounded bg-ink-800 px-1.5 py-0.5 text-xs">npm run dev</code>.
            </li>
          </ol>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm py-20">
      <form onSubmit={soumettre} className="rounded-xl border border-ink-800 bg-ink-900 p-6">
        <div className="mb-5 text-center">
          <div className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-xl bg-brand-500/12 text-brand-300 ring-1 ring-brand-500/25">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="4" y="10" width="16" height="10" rx="2" />
              <path d="M8 10V7a4 4 0 0 1 8 0v3" />
            </svg>
          </div>
          <h1 className="text-base font-semibold tracking-tight text-mist-100">Espace admin</h1>
          <p className="mt-1 text-sm text-mist-400">Réservé au propriétaire du site.</p>
        </div>

        <label htmlFor="mdp" className="mb-1.5 block text-xs font-medium text-mist-200">
          Mot de passe
        </label>
        <input
          id="mdp"
          type="password"
          autoFocus
          autoComplete="current-password"
          value={motDePasse}
          onChange={(e) => setMotDePasse(e.target.value)}
          className="w-full rounded-lg border border-ink-700 bg-ink-950 px-3.5 py-2.5 text-sm text-mist-100 outline-none transition focus:border-brand-500"
        />
        {erreur && <p className="mt-2 text-xs text-rose-warn">{erreur}</p>}

        <button
          type="submit"
          disabled={envoi || !motDePasse}
          className="mt-4 w-full rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-ink-950 transition hover:bg-brand-400 disabled:opacity-50"
        >
          {envoi ? "Vérification..." : "Entrer"}
        </button>
      </form>
    </div>
  );
}
