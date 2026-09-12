"use client";

import { useMemo, useState } from "react";
import { Card } from "../ui";
import { CopyButton } from "../CopyButton";
import { ENGAGEMENTS, PALIERS, RECHARGES, creditsBonus } from "@/lib/tarifs";
import type { CodeActivation, TypeCode } from "@/lib/codes";

/* ============================================================================
   Fabrique de codes.

   Le geste courant : un client vient de payer, on lui fabrique son code et on
   le colle dans WhatsApp. Tout est donc pense pour tenir en trois clics, avec
   le code copiable immediatement apres generation.

   La note est le champ le plus important a l'usage : dans six mois, "Karim
   0661… BaridiMob 12/03" est la seule chose qui permettra de retrouver a quoi
   correspondait une vente.
   ========================================================================== */

function quand(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function GestionCodes({ initiaux }: { initiaux: CodeActivation[] }) {
  const [codes, setCodes] = useState(initiaux);
  const [type, setType] = useState<TypeCode>("abonnement");
  const [palier, setPalier] = useState(PALIERS[0].nom);
  const [mois, setMois] = useState(1);
  const [recharge, setRecharge] = useState(String(RECHARGES[0].credits));
  const [note, setNote] = useState("");
  const [quantite, setQuantite] = useState(1);
  const [erreur, setErreur] = useState("");
  const [derniers, setDerniers] = useState<CodeActivation[]>([]);
  const [envoi, setEnvoi] = useState(false);
  const [filtre, setFiltre] = useState<"tous" | "disponibles" | "utilises">("tous");

  // Ce que le client recevra : calcule ici pour verifier avant de generer.
  const apercu = useMemo(() => {
    if (type === "recharge") {
      const r = RECHARGES.find((x) => String(x.credits) === recharge);
      return r ? { credits: r.credits, montant: r.prix, duree: "sans prolongation" } : null;
    }
    const p = PALIERS.find((x) => x.nom === palier);
    const e = ENGAGEMENTS.find((x) => x.mois === mois);
    if (!p || !e) return null;
    const mensuel = Math.round((p.base * (1 - e.remise)) / 100) * 100;
    return {
      credits: p.creditsMensuels * e.mois + creditsBonus(p.creditsMensuels, e.moisBonus),
      montant: mensuel * e.mois,
      duree: `${e.mois * 30} jours`,
      bonus: creditsBonus(p.creditsMensuels, e.moisBonus),
    };
  }, [type, palier, mois, recharge]);

  async function generer(e: React.FormEvent) {
    e.preventDefault();
    setErreur("");
    setEnvoi(true);
    try {
      const r = await fetch("/api/admin/codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          reference: type === "abonnement" ? palier : recharge,
          mois,
          note,
          quantite,
        }),
      });
      const d = (await r.json()) as { ok: boolean; message?: string; codes?: CodeActivation[] };
      if (!d.ok || !d.codes) {
        setErreur(d.message ?? "La génération a échoué.");
      } else {
        setDerniers(d.codes);
        setCodes((c) => [...d.codes!, ...c]);
        setNote("");
      }
    } catch {
      setErreur("Le serveur ne répond pas.");
    }
    setEnvoi(false);
  }

  async function annuler(code: string) {
    if (!confirm(`Annuler le code ${code} ? Il ne pourra plus être utilisé.`)) return;
    const r = await fetch(`/api/admin/codes?code=${encodeURIComponent(code)}`, { method: "DELETE" });
    if (r.ok) {
      setCodes((liste) => liste.map((c) => (c.code === code ? { ...c, annule: true } : c)));
    }
  }

  const visibles = codes.filter((c) => {
    if (filtre === "disponibles") return !c.utiliseLe && !c.annule;
    if (filtre === "utilises") return !!c.utiliseLe;
    return true;
  });

  const dispo = codes.filter((c) => !c.utiliseLe && !c.annule).length;
  const utilises = codes.filter((c) => c.utiliseLe).length;
  const encaisse = codes.filter((c) => c.utiliseLe).reduce((n, c) => n + c.montantDzd, 0);

  const styleSaisie =
    "w-full rounded-lg border border-ink-700 bg-ink-950 px-3 py-2 text-sm text-mist-100 outline-none transition focus:border-brand-500";

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ["Codes disponibles", String(dispo), "Fabriqués, pas encore activés"],
          ["Codes activés", String(utilises), "Comptes chargés"],
          ["Encaissé", `${encaisse.toLocaleString("fr-FR")} DA`, "Sur les codes activés"],
        ].map(([label, valeur, detail]) => (
          <Card key={label} className="p-4">
            <p className="text-[11px] font-medium uppercase tracking-wide text-mist-400">{label}</p>
            <p className="mt-1.5 text-2xl font-semibold tracking-tight text-mist-100">{valeur}</p>
            <p className="mt-1 text-xs text-mist-500">{detail}</p>
          </Card>
        ))}
      </div>

      {/* ------------------------------------------------------ fabrique */}
      <Card className="p-5">
        <h2 className="text-sm font-semibold text-mist-100">Fabriquer un code</h2>
        <p className="mt-0.5 text-xs text-mist-400">
          Les crédits et le montant viennent de la grille tarifaire : rien à saisir à la main.
        </p>

        <form onSubmit={generer} className="mt-4 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                ["abonnement", "Abonnement"],
                ["recharge", "Recharge"],
              ] as const
            ).map(([v, label]) => (
              <button
                key={v}
                type="button"
                onClick={() => setType(v)}
                className={`rounded-lg border px-3 py-2 text-xs font-medium transition ${
                  type === v
                    ? "border-brand-500 bg-brand-500/10 text-mist-100"
                    : "border-ink-700 text-mist-300 hover:border-ink-600"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {type === "abonnement" ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-mist-200">Formule</span>
                <select value={palier} onChange={(e) => setPalier(e.target.value)} className={styleSaisie}>
                  {PALIERS.map((p) => (
                    <option key={p.nom} value={p.nom}>
                      {p.nom} — {p.creditsMensuels} crédits/mois
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-mist-200">Durée</span>
                <select
                  value={mois}
                  onChange={(e) => setMois(Number(e.target.value))}
                  className={styleSaisie}
                >
                  {ENGAGEMENTS.map((e) => (
                    <option key={e.mois} value={e.mois}>
                      {e.libelle}
                      {e.moisBonus > 0 ? ` (+${e.moisBonus} mois offert${e.moisBonus > 1 ? "s" : ""})` : ""}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          ) : (
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-mist-200">Recharge</span>
              <select value={recharge} onChange={(e) => setRecharge(e.target.value)} className={styleSaisie}>
                {RECHARGES.map((r) => (
                  <option key={r.credits} value={String(r.credits)}>
                    {r.credits} crédits — {r.prix.toLocaleString("fr-FR")} DA ({r.libelle})
                  </option>
                ))}
              </select>
            </label>
          )}

          <div className="grid gap-3 sm:grid-cols-[1fr_100px]">
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-mist-200">
                Note — qui a payé, comment
              </span>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Karim 0661223344 — BaridiMob 12/03"
                className={styleSaisie}
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-mist-200">Quantité</span>
              <input
                type="number"
                min={1}
                max={50}
                value={quantite}
                onChange={(e) => setQuantite(Number(e.target.value) || 1)}
                className={styleSaisie}
              />
            </label>
          </div>

          {apercu && (
            <div className="rounded-lg border border-ink-700 bg-ink-950 px-3.5 py-2.5 text-xs leading-relaxed text-mist-300">
              Le client recevra{" "}
              <strong className="text-brand-300">{apercu.credits} crédits</strong>
              {"bonus" in apercu && apercu.bonus ? (
                <span className="text-jade"> (dont {apercu.bonus} offerts)</span>
              ) : null}{" "}
              pour <strong className="text-mist-100">{apercu.montant.toLocaleString("fr-FR")} DA</strong>,
              valable {apercu.duree}.
            </div>
          )}

          {erreur && <p className="text-xs text-rose-warn">{erreur}</p>}

          <button
            type="submit"
            disabled={envoi}
            className="w-full rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-ink-950 transition hover:bg-brand-400 disabled:opacity-50"
          >
            {envoi ? "Génération..." : `Fabriquer ${quantite > 1 ? `${quantite} codes` : "le code"}`}
          </button>
        </form>

        {derniers.length > 0 && (
          <div className="mt-4 rounded-lg border border-jade/30 bg-jade/[0.06] p-3.5">
            <p className="mb-2 text-xs font-medium text-jade">
              {derniers.length > 1 ? `${derniers.length} codes prêts` : "Code prêt"} — à envoyer au
              client
            </p>
            <div className="space-y-1.5">
              {derniers.map((c) => (
                <div
                  key={c.code}
                  className="flex items-center justify-between gap-2 rounded-md bg-ink-950 px-3 py-2"
                >
                  <code className="font-mono text-sm tracking-wider text-mist-100">{c.code}</code>
                  <CopyButton texte={c.code} label="" />
                </div>
              ))}
            </div>
            {derniers.length === 1 && (
              <div className="mt-2 flex justify-end">
                <CopyButton
                  texte={`Voici ton code Hooked Lab : ${derniers[0].code}\n\nConnecte-toi sur ton compte, va dans « Mon compte » et saisis-le. Tu auras ${derniers[0].credits} crédits.`}
                  label="Copier le message WhatsApp"
                />
              </div>
            )}
          </div>
        )}
      </Card>

      {/* -------------------------------------------------------- historique */}
      <Card className="p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-mist-100">Tous les codes</h2>
          <div className="flex gap-1.5">
            {(
              [
                ["tous", "Tous"],
                ["disponibles", "Disponibles"],
                ["utilises", "Activés"],
              ] as const
            ).map(([v, label]) => (
              <button
                key={v}
                onClick={() => setFiltre(v)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                  filtre === v
                    ? "border-brand-500 bg-brand-500/10 text-mist-100"
                    : "border-ink-700 text-mist-300 hover:border-ink-600"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {visibles.length === 0 ? (
          <p className="py-6 text-center text-sm text-mist-500">Aucun code.</p>
        ) : (
          <div className="space-y-1.5">
            {visibles.slice(0, 100).map((c) => (
              <div
                key={c.code}
                className={`flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-ink-800 px-3 py-2.5 ${
                  c.annule ? "opacity-40" : ""
                }`}
              >
                <code className="font-mono text-sm tracking-wider text-mist-100">{c.code}</code>
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${
                    c.annule
                      ? "bg-ink-800 text-mist-400 ring-ink-700"
                      : c.utiliseLe
                        ? "bg-jade/12 text-jade ring-jade/30"
                        : "bg-amber-glow/12 text-amber-glow ring-amber-glow/30"
                  }`}
                >
                  {c.annule ? "Annulé" : c.utiliseLe ? "Activé" : "Disponible"}
                </span>
                <span className="text-xs text-mist-300">
                  {c.palier} · {c.credits} cr. · {c.montantDzd.toLocaleString("fr-FR")} DA
                </span>
                {c.note && <span className="text-xs text-mist-500">— {c.note}</span>}
                <span className="ml-auto text-xs text-mist-500">
                  {c.utiliseLe ? `activé ${quand(c.utiliseLe)}` : quand(c.creeLe)}
                </span>
                {!c.utiliseLe && !c.annule && (
                  <button
                    onClick={() => annuler(c.code)}
                    className="text-xs text-mist-500 underline underline-offset-4 transition hover:text-rose-warn"
                  >
                    Annuler
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
