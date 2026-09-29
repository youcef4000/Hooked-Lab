"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteAnalysisButton({ id, langue = "fr" }: { id: string; langue?: "fr" | "en" }) {
  const fr = langue === "fr";
  const router = useRouter();
  const [confirme, setConfirme] = useState(false);
  const [suppression, setSuppression] = useState(false);

  async function supprimer() {
    if (!confirme) {
      setConfirme(true);
      // Sans second clic dans les 4 s, on annule : evite les suppressions par megarde.
      setTimeout(() => setConfirme(false), 4000);
      return;
    }
    setSuppression(true);
    await fetch(`/api/analyses/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <button
      onClick={supprimer}
      disabled={suppression}
      title={fr ? "Supprimer cette analyse et ses fichiers" : "Delete this analysis and its files"}
      className={`rounded-md border px-2 py-1 text-[11px] transition ${
        confirme
          ? "border-rose-warn/50 bg-rose-warn/15 text-rose-warn"
          : "border-ink-700 bg-ink-850/90 text-mist-400 hover:text-mist-200"
      }`}
    >
      {suppression ? "…" : confirme ? (fr ? "Confirmer" : "Confirm") : fr ? "Supprimer" : "Delete"}
    </button>
  );
}
