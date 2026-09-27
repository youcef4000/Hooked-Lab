import { GestionCodes } from "@/components/admin/GestionCodes";
import { Card } from "@/components/ui";
import { listerCodes } from "@/lib/codes";
import { listerPaiements } from "@/lib/paiements";
import { listerUtilisateurs } from "@/lib/comptes";

export const dynamic = "force-dynamic";

/* Codes d'activation (paiements en dinars) et, au-dessus, les paiements par
   carte arrives par Stripe : les deux sources de chiffre d'affaires. */
export default function PageCodes() {
  const paiements = listerPaiements().reverse();
  const emails = new Map(listerUtilisateurs().map((u) => [u.id, u.email]));
  const totaux = new Map<string, number>();
  for (const p of paiements) totaux.set(p.devise, (totaux.get(p.devise) ?? 0) + p.montant);

  return (
    <div className="space-y-5">
      <Card className="p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-mist-100">Paiements par carte</h2>
            <p className="mt-0.5 text-xs text-mist-400">
              Crédités automatiquement par Stripe. Le détail et les remboursements se gèrent sur
              dashboard.stripe.com.
            </p>
          </div>
          <p className="text-sm text-mist-200">
            {paiements.length === 0
              ? "Aucun pour l'instant"
              : [...totaux.entries()]
                  .map(([d, m]) => `${m.toLocaleString("fr-FR")} ${d === "EUR" ? "€" : "$"}`)
                  .join(" · ")}
          </p>
        </div>
        {paiements.length > 0 && (
          <ul className="mt-4 divide-y divide-ink-800">
            {paiements.slice(0, 15).map((p) => (
              <li key={p.session} className="flex flex-wrap justify-between gap-2 py-2 text-xs">
                <span className="truncate text-mist-300">
                  {emails.get(p.utilisateurId) ?? p.utilisateurId}
                </span>
                <span className="tabular-nums text-mist-400">
                  {p.credits} crédits · {p.montant} {p.devise === "EUR" ? "€" : "$"} ·{" "}
                  {new Date(p.le).toLocaleDateString("fr-FR")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <GestionCodes initiaux={listerCodes().reverse()} />
    </div>
  );
}
