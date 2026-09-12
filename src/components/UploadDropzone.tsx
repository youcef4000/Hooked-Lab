"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { evenement } from "./Pixels";
import {
  ACCEPT_INPUT,
  EXTENSIONS_ACCEPTEES,
  TAILLE_MAX_OCTETS,
  extensionAcceptee,
  formatTaille,
} from "@/lib/upload-limites";

type Etat = "attente" | "envoi" | "verification" | "erreur";

export function UploadDropzone({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);

  const [etat, setEtat] = useState<Etat>("attente");
  const [survol, setSurvol] = useState(false);
  const [pourcentage, setPourcentage] = useState(0);
  const [nomFichier, setNomFichier] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);

  function valider(fichier: File): string | null {
    if (!extensionAcceptee(fichier.name)) {
      return `Format non pris en charge. Formats acceptes : ${EXTENSIONS_ACCEPTEES.join(", ")}.`;
    }
    if (fichier.size > TAILLE_MAX_OCTETS) {
      return `Fichier trop volumineux (${formatTaille(fichier.size)}). La limite est ${formatTaille(TAILLE_MAX_OCTETS)}.`;
    }
    if (fichier.size === 0) return "Ce fichier est vide.";
    return null;
  }

  function envoyer(fichier: File) {
    const probleme = valider(fichier);
    if (probleme) {
      setErreur(probleme);
      setEtat("erreur");
      setNomFichier(fichier.name);
      return;
    }

    setNomFichier(fichier.name);
    setErreur(null);
    setPourcentage(0);
    setEtat("envoi");

    const xhr = new XMLHttpRequest();
    xhrRef.current = xhr;
    xhr.open("POST", "/api/analyze/fichier");
    xhr.setRequestHeader("Content-Type", "application/octet-stream");
    xhr.setRequestHeader("x-nom-fichier", encodeURIComponent(fichier.name));

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) setPourcentage(Math.round((e.loaded / e.total) * 100));
    };

    // Transfert termine : le serveur verifie maintenant le contenu du fichier.
    xhr.upload.onload = () => {
      setPourcentage(100);
      setEtat("verification");
    };

    xhr.onload = () => {
      let data: { id?: string; error?: string } = {};
      try {
        data = JSON.parse(xhr.responseText);
      } catch {
        /* reponse non JSON : message generique ci-dessous */
      }

      if (xhr.status >= 200 && xhr.status < 300 && data.id) {
        evenement("Lead", { content_name: "analyse_lancee", source: "fichier" });
        router.push(`/analyse/${data.id}`);
        return;
      }
      setErreur(data.error ?? `Le serveur a refuse le fichier (erreur ${xhr.status}).`);
      setEtat("erreur");
    };

    xhr.onerror = () => {
      setErreur("Le transfert a echoue. Vérifie que le serveur tourne toujours, puis réessaie.");
      setEtat("erreur");
    };

    xhr.onabort = () => {
      setEtat("attente");
      setPourcentage(0);
      setNomFichier("");
    };

    xhr.send(fichier);
  }

  function annuler() {
    xhrRef.current?.abort();
  }

  function reinitialiser() {
    setEtat("attente");
    setErreur(null);
    setPourcentage(0);
    setNomFichier("");
    if (inputRef.current) inputRef.current.value = "";
  }

  const occupe = etat === "envoi" || etat === "verification";

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!occupe) setSurvol(true);
        }}
        onDragLeave={() => setSurvol(false)}
        onDrop={(e) => {
          e.preventDefault();
          setSurvol(false);
          if (occupe) return;
          const fichier = e.dataTransfer.files?.[0];
          if (fichier) envoyer(fichier);
        }}
        onClick={() => {
          if (!occupe) inputRef.current?.click();
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && !occupe) inputRef.current?.click();
        }}
        className={`relative w-full rounded-xl border-2 border-dashed text-center transition ${
          compact ? "px-5 py-6" : "px-6 py-10"
        } ${
          occupe
            ? "cursor-default border-ink-700 bg-ink-850"
            : survol
              ? "cursor-pointer border-brand-400 bg-brand-500/10"
              : etat === "erreur"
                ? "cursor-pointer border-rose-warn/50 bg-rose-warn/[0.06] hover:border-rose-warn"
                : "cursor-pointer border-ink-600 bg-ink-900 hover:border-brand-500/60 hover:bg-ink-850"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT_INPUT}
          className="hidden"
          onChange={(e) => {
            const fichier = e.target.files?.[0];
            if (fichier) envoyer(fichier);
          }}
        />

        {etat === "attente" && (
          <>
            <span
              className={`mx-auto mb-3 grid place-items-center rounded-full bg-brand-500/12 text-brand-400 ring-1 ring-brand-500/25 ${
                compact ? "h-10 w-10" : "h-12 w-12"
              }`}
            >
              <svg
                viewBox="0 0 24 24"
                className={compact ? "h-5 w-5" : "h-6 w-6"}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 16V4m0 0L8 8m4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" strokeLinecap="round" />
              </svg>
            </span>
            <p className={`font-semibold text-mist-100 ${compact ? "text-sm" : "text-base"}`}>
              {compact ? "Déposé la vidéo ou l’image ici" : "Glisse ta vidéo ou ton image ici"}
            </p>
            <p className="mt-1 text-xs text-mist-400">
              ou clique pour parcourir tes fichiers — {EXTENSIONS_ACCEPTEES.join(", ")} jusqu&apos;a{" "}
              {formatTaille(TAILLE_MAX_OCTETS)}
            </p>
          </>
        )}

        {occupe && (
          <>
            <p className="truncate text-sm font-medium text-mist-100" title={nomFichier}>
              {nomFichier}
            </p>
            <div className="mx-auto mt-3 max-w-sm">
              <div className="h-2 overflow-hidden rounded-full bg-ink-800">
                <div
                  className={`h-full rounded-full bg-brand-500 transition-all duration-200 ${
                    etat === "verification" ? "animate-pulse-soft" : ""
                  }`}
                  style={{ width: `${pourcentage}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-mist-300">
                {etat === "envoi" ? (
                  <>
                    Transfert en cours — <span className="tabular-nums">{pourcentage} %</span>
                  </>
                ) : (
                  "Vérification du fichier..."
                )}
              </p>
            </div>
            {etat === "envoi" && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  annuler();
                }}
                className="mt-3 rounded-md border border-ink-700 px-3 py-1 text-xs text-mist-400 transition hover:text-mist-200"
              >
                Annuler
              </button>
            )}
          </>
        )}

        {etat === "erreur" && (
          <>
            <span className="mx-auto mb-3 grid h-10 w-10 place-items-center rounded-full bg-rose-warn/15 text-rose-warn ring-1 ring-rose-warn/30">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 8v5M12 17h.01" strokeLinecap="round" />
                <circle cx="12" cy="12" r="9" />
              </svg>
            </span>
            {nomFichier && (
              <p className="truncate text-xs text-mist-400" title={nomFichier}>
                {nomFichier}
              </p>
            )}
            <p className="mx-auto mt-1.5 max-w-md text-sm leading-relaxed text-rose-warn">{erreur}</p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                reinitialiser();
              }}
              className="mt-3 rounded-md border border-ink-700 bg-ink-800 px-3 py-1.5 text-xs text-mist-200 transition hover:bg-ink-700"
            >
              Choisir un autre fichier
            </button>
          </>
        )}
      </div>
    </div>
  );
}
