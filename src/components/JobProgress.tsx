"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UploadDropzone } from "./UploadDropzone";
import type { Job, JobStep } from "@/types/analysis";

function Icone({ statut }: { statut: JobStep["status"] }) {
  if (statut === "ok")
    return (
      <span className="grid h-6 w-6 place-items-center rounded-full bg-brand-500/15 text-brand-400 ring-1 ring-brand-500/30">
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="3">
          <path d="m5 13 4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    );
  if (statut === "echec")
    return (
      <span className="grid h-6 w-6 place-items-center rounded-full bg-rose-warn/15 text-rose-warn ring-1 ring-rose-warn/30">
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="3">
          <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
        </svg>
      </span>
    );
  if (statut === "ignore")
    return (
      <span className="grid h-6 w-6 place-items-center rounded-full bg-ink-800 text-mist-400 ring-1 ring-ink-700">
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="3">
          <path d="M5 12h14" strokeLinecap="round" />
        </svg>
      </span>
    );
  if (statut === "en_cours")
    return (
      <span className="grid h-6 w-6 place-items-center rounded-full bg-brand-500/10 ring-1 ring-brand-500/30">
        <span className="h-3 w-3 animate-spin rounded-full border-2 border-brand-500/30 border-t-brand-400" />
      </span>
    );
  return <span className="h-6 w-6 rounded-full border border-ink-700 bg-ink-850" />;
}

export function JobProgress({ id }: { id: string }) {
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [deconnecte, setDeconnecte] = useState(false);
  const termine = useRef(false);

  useEffect(() => {
    const source = new EventSource(`/api/jobs/${id}/stream`);

    source.onmessage = (event) => {
      const data = JSON.parse(event.data) as Job;
      setJob(data);

      if (data.status === "termine" && !termine.current) {
        termine.current = true;
        source.close();
        // Le rapport est sur disque : on recharge la page serveur pour l'afficher.
        setTimeout(() => router.refresh(), 400);
      }
      if (data.status === "erreur") {
        termine.current = true;
        source.close();
      }
    };

    source.onerror = () => {
      if (!termine.current) setDeconnecte(true);
      source.close();
    };

    return () => source.close();
  }, [id, router]);

  const étapesFaites = job?.steps.filter((s) => s.status === "ok" || s.status === "ignore").length ?? 0;
  const total = job?.steps.length || 6;
  const pct = Math.round((étapesFaites / total) * 100);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight text-mist-100">
          {job?.status === "erreur" ? "Analyse interrompue" : "Analyse en cours"}
        </h1>
        {job?.url && (
          <p className="mt-1 truncate text-sm text-mist-400" title={job.url}>
            {job.url}
          </p>
        )}
      </div>

      {job?.status !== "erreur" && (
        <div className="mb-6">
          <div className="mb-1.5 flex justify-between text-xs text-mist-400">
            <span>
              {étapesFaites} / {total} étapes
            </span>
            <span className="tabular-nums">{pct} %</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-ink-800">
            <div
              className="h-full rounded-full bg-brand-500 transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      <div className="rounded-xl border border-ink-800 bg-ink-900 p-5">
        <ol className="space-y-4">
          {(job?.steps ?? []).map((step) => (
            <li key={step.id} className="flex gap-3">
              <Icone statut={step.status} />
              <div className="min-w-0 flex-1 pt-0.5">
                <p
                  className={`text-sm font-medium ${
                    step.status === "attente" ? "text-mist-400" : "text-mist-100"
                  }`}
                >
                  {step.label}
                </p>
                {step.detail && (
                  <p
                    className={`mt-0.5 text-xs leading-relaxed ${
                      step.status === "echec" ? "text-rose-warn" : "text-mist-400"
                    }`}
                  >
                    {step.detail}
                  </p>
                )}
              </div>
              {step.startedAt && step.endedAt && (
                <span className="shrink-0 pt-1 text-[11px] tabular-nums text-mist-400">
                  {((step.endedAt - step.startedAt) / 1000).toFixed(1)}s
                </span>
              )}
            </li>
          ))}
          {!job && (
            <li className="animate-pulse-soft text-sm text-mist-400">Connexion au traitement...</li>
          )}
        </ol>
      </div>

      {/* Echec a la recuperation : le depot du fichier resout le probleme, on le
          propose directement plutot que de laisser l'utilisateur devant une erreur. */}
      {job?.status === "erreur" && job.echecTelechargement && (
        <div className="mt-4 rounded-xl border border-ink-700 bg-ink-900 p-5">
          <p className="text-sm font-semibold text-mist-100">
            {job.url ? "Cette vidéo n'a pas pu être téléchargée" : "Téléchargement impossible"}
          </p>
          {job.url && (
            <p className="mt-1 truncate text-xs text-mist-400" title={job.url}>
              {job.url}
            </p>
          )}
          {/* Le detail technique est deja affiche sur l'etape en echec ci-dessus. */}

          <div className="mt-4 rounded-lg border border-brand-500/25 bg-brand-500/[0.06] px-4 py-3">
            <p className="text-sm font-medium text-brand-300">La solution la plus rapide</p>
            <p className="mt-1 text-xs leading-relaxed text-mist-300">
              Enregistre la vidéo sur ton téléphone ou ton ordinateur, puis dépose-la ici.
              L&apos;analyse sera identique — seules les statistiques du post (vues, likes) seront
              absentes du rapport.
            </p>
          </div>

          <div className="mt-4">
            <UploadDropzone compact />
          </div>

          <Link
            href="/analyser"
            className="mt-4 inline-block text-xs text-mist-400 underline transition hover:text-mist-200"
          >
            Retour à l&apos;accueil
          </Link>
        </div>
      )}

      {job?.status === "erreur" && !job.echecTelechargement && (
        <div className="mt-4 rounded-xl border border-rose-warn/30 bg-rose-warn/10 p-5">
          <p className="text-sm font-medium text-rose-warn">L&apos;analyse n&apos;a pas abouti</p>
          <p className="mt-1.5 text-sm leading-relaxed text-mist-200">{job.error}</p>
          <Link
            href="/analyser"
            className="mt-4 inline-block rounded-lg bg-ink-800 px-4 py-2 text-sm text-mist-100 transition hover:bg-ink-700"
          >
            Retour à l&apos;accueil
          </Link>
        </div>
      )}

      {deconnecte && job?.status !== "erreur" && (
        <div className="mt-4 rounded-lg border border-amber-glow/30 bg-amber-glow/10 px-4 py-3 text-sm text-amber-glow">
          Connexion au suivi perdue. L&apos;analyse continue peut-etre en arriere-plan :{" "}
          <button onClick={() => router.refresh()} className="underline">
            recharger la page
          </button>
          .
        </div>
      )}

      {job?.status !== "erreur" && (
        <p className="mt-4 text-center text-xs text-mist-400">
          Compte environ 1 a 3 minutes. Tu peux laisser cet onglet ouvert.
        </p>
      )}
    </div>
  );
}
