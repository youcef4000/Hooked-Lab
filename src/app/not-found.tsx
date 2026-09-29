import Link from "next/link";
import { langueCourante } from "@/lib/langue-serveur";

export default async function NotFound() {
  const fr = (await langueCourante()) === "fr";
  return (
    <div className="mx-auto max-w-lg px-5 py-24 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-brand-400">404</p>
      <h1 className="mt-3 text-2xl font-medium tracking-[-0.02em] text-mist-100">
        {fr ? "Page introuvable" : "Page not found"}
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-mist-400">
        {fr
          ? "Cette page n'existe pas, ou tu n'as pas accès à ce contenu. Si c'est une de tes analyses, vérifie que tu es connecté au bon compte."
          : "This page doesn't exist, or you don't have access to it. If it's one of your analyses, check that you're signed in to the right account."}
      </p>
      <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Link href="/analyser" className="cta-aurora inline-block rounded-full px-6 py-2.5 text-sm font-semibold">
          {fr ? "Aller à l'outil" : "Go to the tool"}
        </Link>
        <Link
          href="/"
          className="inline-block rounded-full border border-ink-600 px-6 py-2.5 text-sm font-medium text-mist-200 transition hover:border-brand-500/50 hover:text-brand-300"
        >
          {fr ? "Retour à l'accueil" : "Back to home"}
        </Link>
      </div>
    </div>
  );
}
