"use client";

import { useMemo, useState } from "react";
import { Card } from "../ui";
import { LIBELLE_STATUT, STATUTS, type Commande, type StatutCommande } from "@/lib/commandes-types";

/* ============================================================================
   Gestion des commandes.

   Pensee pour le travail reel du confirmateur : il appelle, il tranche, il
   passe a la suivante. Chaque ligne se deplie sur place — pas de navigation,
   pas de rechargement — et le telephone est cliquable pour lancer l'appel ou
   ouvrir WhatsApp, qui est le canal reel de la relation client en Algerie.
   ========================================================================== */

const COULEUR_STATUT: Record<StatutCommande, string> = {
  nouvelle: "bg-amber-glow/12 text-amber-glow ring-amber-glow/30",
  confirmee: "bg-copper/12 text-copper ring-copper/30",
  expediee: "bg-brand-500/12 text-brand-300 ring-brand-500/30",
  livree: "bg-jade/12 text-jade ring-jade/30",
  retournee: "bg-rose-warn/12 text-rose-warn ring-rose-warn/30",
  annulee: "bg-ink-800 text-mist-400 ring-ink-700",
};

function quand(iso: string): string {
  const d = new Date(iso);
  const minutes = Math.round((Date.now() - d.getTime()) / 60000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  if (minutes < 60 * 24) return `il y a ${Math.round(minutes / 60)} h`;
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

/** 0661234567 -> 213661234567, format attendu par un lien WhatsApp. */
function versWhatsApp(tel: string): string {
  return "213" + tel.replace(/^0/, "");
}

function Ligne({
  commande,
  onChange,
  onSupprime,
}: {
  commande: Commande;
  onChange: (c: Commande) => void;
  onSupprime: (id: string) => void;
}) {
  const [ouvert, setOuvert] = useState(false);
  const [note, setNote] = useState(commande.note ?? "");
  const [occupe, setOccupe] = useState(false);

  async function envoyer(champs: { statut?: StatutCommande; note?: string }) {
    setOccupe(true);
    try {
      const r = await fetch("/api/admin/commandes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: commande.id, ...champs }),
      });
      const d = (await r.json()) as { ok: boolean; commande?: Commande };
      if (d.ok && d.commande) onChange(d.commande);
    } finally {
      setOccupe(false);
    }
  }

  async function supprimer() {
    if (!confirm(`Supprimer définitivement la commande de ${commande.nom} ?`)) return;
    setOccupe(true);
    const r = await fetch(`/api/admin/commandes?id=${encodeURIComponent(commande.id)}`, {
      method: "DELETE",
    });
    if (r.ok) onSupprime(commande.id);
    else setOccupe(false);
  }

  return (
    <Card className={`overflow-hidden transition ${occupe ? "opacity-60" : ""}`}>
      <button
        onClick={() => setOuvert((o) => !o)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-ink-850"
      >
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${COULEUR_STATUT[commande.statut]}`}
        >
          {LIBELLE_STATUT[commande.statut]}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-mist-100">{commande.nom}</span>
          <span className="block truncate text-xs text-mist-400">
            {commande.wilaya} · {commande.commune}
            {commande.produit ? ` · ${commande.produit}` : ""}
          </span>
        </span>
        <span className="hidden shrink-0 text-right sm:block">
          <span className="block text-sm font-medium tabular-nums text-mist-100">
            {commande.total.toLocaleString("fr-FR")} DA
          </span>
          <span className="block text-xs text-mist-500">{quand(commande.recueLe)}</span>
        </span>
        <svg
          viewBox="0 0 24 24"
          className={`h-4 w-4 shrink-0 text-mist-400 transition ${ouvert ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {ouvert && (
        <div className="border-t border-ink-800 px-4 py-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="mb-2 text-xs font-medium uppercase tracking-wide text-mist-400">
                Contact
              </h4>
              <div className="flex flex-wrap items-center gap-2">
                <a
                  href={`tel:${commande.telephone}`}
                  className="rounded-lg border border-ink-700 px-3 py-1.5 font-mono text-sm text-mist-100 transition hover:border-brand-500/50"
                >
                  {commande.telephone}
                </a>
                <a
                  href={`https://wa.me/${versWhatsApp(commande.telephone)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-jade/40 bg-jade/10 px-3 py-1.5 text-xs font-medium text-jade transition hover:bg-jade/20"
                >
                  WhatsApp
                </a>
              </div>
              <dl className="mt-3 space-y-1 text-xs">
                {[
                  ["Reçue le", new Date(commande.recueLe).toLocaleString("fr-FR")],
                  ["Wilaya", `${commande.wilaya_code} - ${commande.wilaya}`],
                  ["Commune", commande.commune],
                  ["Livraison", commande.livraison || "non précisée"],
                  ["Produit", `${commande.prix_produit.toLocaleString("fr-FR")} DA`],
                  ["Frais", `${commande.frais_livraison.toLocaleString("fr-FR")} DA`],
                  ["Total", `${commande.total.toLocaleString("fr-FR")} DA`],
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
                Où en est cette commande
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {STATUTS.map((s) => (
                  <button
                    key={s}
                    onClick={() => envoyer({ statut: s })}
                    disabled={occupe || s === commande.statut}
                    className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition disabled:cursor-default ${
                      s === commande.statut
                        ? "border-brand-500 bg-brand-500/10 text-mist-100"
                        : "border-ink-700 text-mist-300 hover:border-ink-600 hover:text-mist-100"
                    }`}
                  >
                    {LIBELLE_STATUT[s]}
                  </button>
                ))}
              </div>

              <h4 className="mb-2 mt-4 text-xs font-medium uppercase tracking-wide text-mist-400">
                Note
              </h4>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                onBlur={() => note !== (commande.note ?? "") && envoyer({ note })}
                rows={2}
                placeholder="Ex : rappeler après 18 h, veut la couleur noire..."
                className="w-full resize-y rounded-lg border border-ink-700 bg-ink-950 px-3 py-2 text-sm text-mist-100 outline-none transition placeholder:text-mist-500 focus:border-brand-500"
              />

              <button
                onClick={supprimer}
                disabled={occupe}
                className="mt-3 text-xs text-mist-500 underline underline-offset-4 transition hover:text-rose-warn"
              >
                Supprimer cette commande
              </button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

export function TableauCommandes({ initiales }: { initiales: Commande[] }) {
  const [commandes, setCommandes] = useState(initiales);
  const [filtre, setFiltre] = useState<StatutCommande | "toutes">("toutes");
  const [recherche, setRecherche] = useState("");

  const visibles = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    return commandes.filter((c) => {
      if (filtre !== "toutes" && c.statut !== filtre) return false;
      if (!q) return true;
      return (
        c.nom.toLowerCase().includes(q) ||
        c.telephone.includes(q) ||
        c.wilaya.toLowerCase().includes(q) ||
        c.commune.toLowerCase().includes(q) ||
        c.produit.toLowerCase().includes(q)
      );
    });
  }, [commandes, filtre, recherche]);

  const compte = (s: StatutCommande) => commandes.filter((c) => c.statut === s).length;

  function remplacer(c: Commande) {
    setCommandes((liste) => liste.map((x) => (x.id === c.id ? c : x)));
  }

  if (commandes.length === 0) {
    return (
      <Card className="border-dashed p-10 text-center">
        <h2 className="text-sm font-medium text-mist-100">Aucune commande pour l&apos;instant</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-mist-400">
          Va sur la page Formulaire, choisis « Hooked Lab » comme destination, puis colle le
          code sur ta page produit. Chaque commande arrivera ici, avec le téléphone cliquable.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder="Chercher un nom, un numéro, une wilaya..."
          className="min-w-[200px] flex-1 rounded-lg border border-ink-700 bg-ink-950 px-3 py-2 text-sm text-mist-100 outline-none transition placeholder:text-mist-500 focus:border-brand-500"
        />
        <a
          href="/api/admin/commandes?format=csv"
          className="whitespace-nowrap rounded-lg border border-ink-700 px-3 py-2 text-xs font-medium text-mist-300 transition hover:border-ink-600 hover:text-mist-100"
        >
          Exporter en CSV
        </a>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => setFiltre("toutes")}
          className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
            filtre === "toutes"
              ? "border-brand-500 bg-brand-500/10 text-mist-100"
              : "border-ink-700 text-mist-300 hover:border-ink-600"
          }`}
        >
          Toutes ({commandes.length})
        </button>
        {STATUTS.map((s) => {
          const n = compte(s);
          if (n === 0) return null;
          return (
            <button
              key={s}
              onClick={() => setFiltre(s)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                filtre === s
                  ? "border-brand-500 bg-brand-500/10 text-mist-100"
                  : "border-ink-700 text-mist-300 hover:border-ink-600"
              }`}
            >
              {LIBELLE_STATUT[s]} ({n})
            </button>
          );
        })}
      </div>

      {visibles.length === 0 ? (
        <p className="py-8 text-center text-sm text-mist-500">Aucune commande ne correspond.</p>
      ) : (
        <div className="space-y-2">
          {visibles.map((c) => (
            <Ligne
              key={c.id}
              commande={c}
              onChange={remplacer}
              onSupprime={(id) => setCommandes((l) => l.filter((x) => x.id !== id))}
            />
          ))}
        </div>
      )}
    </div>
  );
}
