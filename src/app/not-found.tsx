import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg py-20 text-center">
      <h1 className="text-xl font-semibold text-mist-100">Page introuvable</h1>
      <p className="mt-2 text-sm text-mist-400">
        Cette analyse n&apos;existe pas, ou elle a ete supprimee du dossier{" "}
        <code className="rounded bg-ink-800 px-1.5 py-0.5 text-xs">data/analyses</code>.
      </p>
      <Link
        href="/analyser"
        className="mt-6 inline-block cta-aurora rounded-full px-5 py-2.5 text-sm font-semibold"
      >
        Lancer une nouvelle analyse
      </Link>
    </div>
  );
}
