"use client";

import { useMemo, useState } from "react";
import { Card } from "../ui";

/* ============================================================================
   Comptes abonnes.

   Trois gestes seulement, ceux qu'on fait vraiment en support : voir le
   solde, corriger des credits quand quelque chose s'est mal passe, et
   suspendre un compte. Le reste passe par les codes.
   ========================================================================== */

export interface LigneUtilisateur {
  id: string;
  email: string;
  nom: string;
  telephone: string;
  credits: number;
  palier: string;
  expireLe: string | null;
  actif: boolean;
  creeLe: string;
  creditsConsommes: number;
  suspendu: boolean;
}

function versWhatsApp(tel: string): string {
  return "213" + tel.replace(/^0/, "");
}

function Ligne({ u, onChange }: { u: LigneUtilisateur; onChange: (u: LigneUtilisateur) => void }) {
  const [ouvert, setOuvert] = useState(false);
  const [credits, setCredits] = useState(String(u.credits));
  const [occupe, setOccupe] = useState(false);

  async function envoyer(champs: { credits?: number; suspendu?: boolean }) {
    setOccupe(true);
    try {
      const r = await fetch("/api/admin/utilisateurs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: u.id, ...champs }),
      });
      const d = (await r.json()) as { ok: boolean; utilisateur?: Partial<LigneUtilisateur> };
      if (d.ok && d.utilisateur) onChange({ ...u, ...d.utilisateur });
    } finally {
      setOccupe(false);
    }
  }

  return (
    <Card className={`overflow-hidden ${occupe ? "opacity-60" : ""}`}>
      <button
        onClick={() => setOuvert((o) => !o)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-ink-850"
      >
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${
            u.suspendu
              ? "bg-rose-warn/12 text-rose-warn ring-rose-warn/30"
              : u.actif
                ? "bg-jade/12 text-jade ring-jade/30"
                : "bg-ink-800 text-mist-400 ring-ink-700"
          }`}
        >
          {u.suspendu ? "Suspendu" : u.actif ? u.palier || "Actif" : "Inactif"}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-mist-100">{u.nom}</span>
          <span className="block truncate text-xs text-mist-400">{u.email}</span>
        </span>
        <span className="shrink-0 text-right">
          <span className="block text-sm font-semibold tabular-nums text-brand-300">
            {u.credits}
          </span>
          <span className="block text-[11px] text-mist-500">crédits</span>
        </span>
      </button>

      {ouvert && (
        <div className="grid gap-4 border-t border-ink-800 px-4 py-4 md:grid-cols-2">
          <div>
            <h4 className="mb-2 text-xs font-medium uppercase tracking-wide text-mist-400">
              Contact
            </h4>
            <div className="flex flex-wrap gap-2">
              <a
                href={`tel:${u.telephone}`}
                className="rounded-lg border border-ink-700 px-3 py-1.5 font-mono text-sm text-mist-100 transition hover:border-brand-500/50"
              >
                {u.telephone}
              </a>
              <a
                href={`https://wa.me/${versWhatsApp(u.telephone)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-jade/40 bg-jade/10 px-3 py-1.5 text-xs font-medium text-jade transition hover:bg-jade/20"
              >
                WhatsApp
              </a>
            </div>
            <dl className="mt-3 space-y-1 text-xs">
              {[
                ["Inscrit le", new Date(u.creeLe).toLocaleDateString("fr-FR")],
                ["Formule", u.palier || "aucune"],
                [
                  "Expire le",
                  u.expireLe ? new Date(u.expireLe).toLocaleDateString("fr-FR") : "—",
                ],
                ["Crédits consommés", String(u.creditsConsommes)],
              ].map(([cle, valeur]) => (
                <div key={cle} className="flex justify-between gap-3">
                  <dt className="text-mist-500">{cle}</dt>
                  <dd className="text-right text-mist-200">{valeur}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div>
            <h4 className="mb-2 text-xs font-medium uppercase tracking-wide text-mist-400">
              Corriger
            </h4>
            <div className="flex gap-2">
              <input
                type="number"
                min={0}
                value={credits}
                onChange={(e) => setCredits(e.target.value)}
                className="min-w-0 flex-1 rounded-lg border border-ink-700 bg-ink-950 px-3 py-2 text-sm text-mist-100 outline-none focus:border-brand-500"
              />
              <button
                onClick={() => envoyer({ credits: Number(credits) })}
                disabled={occupe || Number(credits) === u.credits}
                className="shrink-0 rounded-lg border border-ink-700 px-3 py-2 text-xs font-medium text-mist-200 transition hover:border-brand-500/50 disabled:opacity-40"
              >
                Appliquer
              </button>
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-mist-500">
              À n&apos;utiliser qu&apos;en cas de souci. Une vente passe par un code, qui laisse une
              trace.
            </p>

            <button
              onClick={() => envoyer({ suspendu: !u.suspendu })}
              disabled={occupe}
              className={`mt-3 w-full rounded-lg border px-3 py-2 text-xs font-medium transition ${
                u.suspendu
                  ? "border-jade/40 text-jade hover:bg-jade/10"
                  : "border-ink-700 text-mist-400 hover:border-rose-warn/50 hover:text-rose-warn"
              }`}
            >
              {u.suspendu ? "Réactiver ce compte" : "Suspendre ce compte"}
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}

export function GestionUtilisateurs({ initiaux }: { initiaux: LigneUtilisateur[] }) {
  const [utilisateurs, setUtilisateurs] = useState(initiaux);
  const [recherche, setRecherche] = useState("");

  const visibles = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    if (!q) return utilisateurs;
    return utilisateurs.filter(
      (u) =>
        u.nom.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.telephone.includes(q),
    );
  }, [utilisateurs, recherche]);

  const actifs = utilisateurs.filter((u) => u.actif && !u.suspendu).length;
  const creditsEnCirculation = utilisateurs.reduce((n, u) => n + u.credits, 0);

  if (utilisateurs.length === 0) {
    return (
      <Card className="border-dashed p-10 text-center">
        <h2 className="text-sm font-medium text-mist-100">Aucun compte pour l&apos;instant</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-mist-400">
          Les inscriptions apparaîtront ici. Chaque compte reste inactif tant qu&apos;un code
          n&apos;a pas été saisi.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ["Comptes", String(utilisateurs.length), "Inscrits au total"],
          ["Abonnés actifs", String(actifs), "Abonnement en cours"],
          [
            "Crédits en circulation",
            String(creditsEnCirculation),
            "Vendus et pas encore consommés",
          ],
        ].map(([label, valeur, detail]) => (
          <Card key={label} className="p-4">
            <p className="text-[11px] font-medium uppercase tracking-wide text-mist-400">{label}</p>
            <p className="mt-1.5 text-2xl font-semibold tracking-tight text-mist-100">{valeur}</p>
            <p className="mt-1 text-xs text-mist-500">{detail}</p>
          </Card>
        ))}
      </div>

      <input
        value={recherche}
        onChange={(e) => setRecherche(e.target.value)}
        placeholder="Chercher un nom, un email, un numéro..."
        className="w-full rounded-lg border border-ink-700 bg-ink-950 px-3 py-2 text-sm text-mist-100 outline-none transition placeholder:text-mist-500 focus:border-brand-500"
      />

      <div className="space-y-2">
        {visibles.map((u) => (
          <Ligne
            key={u.id}
            u={u}
            onChange={(maj) => setUtilisateurs((l) => l.map((x) => (x.id === maj.id ? maj : x)))}
          />
        ))}
      </div>
    </div>
  );
}
