"use client";

export function BoutonDeconnexion() {
  async function sortir() {
    await fetch("/api/admin/session", { method: "DELETE" });
    window.location.href = "/";
  }

  return (
    <button
      onClick={sortir}
      className="inline-flex items-center gap-1.5 rounded-lg border border-ink-700 px-3 py-1.5 text-xs text-mist-300 transition hover:border-ink-600 hover:text-mist-100"
    >
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <path d="m16 17 5-5-5-5M21 12H9" />
      </svg>
      Se déconnecter
    </button>
  );
}
