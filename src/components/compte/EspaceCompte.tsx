"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Card } from "../ui";
import { evenement } from "../Pixels";
import { useDevise, SelecteurDevise } from "../Devise";
import { useLangue, useT } from "../Langue";
import type { UtilisateurPublic } from "@/lib/comptes";
import { EMAIL_SUPPORT } from "@/lib/public";
import { locale } from "@/lib/langue";
import {
  COUT_CREDITS,
  ENGAGEMENTS,
  PALIERS,
  RECHARGES,
  formatPrix,
  prixPalier,
  totalPalier,
  videosPour,
} from "@/lib/tarifs";

/* ============================================================================
   Espace personnel de l'abonne.

   Ce que l'abonne vient chercher tient en deux choses : combien il lui
   reste, et comment en reprendre. Le paiement par carte (Stripe) est le
   seul chemin : il ouvre l'acces sur place. Sans formule active, il passe
   en tete de page. Le code cadeau reste discret, replie en bas.
   ========================================================================== */

const TEXTES = {
  fr: {
    titre: "Mon compte",
    restants: "Crédits restants",
    encore: (j: number) => (j > 1 ? `Encore ${j} jours` : j === 1 ? "Dernier jour" : "Expire aujourd'hui"),
    expire: "Abonnement expiré",
    inactif: "Aucune formule active",
    video: "Vidéo, toutes durées",
    image: "Image",
    credits: (n: number) => `${n} crédits`,
    echec: "Une analyse ratée ne coûte rien : les crédits sont rendus automatiquement.",
    analyser: "Analyser une créative",
    recuTitre: (attente: boolean): string => (attente ? "Paiement reçu — tes crédits arrivent…" : "Paiement confirmé. Tes crédits sont disponibles."),
    recuAide: (email: string) => `Si ton solde n'a pas bougé d'ici une minute, recharge la page. Toujours rien ? Écris à ${email} : on vérifie tout de suite.`,
    annule: "Paiement annulé : rien n'a été débité.",
    carteTitre: (actif: boolean): string => (actif ? "Reprendre des crédits" : "Choisir ma formule"),
    carteAide: "Carte Visa ou Mastercard, Apple Pay, Google Pay. L'accès s'ouvre dès la validation du paiement.",
    abonnement: "Abonnement",
    recharge: "Recharge de crédits",
    videosMois: (n: number) => `${n} vidéos / mois`,
    videos: (n: number) => `${n} vidéos`,
    remise: (p: number) => `−${p} %`,
    ouverture: "Ouverture du paiement sécurisé…",
    payer: (m: string) => `Payer ${m}`,
    securite: "Paiement sécurisé par Stripe. Aucun numéro de carte ne passe par Hooked Lab.",
    parMois: (m: string) => `Soit ${m} par mois, réglés en une fois pour l'année.`,
    erreurPaiement: "Le paiement n'a pas pu démarrer.",
    serveur: "Le serveur ne répond pas.",
    codeTitre: "J'ai un code cadeau",
    codeAide: "Code offert ou partenaire. Les tirets et les majuscules n'ont pas d'importance.",
    activer: "Activer",
    codeOk: (n?: number) => `${n} crédits ajoutés. Bonne analyse.`,
    codeEchec: "L'activation a échoué.",
    aide: "Une question sur ton compte ?",
    deconnexion: "Se déconnecter",
  },
  en: {
    titre: "My account",
    restants: "Credits left",
    encore: (j: number) => (j > 1 ? `${j} days left` : j === 1 ? "Last day" : "Expires today"),
    expire: "Subscription expired",
    inactif: "No active plan",
    video: "Video, any length",
    image: "Image",
    credits: (n: number) => `${n} credits`,
    echec: "A failed analysis costs nothing: credits are refunded automatically.",
    analyser: "Analyse a creative",
    recuTitre: (attente: boolean): string => (attente ? "Payment received — your credits are on their way…" : "Payment confirmed. Your credits are ready."),
    recuAide: (email: string) => `If your balance hasn't changed within a minute, reload the page. Still nothing? Email ${email}: we'll check right away.`,
    annule: "Payment cancelled: nothing was charged.",
    carteTitre: (actif: boolean): string => (actif ? "Get more credits" : "Choose my plan"),
    carteAide: "Visa or Mastercard, Apple Pay, Google Pay. Access opens as soon as the payment clears.",
    abonnement: "Subscription",
    recharge: "Credit top-up",
    videosMois: (n: number) => `${n} videos / month`,
    videos: (n: number) => `${n} videos`,
    remise: (p: number) => `−${p}%`,
    ouverture: "Opening secure checkout…",
    payer: (m: string) => `Pay ${m}`,
    securite: "Secure payment by Stripe. No card number ever goes through Hooked Lab.",
    parMois: (m: string) => `That's ${m} a month, paid once for the year.`,
    erreurPaiement: "The payment could not start.",
    serveur: "The server is not responding.",
    codeTitre: "I have a gift code",
    codeAide: "Gift or partner code. Dashes and capital letters don't matter.",
    activer: "Activate",
    codeOk: (n?: number) => `${n} credits added. Happy analysing.`,
    codeEchec: "Activation failed.",
    aide: "A question about your account?",
    deconnexion: "Sign out",
  },
};

function joursRestants(expireLe: string | null): number | null {
  if (!expireLe) return null;
  const reste = new Date(expireLe).getTime() - Date.now();
  return reste > 0 ? Math.ceil(reste / (24 * 60 * 60 * 1000)) : 0;
}

/* ------------------------------------------------------ paiement carte */

function PaiementCarte({
  actif,
  formuleInitiale,
  periodeInitiale,
}: {
  actif: boolean;
  formuleInitiale?: string;
  periodeInitiale?: number;
}) {
  const langue = useLangue();
  const t = useT(TEXTES);
  const [devise, setDevise] = useDevise();
  const formuleConnue = PALIERS.some((p) => p.nom === formuleInitiale);
  const [onglet, setOnglet] = useState<"abonnement" | "recharge">(actif && !formuleConnue ? "recharge" : "abonnement");
  const [palier, setPalier] = useState(formuleConnue ? formuleInitiale! : "Pro");
  const [mois, setMois] = useState<number>(periodeInitiale === 12 ? 12 : 1);
  const [recharge, setRecharge] = useState<number>(RECHARGES[1].credits);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");

  const p = PALIERS.find((x) => x.nom === palier) ?? PALIERS[1];
  const e = ENGAGEMENTS.find((x) => x.mois === mois) ?? ENGAGEMENTS[0];
  const r = RECHARGES.find((x) => x.credits === recharge) ?? RECHARGES[1];
  const montant = onglet === "abonnement" ? totalPalier(p, e.remise, e.mois) : r.prix;

  async function payer() {
    setErreur("");
    setEnvoi(true);
    evenement("InitiateCheckout", {
      currency: devise,
      value: montant,
      content_name: onglet === "abonnement" ? palier : `Top-up ${recharge}`,
    });
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
      setErreur(d.message ?? t.erreurPaiement);
    } catch {
      setErreur(t.serveur);
    }
    setEnvoi(false);
  }

  const pastille = (choisi: boolean) =>
    `rounded-[var(--r-md)] border px-3 py-2.5 text-left text-sm transition ${
      choisi ? "border-brand-500 bg-brand-500/10 text-mist-100" : "border-ink-700 text-mist-300 hover:border-ink-600"
    }`;

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-mist-100">{t.carteTitre(actif)}</h2>
          <p className="mt-1 text-xs leading-relaxed text-mist-400">{t.carteAide}</p>
        </div>
        <SelecteurDevise devise={devise} onChange={setDevise} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-1 rounded-[var(--r-md)] bg-ink-950 p-1">
        {(["abonnement", "recharge"] as const).map((o) => (
          <button
            key={o}
            onClick={() => setOnglet(o)}
            className={`rounded-[var(--r-sm)] px-3 py-2 text-xs font-semibold transition ${
              onglet === o ? "bg-ink-800 text-mist-100" : "text-mist-400 hover:text-mist-200"
            }`}
          >
            {o === "abonnement" ? t.abonnement : t.recharge}
          </button>
        ))}
      </div>

      {onglet === "abonnement" ? (
        <div className="mt-4 space-y-3">
          <div className="grid gap-2 sm:grid-cols-3">
            {PALIERS.map((x) => (
              <button key={x.nom} onClick={() => setPalier(x.nom)} className={pastille(palier === x.nom)}>
                <span className="block font-medium">{x.nom}</span>
                <span className="block text-xs text-mist-400">{t.videosMois(videosPour(x.creditsMensuels))}</span>
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {ENGAGEMENTS.map((x) => (
              <button key={x.mois} onClick={() => setMois(x.mois)} className={pastille(mois === x.mois)}>
                <span className="block text-center font-medium">
                  {x.libelle[langue]}
                  {x.remise > 0 && <span className="ml-1.5 text-[11px] text-jade">{t.remise(Math.round(x.remise * 100))}</span>}
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          {RECHARGES.map((x) => (
            <button key={x.credits} onClick={() => setRecharge(x.credits)} className={pastille(recharge === x.credits)}>
              <span className="block font-medium">{t.credits(x.credits)}</span>
              <span className="block text-xs text-mist-400">
                {t.videos(videosPour(x.credits))} · {formatPrix(x.prix, devise, langue)}
              </span>
            </button>
          ))}
        </div>
      )}

      <button
        onClick={payer}
        disabled={envoi}
        className="cta-aurora mt-5 w-full rounded-full px-5 py-3.5 text-sm font-semibold disabled:opacity-60"
      >
        {envoi ? t.ouverture : t.payer(formatPrix(montant, devise, langue))}
      </button>
      {onglet === "abonnement" && e.mois > 1 && (
        <p className="mt-2 text-center text-xs text-jade">{t.parMois(formatPrix(prixPalier(p, e.remise), devise, langue))}</p>
      )}
      <p className="mt-2 text-center text-[11px] text-mist-500">{t.securite}</p>
      {erreur && <p className="mt-2 text-center text-xs text-rose-warn">{erreur}</p>}
    </Card>
  );
}

/* --------------------------------------------------------------- page */

export function EspaceCompte({
  initial,
  paiementCarte = true,
  retourPaiement,
  formule,
  periode,
}: {
  initial: UtilisateurPublic;
  paiementCarte?: boolean;
  retourPaiement?: "ok" | "annule";
  /** Formule choisie sur la page Tarifs avant l'inscription : preselectionnee. */
  formule?: string;
  periode?: number;
}) {
  const langue = useLangue();
  const t = useT(TEXTES);
  const [u, setU] = useState(initial);
  const [code, setCode] = useState("");
  const [erreur, setErreur] = useState("");
  const [succes, setSucces] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [attentePaiement, setAttentePaiement] = useState(retourPaiement === "ok");
  const [codeOuvert, setCodeOuvert] = useState(false);

  const jours = joursRestants(u.expireLe);

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
          evenement("Purchase", { content_name: d.utilisateur.palier });
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
      const d = (await r.json()) as { ok: boolean; message?: string; credits?: number; utilisateur?: UtilisateurPublic };
      if (!d.ok) {
        setErreur(d.message ?? t.codeEchec);
      } else {
        setSucces(t.codeOk(d.credits));
        setCode("");
        if (d.utilisateur) setU(d.utilisateur);
        evenement("Purchase", { content_name: d.utilisateur?.palier });
      }
    } catch {
      setErreur(t.serveur);
    }
    setEnvoi(false);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-mist-100">{t.titre}</h1>
        <p className="mt-0.5 text-sm text-mist-400">{u.email}</p>
      </div>

      {retourPaiement === "ok" && (
        <div className="rounded-[var(--r-lg)] border border-jade/35 bg-jade/10 px-5 py-4">
          <p className="text-sm font-medium text-jade">{t.recuTitre(attentePaiement)}</p>
          {!attentePaiement && u.credits === initial.credits && (
            <p className="mt-1 text-xs text-mist-300">{t.recuAide(EMAIL_SUPPORT)}</p>
          )}
        </div>
      )}
      {retourPaiement === "annule" && (
        <div className="rounded-[var(--r-lg)] border border-ink-700 bg-ink-900 px-5 py-4 text-sm text-mist-300">{t.annule}</div>
      )}

      {paiementCarte && !u.actif && (
        <PaiementCarte actif={u.actif} formuleInitiale={formule} periodeInitiale={periode} />
      )}

      {/* -------------------------------------------------------- le solde */}
      <Card className="p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-mist-400">{t.restants}</p>
            <p className="mt-1 text-4xl font-semibold tracking-tight text-brand-300">{u.credits.toLocaleString(locale(langue))}</p>
          </div>
          <div className="text-right">
            {u.actif ? (
              <>
                <p className="text-sm font-medium text-mist-100">{u.palier}</p>
                <p className="mt-0.5 text-xs text-mist-400">{jours === null ? "" : t.encore(jours)}</p>
              </>
            ) : (
              <p className="rounded-full bg-amber-glow/12 px-3 py-1 text-xs font-medium text-amber-glow ring-1 ring-inset ring-amber-glow/30">
                {u.expireLe ? t.expire : t.inactif}
              </p>
            )}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2 border-t border-ink-800 pt-4 text-center">
          {[
            [t.video, COUT_CREDITS.video],
            [t.image, COUT_CREDITS.image],
          ].map(([label, cout]) => (
            <div key={label as string}>
              <p className="text-sm font-semibold text-mist-100">{t.credits(cout as number)}</p>
              <p className="mt-0.5 text-[11px] leading-tight text-mist-500">{label}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-center text-xs text-mist-500">{t.echec}</p>

        {u.actif && u.credits > 0 && (
          <Link
            href="/analyser"
            className="mt-4 block rounded-full bg-brand-500 px-4 py-2.5 text-center text-sm font-semibold text-ink-950 transition hover:bg-brand-400"
          >
            {t.analyser}
          </Link>
        )}
      </Card>

      {paiementCarte && u.actif && (
        <PaiementCarte actif={u.actif} formuleInitiale={formule} periodeInitiale={periode} />
      )}

      {/* ------------------------------------------ code cadeau, replie */}
      <Card className="p-5">
        <button
          onClick={() => setCodeOuvert((o) => !o)}
          aria-expanded={codeOuvert}
          className="flex w-full items-center justify-between text-left text-sm font-medium text-mist-200 transition hover:text-mist-100"
        >
          {t.codeTitre}
          <span className={`text-mist-500 transition ${codeOuvert ? "rotate-180" : ""}`}>⌄</span>
        </button>
        {codeOuvert && (
          <>
        <p className="mt-2 text-xs leading-relaxed text-mist-400">{t.codeAide}</p>
        <form onSubmit={activer} className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="HK-XXXX-XXXX"
            autoComplete="off"
            spellCheck={false}
            className="min-w-0 flex-1 rounded-[var(--r-md)] border border-ink-700 bg-ink-950 px-3.5 py-2.5 font-mono text-sm uppercase tracking-wider text-mist-100 outline-none transition placeholder:font-sans placeholder:tracking-normal placeholder:text-mist-500 focus:border-brand-500"
          />
          <button
            type="submit"
            disabled={envoi || !code.trim()}
            className="shrink-0 rounded-[var(--r-md)] border border-brand-500/50 bg-brand-500/10 px-5 py-2.5 text-sm font-semibold text-brand-300 transition hover:bg-brand-500/20 disabled:opacity-40"
          >
            {envoi ? "…" : t.activer}
          </button>
        </form>
          </>
        )}
        {erreur && <p className="mt-2 text-xs text-rose-warn">{erreur}</p>}
        {succes && <p className="mt-2 text-xs text-jade">{succes}</p>}
      </Card>

      <p className="text-center text-xs text-mist-500">
        {t.aide}{" "}
        <a href={`mailto:${EMAIL_SUPPORT}`} className="text-brand-300 underline underline-offset-4 hover:text-brand-400">
          {EMAIL_SUPPORT}
        </a>
      </p>

      <div className="text-center">
        <button
          onClick={async () => {
            await fetch("/api/compte/session", { method: "DELETE" });
            window.location.href = "/";
          }}
          className="text-xs text-mist-500 underline underline-offset-4 transition hover:text-mist-300"
        >
          {t.deconnexion}
        </button>
      </div>
    </div>
  );
}
