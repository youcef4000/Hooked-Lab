"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Card } from "../ui";
import { evenement } from "../Pixels";
import { useDevise } from "../Devise";
import type { UtilisateurPublic } from "@/lib/comptes";
import {
  COUT_CREDITS,
  ENGAGEMENTS,
  PALIERS,
  RECHARGES,
  formatPrix,
  prixRecharge,
  totalPalier,
  videosPour,
} from "@/lib/tarifs";

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

/* ------------------------------------------------------ paiement carte */

function PaiementCarte({ actif }: { actif: boolean }) {
  const [deviseAffichee, setDevise] = useDevise();
  // La carte se paie en euros ou en dollars ; un visiteur detecte en Algerie
  // voit les dollars, la devise des cartes RedotPay.
  const devise = deviseAffichee === "EUR" ? "EUR" : "USD";
  const [onglet, setOnglet] = useState<"abonnement" | "recharge">(actif ? "recharge" : "abonnement");
  const [palier, setPalier] = useState("Pro");
  const [mois, setMois] = useState(1);
  const [recharge, setRecharge] = useState<number>(RECHARGES[1].credits);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");

  const p = PALIERS.find((x) => x.nom === palier) ?? PALIERS[1];
  const e = ENGAGEMENTS.find((x) => x.mois === mois) ?? ENGAGEMENTS[0];
  const r = RECHARGES.find((x) => x.credits === recharge) ?? RECHARGES[1];
  const montant = onglet === "abonnement" ? totalPalier(p, devise, e.remise, e.mois) : prixRecharge(r, devise);

  async function payer() {
    setErreur("");
    setEnvoi(true);
    evenement("InitiateCheckout", { currency: devise, value: montant, content_name: onglet === "abonnement" ? palier : `Recharge ${recharge}` });
    try {
      const res = await fetch("/api/paiement/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          onglet === "abonnement"
            ? { type: "abonnement", reference: palier, mois, devise }
            : { type: "recharge", reference: recharge, devise },
        ),
      });
      const d = (await res.json()) as { ok: boolean; url?: string; message?: string };
      if (d.ok && d.url) {
        window.location.href = d.url;
        return;
      }
      setErreur(d.message ?? "Le paiement n'a pas pu démarrer.");
    } catch {
      setErreur("Le serveur ne répond pas.");
    }
    setEnvoi(false);
  }

  const pastille = (choisi: boolean) =>
    `rounded-lg border px-3 py-2 text-left text-sm transition ${
      choisi ? "border-brand-500 bg-brand-500/10 text-mist-100" : "border-ink-700 text-mist-300 hover:border-ink-600"
    }`;

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-mist-100">Payer par carte</h2>
          <p className="mt-1 text-xs leading-relaxed text-mist-400">
            Visa, Mastercard, RedotPay. Crédits ajoutés dès la validation du paiement.
          </p>
        </div>
        <div className="inline-flex rounded-full border border-ink-700 bg-ink-900 p-1">
          {(["USD", "EUR"] as const).map((d) => (
            <button
              key={d}
              onClick={() => setDevise(d)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                devise === d ? "bg-mist-100 text-ink-950" : "text-mist-300 hover:text-mist-100"
              }`}
            >
              {d === "USD" ? "$" : "€"}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-1 rounded-lg bg-ink-950 p-1">
        {(["abonnement", "recharge"] as const).map((o) => (
          <button
            key={o}
            onClick={() => setOnglet(o)}
            className={`rounded-md px-3 py-2 text-xs font-semibold transition ${
              onglet === o ? "bg-ink-800 text-mist-100" : "text-mist-400 hover:text-mist-200"
            }`}
          >
            {o === "abonnement" ? "Abonnement" : "Recharge de crédits"}
          </button>
        ))}
      </div>

      {onglet === "abonnement" ? (
        <div className="mt-4 space-y-3">
          <div className="grid gap-2 sm:grid-cols-3">
            {PALIERS.map((x) => (
              <button key={x.nom} onClick={() => setPalier(x.nom)} className={pastille(palier === x.nom)}>
                <span className="block font-medium">{x.nom}</span>
                <span className="block text-xs text-mist-400">{videosPour(x.creditsMensuels)} vidéos / mois</span>
              </button>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {ENGAGEMENTS.map((x) => (
              <button key={x.mois} onClick={() => setMois(x.mois)} className={pastille(mois === x.mois)}>
                <span className="block text-center font-medium">{x.libelle}</span>
                {x.remise > 0 && (
                  <span className="block text-center text-[11px] text-jade">−{Math.round(x.remise * 100)} %</span>
                )}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          {RECHARGES.map((x) => (
            <button key={x.credits} onClick={() => setRecharge(x.credits)} className={pastille(recharge === x.credits)}>
              <span className="block font-medium">{x.credits} crédits</span>
              <span className="block text-xs text-mist-400">
                {videosPour(x.credits)} vidéos · {formatPrix(prixRecharge(x, devise), devise)}
              </span>
            </button>
          ))}
        </div>
      )}

      <button
        onClick={payer}
        disabled={envoi}
        className="cta-aurora mt-4 w-full rounded-full px-5 py-3 text-sm font-semibold disabled:opacity-60"
      >
        {envoi ? "Ouverture du paiement sécurisé…" : `Payer ${formatPrix(montant, devise)}`}
      </button>
      <p className="mt-2 text-center text-[11px] text-mist-500">
        Paiement sécurisé par Stripe. Aucun numéro de carte ne passe par Hooked Lab.
      </p>
      {erreur && <p className="mt-2 text-center text-xs text-rose-warn">{erreur}</p>}
    </Card>
  );
}

export function EspaceCompte({
  initial,
  paiementCarte = false,
  retourPaiement,
}: {
  initial: UtilisateurPublic;
  paiementCarte?: boolean;
  retourPaiement?: "ok" | "annule";
}) {
  const [u, setU] = useState(initial);
  const [attentePaiement, setAttentePaiement] = useState(retourPaiement === "ok");

  /* Retour de Stripe : le webhook credite en quelques secondes. On relit le
     solde jusqu'a le voir bouger, plutot que de demander de rafraichir. */
  useEffect(() => {
    if (retourPaiement !== "ok") return;
    const depart = initial.credits;
    let essais = 0;
    const minuterie = setInterval(async () => {
      essais++;
      try {
        const d = (await (await fetch("/api/compte/session")).json()) as { utilisateur?: UtilisateurPublic };
        if (d.utilisateur && d.utilisateur.credits !== depart) {
          setU(d.utilisateur);
          setAttentePaiement(false);
          evenement("Purchase", { currency: "USD", content_name: d.utilisateur.palier });
          clearInterval(minuterie);
        }
      } catch {
        /* nouvel essai au prochain tour */
      }
      if (essais >= 20) {
        setAttentePaiement(false);
        clearInterval(minuterie);
      }
    }, 2000);
    // Retire ?paiement=ok de l'adresse : un rechargement ne relancera pas l'attente.
    window.history.replaceState(null, "", "/compte");
    return () => clearInterval(minuterie);
  }, [retourPaiement, initial.credits]);
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

      {retourPaiement === "ok" && (
        <div className="rounded-[var(--r-lg)] border border-jade/35 bg-jade/10 px-5 py-4">
          <p className="text-sm font-medium text-jade">
            {attentePaiement ? "Paiement reçu — tes crédits arrivent…" : "Paiement confirmé. Tes crédits sont disponibles."}
          </p>
          {!attentePaiement && u.credits === initial.credits && (
            <p className="mt-1 text-xs text-mist-300">
              Si ton solde n&apos;a pas bougé d&apos;ici une minute, écris-nous sur WhatsApp avec ton email : on
              vérifie tout de suite.
            </p>
          )}
        </div>
      )}
      {retourPaiement === "annule" && (
        <div className="rounded-[var(--r-lg)] border border-ink-700 bg-ink-900 px-5 py-4 text-sm text-mist-300">
          Paiement annulé : rien n&apos;a été débité.
        </div>
      )}

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

        <div className="mt-5 grid grid-cols-2 gap-2 border-t border-ink-800 pt-4 text-center">
          {[
            ["Vidéo, jusqu'à 3 min", COUT_CREDITS.video],
            ["Image", COUT_CREDITS.image],
          ].map(([label, cout]) => (
            <div key={label as string}>
              <p className="text-sm font-semibold text-mist-100">{cout} crédits</p>
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

      {paiementCarte && <PaiementCarte actif={u.actif} />}

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
        <h2 className="text-sm font-semibold text-mist-100">Payer en dinars (BaridiMob ou CCP)</h2>
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
