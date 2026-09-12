"use client";

import Link from "next/link";
import { useState } from "react";
import { Card } from "../ui";
import { evenement } from "../Pixels";
import type { UtilisateurPublic } from "@/lib/comptes";
import { COUT_CREDITS } from "@/lib/tarifs";

/* ============================================================================
   Espace personnel de l'abonne.

   Trois choses seulement : combien il lui reste, comment recharger, et le
   moyen de nous joindre. Un tableau de bord charge n'aide personne ici — ce
   que l'abonne veut savoir tient en un chiffre.
   ========================================================================== */

const NUMERO_WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP ?? "";

function joursRestants(expireLe: string | null): number | null {
  if (!expireLe) return null;
  const reste = new Date(expireLe).getTime() - Date.now();
  return reste > 0 ? Math.ceil(reste / (24 * 60 * 60 * 1000)) : 0;
}

export function EspaceCompte({ initial }: { initial: UtilisateurPublic }) {
  const [u, setU] = useState(initial);
  const [code, setCode] = useState("");
  const [erreur, setErreur] = useState("");
  const [succes, setSucces] = useState("");
  const [envoi, setEnvoi] = useState(false);

  const jours = joursRestants(u.expireLe);

  async function activer(e: React.FormEvent) {
    e.preventDefault();
    setErreur("");
    setSucces("");
    setEnvoi(true);

    try {
      const r = await fetch("/api/compte/activer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const d = (await r.json()) as {
        ok: boolean;
        message?: string;
        credits?: number;
        utilisateur?: UtilisateurPublic;
      };

      if (!d.ok) {
        setErreur(d.message ?? "L'activation a échoué.");
      } else {
        setSucces(`${d.credits} crédits ajoutés. Bonne analyse.`);
        setCode("");
        if (d.utilisateur) setU(d.utilisateur);
        evenement("Purchase", { currency: "DZD", content_name: d.utilisateur?.palier });
      }
    } catch {
      setErreur("Le serveur ne répond pas.");
    }
    setEnvoi(false);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-mist-100">Mon compte</h1>
        <p className="mt-0.5 text-sm text-mist-400">{u.email}</p>
      </div>

      {/* -------------------------------------------------------- le solde */}
      <Card className="p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-mist-400">
              Crédits restants
            </p>
            <p className="mt-1 text-4xl font-semibold tracking-tight text-brand-300">{u.credits}</p>
          </div>
          <div className="text-right">
            {u.actif ? (
              <>
                <p className="text-sm font-medium text-mist-100">{u.palier}</p>
                <p className="mt-0.5 text-xs text-mist-400">
                  {jours === null
                    ? ""
                    : jours > 1
                      ? `Encore ${jours} jours`
                      : jours === 1
                        ? "Dernier jour"
                        : "Expire aujourd'hui"}
                </p>
              </>
            ) : (
              <p className="rounded-full bg-amber-glow/12 px-3 py-1 text-xs font-medium text-amber-glow ring-1 ring-inset ring-amber-glow/30">
                {u.expireLe ? "Abonnement expiré" : "Compte non activé"}
              </p>
            )}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2 border-t border-ink-800 pt-4 text-center">
          {[
            ["Image", COUT_CREDITS.image],
            ["Vidéo courte", COUT_CREDITS.videoCourte],
            ["Vidéo longue", COUT_CREDITS.videoLongue],
          ].map(([label, cout]) => (
            <div key={label as string}>
              <p className="text-sm font-semibold text-mist-100">{cout}</p>
              <p className="mt-0.5 text-[11px] leading-tight text-mist-500">{label} </p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-center text-xs text-mist-500">
          Une analyse ratée ne coûte rien : les crédits sont rendus automatiquement.
        </p>

        {u.actif && u.credits > 0 && (
          <Link
            href="/analyser"
            className="mt-4 block rounded-lg bg-brand-500 px-4 py-2.5 text-center text-sm font-semibold text-ink-950 transition hover:bg-brand-400"
          >
            Analyser une créative
          </Link>
        )}
      </Card>

      {/* ------------------------------------------------- saisie du code */}
      <Card className="p-5">
        <h2 className="text-sm font-semibold text-mist-100">
          {u.actif ? "Ajouter des crédits" : "Activer mon compte"}
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-mist-400">
          Saisis le code reçu après ton paiement. Les tirets et les majuscules n&apos;ont pas
          d&apos;importance.
        </p>

        <form onSubmit={activer} className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="HK-XXXX-XXXX"
            autoComplete="off"
            spellCheck={false}
            className="min-w-0 flex-1 rounded-lg border border-ink-700 bg-ink-950 px-3.5 py-2.5 font-mono text-sm uppercase tracking-wider text-mist-100 outline-none transition placeholder:font-sans placeholder:tracking-normal placeholder:text-mist-500 focus:border-brand-500"
          />
          <button
            type="submit"
            disabled={envoi || !code.trim()}
            className="shrink-0 rounded-lg border border-brand-500/50 bg-brand-500/10 px-5 py-2.5 text-sm font-semibold text-brand-300 transition hover:bg-brand-500/20 disabled:opacity-40"
          >
            {envoi ? "..." : "Activer"}
          </button>
        </form>

        {erreur && <p className="mt-2 text-xs text-rose-warn">{erreur}</p>}
        {succes && <p className="mt-2 text-xs text-jade">{succes}</p>}
      </Card>

      {/* ------------------------------------------------------- recharger */}
      <Card className="p-5">
        <h2 className="text-sm font-semibold text-mist-100">Comment obtenir un code</h2>
        <ol className="mt-3 space-y-2.5 text-sm leading-relaxed text-mist-300">
          <li className="flex gap-2.5">
            <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-ink-800 text-[11px] font-semibold text-mist-300">
              1
            </span>
            <span>
              Écris-nous sur WhatsApp en précisant la formule qui t&apos;intéresse.{" "}
              <Link href="/tarifs" className="text-brand-300 underline underline-offset-4">
                Voir les formules
              </Link>
            </span>
          </li>
          <li className="flex gap-2.5">
            <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-ink-800 text-[11px] font-semibold text-mist-300">
              2
            </span>
            <span>On t&apos;appelle pour confirmer et te donner les coordonnées de paiement.</span>
          </li>
          <li className="flex gap-2.5">
            <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-ink-800 text-[11px] font-semibold text-mist-300">
              3
            </span>
            <span>
              Tu payes par BaridiMob ou CCP, tu envoies la capture, et ton code arrive dans la
              foulée.
            </span>
          </li>
        </ol>

        {NUMERO_WHATSAPP && (
          <a
            href={`https://wa.me/${NUMERO_WHATSAPP}?text=${encodeURIComponent(
              `Bonjour, je veux recharger mon compte Hooked Lab (${u.email}).`,
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 flex items-center justify-center gap-2 rounded-lg border border-jade/40 bg-jade/10 px-4 py-2.5 text-sm font-medium text-jade transition hover:bg-jade/20"
          >
            Nous écrire sur WhatsApp
          </a>
        )}
      </Card>

      <div className="text-center">
        <button
          onClick={async () => {
            await fetch("/api/compte/session", { method: "DELETE" });
            window.location.href = "/";
          }}
          className="text-xs text-mist-500 underline underline-offset-4 transition hover:text-mist-300"
        >
          Se déconnecter
        </button>
      </div>
    </div>
  );
}
