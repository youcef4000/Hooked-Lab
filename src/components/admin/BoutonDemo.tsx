"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/** Bascule une analyse dans la vitrine publique, ou l'en retire. */
export function BoutonDemo({ id, demo }: { id: string; demo: boolean }) {
  const router = useRouter();
  const [actif, setActif] = useState(demo);
  const [envoi, setEnvoi] = useState(false);

  async function basculer() {
    setEnvoi(true);
    const res = await fetch(`/api/analyses/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ demo: !actif }),
    });
    if (res.ok) setActif(!actif);
    setEnvoi(false);
    router.refresh();
  }

  return (
    <button
      onClick={basculer}
      disabled={envoi}
      title={actif ? "Retirer de la vitrine publique" : "Montrer cette analyse aux visiteurs comme exemple"}
      className={`whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-medium transition disabled:opacity-50 ${
        actif
          ? "border-brand-500/50 bg-brand-500/15 text-brand-300 hover:bg-brand-500/25"
          : "border-ink-700 text-mist-400 hover:border-brand-500/40 hover:text-brand-300"
      }`}
    >
      {actif ? "Exemple public ✓" : "Rendre public"}
    </button>
  );
}
