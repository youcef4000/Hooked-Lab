"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { evenement } from "./Pixels";
import { useT } from "./Langue";
import { useMarche } from "./Marche";

const EXEMPLES = [
  { label: "TikTok", exemple: "https://www.tiktok.com/@compte/video/7412345678901234567" },
  { label: "Instagram", exemple: "https://www.instagram.com/reel/Cxxxxxxxxxx/" },
  { label: "Facebook", exemple: "https://www.facebook.com/reel/1234567890" },
];

const TEXTES = {
  fr: {
    placeholder: "Colle ici le lien TikTok, Instagram ou Facebook",
    lancement: "Lancement…",
    analyser: "Analyser le lien",
    echec: "Le lancement de l'analyse a échoué.",
    serveur: "Le serveur ne répond pas. Réessaie dans un instant.",
    exemples: "Exemples :",
  },
  en: {
    placeholder: "Paste a TikTok, Instagram or Facebook link",
    lancement: "Starting…",
    analyser: "Analyse the link",
    echec: "The analysis could not start.",
    serveur: "The server is not responding. Try again in a moment.",
    exemples: "Examples:",
  },
};

export function AnalyzeForm() {
  const router = useRouter();
  const t = useT(TEXTES);
  const [marche] = useMarche();
  const [url, setUrl] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);

  async function lancer(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setEnvoi(true);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, marche }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErreur(data.error ?? t.echec);
        setEnvoi(false);
        return;
      }
      // Lancer une analyse est l'engagement le plus fort avant l'abonnement :
      // c'est cet evenement qu'on optimise dans les campagnes.
      evenement("Lead", { content_name: "analyse_lancee", source: "lien" });
      router.push(`/analyse/${data.id}`);
    } catch {
      setErreur(t.serveur);
      setEnvoi(false);
    }
  }

  return (
    <div>
      <form onSubmit={lancer} className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <svg
            viewBox="0 0 24 24"
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-mist-400"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.5 1.5" strokeLinecap="round" />
            <path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.5-1.5" strokeLinecap="round" />
          </svg>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={t.placeholder}
            required
            disabled={envoi}
            className="w-full rounded-[var(--r-md)] border border-ink-700 bg-ink-850 py-2.5 pl-10 pr-4 text-sm text-mist-100 outline-none transition placeholder:text-mist-400 focus:border-brand-500/60 focus:ring-2 focus:ring-brand-500/20 disabled:opacity-60"
          />
        </div>
        <button
          type="submit"
          disabled={envoi || !url.trim()}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-ink-600 bg-ink-800 px-5 py-2.5 text-sm font-medium text-mist-100 transition hover:border-brand-500/50 hover:bg-ink-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {envoi ? (
            <>
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-mist-400/30 border-t-mist-200" />
              {t.lancement}
            </>
          ) : (
            t.analyser
          )}
        </button>
      </form>

      {erreur && (
        <div className="mt-3 rounded-[var(--r-md)] border border-rose-warn/30 bg-rose-warn/10 px-4 py-3 text-sm text-rose-warn">{erreur}</div>
      )}

      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-mist-400">
        <span>{t.exemples}</span>
        {EXEMPLES.map((e) => (
          <button
            key={e.label}
            type="button"
            onClick={() => setUrl(e.exemple)}
            className="rounded-md border border-ink-700 px-2 py-0.5 transition hover:border-ink-600 hover:text-mist-200"
          >
            {e.label}
          </button>
        ))}
      </div>
    </div>
  );
}
