"use client";

import Link from "next/link";
import { useState } from "react";
import { evenement } from "../Pixels";
import { useT } from "../Langue";
import { PALIERS } from "@/lib/tarifs";

/* ============================================================================
   Inscription et connexion.

   Un seul composant pour les deux : les champs different, le reste est
   identique, et deux fichiers presque jumeaux finiraient par diverger.

   Trois champs seulement : nom, email, mot de passe. Le paiement par carte
   se fait juste apres, et ouvre l'acces immediatement. La formule choisie
   sur la page Tarifs traverse l'inscription jusqu'au paiement.
   ========================================================================== */

type Mode = "inscription" | "connexion";

const TEXTES = {
  fr: {
    titreInscription: "Créer un compte",
    titreConnexion: "Se connecter",
    introInscription: "Une minute. Tu paies ensuite par carte, et ton accès s'ouvre aussitôt.",
    introConnexion: "Content de te revoir.",
    nom: "Nom et prénom",
    nomExemple: "Sarah Martin",
    email: "Email",
    emailExemple: "sarah@exemple.com",
    motDePasse: "Mot de passe",
    motDePasseAide: "8 caractères minimum",
    envoi: "Un instant…",
    creer: "Créer mon compte",
    entrer: "Entrer",
    dejaCompte: "Déjà un compte ?",
    seConnecter: "Se connecter",
    pasDeCompte: "Pas encore de compte ?",
    enCreer: "En créer un",
    erreur: "Une erreur est survenue.",
    serveur: "Le serveur ne répond pas. Réessaie dans un instant.",
    formule: (nom: string, annuel: boolean) => `Formule choisie : ${nom}${annuel ? " · annuelle" : ""}`,
  },
  en: {
    titreInscription: "Create an account",
    titreConnexion: "Sign in",
    introInscription: "One minute. Then pay by card, and your access opens instantly.",
    introConnexion: "Welcome back.",
    nom: "Full name",
    nomExemple: "Sarah Martin",
    email: "Email",
    emailExemple: "sarah@example.com",
    motDePasse: "Password",
    motDePasseAide: "At least 8 characters",
    envoi: "One moment…",
    creer: "Create my account",
    entrer: "Sign in",
    dejaCompte: "Already have an account?",
    seConnecter: "Sign in",
    pasDeCompte: "No account yet?",
    enCreer: "Create one",
    erreur: "Something went wrong.",
    serveur: "The server is not responding. Try again in a moment.",
    formule: (nom: string, annuel: boolean) => `Selected plan: ${nom}${annuel ? " · yearly" : ""}`,
  },
};

const champStyle =
  "w-full rounded-[var(--r-md)] border border-ink-700 bg-ink-950 px-3.5 py-2.5 text-sm text-mist-100 outline-none transition placeholder:text-mist-500 focus:border-brand-500";

export function FormulaireAuth({
  mode,
  formule: formuleDemandee,
  periode,
}: {
  mode: Mode;
  formule?: string;
  periode?: string;
}) {
  // Seule une formule qui existe est reprise : l'adresse ne doit pas pouvoir
  // afficher un texte arbitraire.
  const formule = PALIERS.some((p) => p.nom === formuleDemandee) ? formuleDemandee : undefined;
  const t = useT(TEXTES);
  const inscription = mode === "inscription";

  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [erreur, setErreur] = useState("");
  const [envoi, setEnvoi] = useState(false);

  // La formule choisie avant l'inscription suit jusqu'au paiement.
  const suite = formule ? `?formule=${encodeURIComponent(formule)}&periode=${periode === "12" ? "12" : "1"}` : "";

  async function soumettre(e: React.FormEvent) {
    e.preventDefault();
    setErreur("");
    setEnvoi(true);

    try {
      const route = inscription ? "/api/compte/inscription" : "/api/compte/session";
      const corps = inscription ? { nom, email, motDePasse } : { email, motDePasse };

      const r = await fetch(route, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(corps),
      });
      const d = (await r.json()) as { ok: boolean; message?: string };

      if (!d.ok) {
        setErreur(d.message ?? t.erreur);
        setEnvoi(false);
        return;
      }

      if (inscription) evenement("CompleteRegistration");
      // Rechargement complet : les pages serveur doivent relire le cookie.
      window.location.href = `/compte${suite}`;
    } catch {
      setErreur(t.serveur);
      setEnvoi(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm py-10 sm:py-16">
      <div className="mb-6 text-center">
        <h1 className="text-xl font-semibold tracking-tight text-mist-100">{inscription ? t.titreInscription : t.titreConnexion}</h1>
        <p className="mt-1.5 text-sm leading-relaxed text-mist-400">{inscription ? t.introInscription : t.introConnexion}</p>
        {formule && (
          <p className="mt-3 inline-block rounded-full border border-brand-500/35 bg-brand-500/10 px-3 py-1 text-xs font-medium text-brand-300">
            {t.formule(formule, periode === "12")}
          </p>
        )}
      </div>

      <form onSubmit={soumettre} noValidate className="rounded-[var(--r-lg)] border border-ink-800 bg-ink-900 p-5">
        <div className="space-y-3.5">
          {inscription && (
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-mist-200">{t.nom}</span>
              <input className={champStyle} value={nom} onChange={(e) => setNom(e.target.value)} autoComplete="name" placeholder={t.nomExemple} />
            </label>
          )}

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-mist-200">{t.email}</span>
            <input
              type="email"
              className={champStyle}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              placeholder={t.emailExemple}
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-mist-200">{t.motDePasse}</span>
            <input
              type="password"
              className={champStyle}
              value={motDePasse}
              onChange={(e) => setMotDePasse(e.target.value)}
              autoComplete={inscription ? "new-password" : "current-password"}
              placeholder={inscription ? t.motDePasseAide : ""}
            />
          </label>
        </div>

        {erreur && (
          <p className="mt-3 rounded-[var(--r-sm)] border border-rose-warn/30 bg-rose-warn/[0.07] px-3 py-2 text-xs leading-relaxed text-rose-warn">
            {erreur}
          </p>
        )}

        <button
          type="submit"
          disabled={envoi}
          className="cta-aurora mt-4 w-full rounded-full px-4 py-3 text-sm font-semibold disabled:opacity-50"
        >
          {envoi ? t.envoi : inscription ? t.creer : t.entrer}
        </button>

        <p className="mt-4 text-center text-xs text-mist-400">
          {inscription ? t.dejaCompte : t.pasDeCompte}{" "}
          <Link
            href={`${inscription ? "/connexion" : "/inscription"}${suite}`}
            className="text-brand-300 underline underline-offset-4 hover:text-brand-400"
          >
            {inscription ? t.seConnecter : t.enCreer}
          </Link>
        </p>
      </form>
    </div>
  );
}
