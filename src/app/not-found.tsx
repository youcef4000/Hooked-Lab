import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-5 py-24 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-brand-400">404</p>
      <h1 className="mt-3 text-2xl font-medium tracking-[-0.02em] text-mist-100">Page introuvable</h1>
      <p className="mt-2 text-sm leading-relaxed text-mist-400">
        Cette page n&apos;existe pas, ou tu n&apos;as pas accès à ce contenu. Si c&apos;est une de
        tes analyses, vérifie que tu es connecté au bon compte.
      </p>
      <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Link href="/analyser" className="cta-aurora inline-block rounded-full px-6 py-2.5 text-sm font-semibold">
          Aller à l&apos;outil
        </Link>
        <Link
          href="/"
          className="inline-block rounded-full border border-ink-600 px-6 py-2.5 text-sm font-medium text-mist-200 transition hover:border-brand-500/50 hover:text-brand-300"
        >
          Retour à l&apos;accueil
        </Link>
      </div>
    </div>
  );
}
