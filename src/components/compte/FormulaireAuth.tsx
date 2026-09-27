"use client";

import Link from "next/link";
import { useState } from "react";
import { evenement } from "../Pixels";
import { CARTE_ACTIVE } from "@/lib/public";

/* ============================================================================
   Inscription et connexion.

   Un seul composant pour les deux : les champs different, le reste est
   identique, et deux fichiers presque jumeaux finiraient par diverger.

   Le telephone est demande a l'inscription parce que c'est par lui que passe
   l'activation. On l'annonce clairement sous le champ plutot que de le
   demander sans expliquer — un numero reclame sans raison fait fuir.
   ========================================================================== */

type Mode = "inscription" | "connexion";

const champStyle =
  "w-full rounded-lg border border-ink-700 bg-ink-950 px-3.5 py-2.5 text-sm text-mist-100 outline-none transition placeholder:text-mist-500 focus:border-brand-500";

export function FormulaireAuth({ mode }: { mode: Mode }) {
  const inscription = mode === "inscription";

  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [telephone, setTelephone] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [erreur, setErreur] = useState("");
  const [envoi, setEnvoi] = useState(false);

  async function soumettre(e: React.FormEvent) {
    e.preventDefault();
    setErreur("");
    setEnvoi(true);

    try {
      const route = inscription ? "/api/compte/inscription" : "/api/compte/session";
      const corps = inscription ? { nom, email, telephone, motDePasse } : { email, motDePasse };

      const r = await fetch(route, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(corps),
      });
      const d = (await r.json()) as { ok: boolean; message?: string };

      if (!d.ok) {
        setErreur(d.message ?? "Une erreur est survenue.");
        setEnvoi(false);
        return;
      }

      if (inscription) evenement("CompleteRegistration");
      // Rechargement complet : les pages serveur doivent relire le cookie.
      window.location.href = "/compte";
    } catch {
      setErreur("Le serveur ne répond pas. Réessaie dans un instant.");
      setEnvoi(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm py-10 sm:py-16">
      <div className="mb-6 text-center">
        <h1 className="text-xl font-semibold tracking-tight text-mist-100">
          {inscription ? "Créer un compte" : "Se connecter"}
        </h1>
        <p className="mt-1.5 text-sm leading-relaxed text-mist-400">
          {inscription
            ? CARTE_ACTIVE
              ? "Deux minutes. Tu choisis ensuite ta formule et tu paies par carte ou en dinars."
              : "Deux minutes. On t'appelle ensuite pour activer ton compte."
            : "Content de te revoir."}
        </p>
      </div>

      <form onSubmit={soumettre} noValidate className="rounded-xl border border-ink-800 bg-ink-900 p-5">
        <div className="space-y-3.5">
          {inscription && (
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-mist-200">Nom et prénom</span>
              <input
                className={champStyle}
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                autoComplete="name"
                placeholder="Karim Benali"
              />
            </label>
          )}

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-mist-200">Email</span>
            <input
              type="email"
              className={champStyle}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              placeholder="karim@exemple.dz"
            />
          </label>

          {inscription && (
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-mist-200">Téléphone</span>
              <input
                type="tel"
                inputMode="numeric"
                className={champStyle}
                value={telephone}
                onChange={(e) => setTelephone(e.target.value)}
                autoComplete="tel"
                placeholder="0X XX XX XX XX"
              />
              <span className="mt-1 block text-xs leading-relaxed text-mist-500">
                C&apos;est sur ce numéro qu&apos;on t&apos;appelle pour activer ton compte.
              </span>
            </label>
          )}

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-mist-200">Mot de passe</span>
            <input
              type="password"
              className={champStyle}
              value={motDePasse}
              onChange={(e) => setMotDePasse(e.target.value)}
              autoComplete={inscription ? "new-password" : "current-password"}
              placeholder={inscription ? "8 caractères minimum" : ""}
            />
          </label>
        </div>

        {erreur && (
          <p className="mt-3 rounded-lg border border-rose-warn/30 bg-rose-warn/[0.07] px-3 py-2 text-xs leading-relaxed text-rose-warn">
            {erreur}
          </p>
        )}

        <button
          type="submit"
          disabled={envoi}
          className="mt-4 w-full rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-ink-950 transition hover:bg-brand-400 disabled:opacity-50"
        >
          {envoi ? "Un instant..." : inscription ? "Créer mon compte" : "Entrer"}
        </button>

        <p className="mt-4 text-center text-xs text-mist-400">
          {inscription ? (
            <>
              Déjà un compte ?{" "}
              <Link href="/connexion" className="text-brand-300 underline underline-offset-4 hover:text-brand-400">
                Se connecter
              </Link>
            </>
          ) : (
            <>
              Pas encore de compte ?{" "}
              <Link href="/inscription" className="text-brand-300 underline underline-offset-4 hover:text-brand-400">
                En créer un
              </Link>
            </>
          )}
        </p>
      </form>
    </div>
  );
}
