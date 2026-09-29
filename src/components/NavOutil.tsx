"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { SelecteurLangue, useT } from "./Langue";

/* ============================================================================
   Navigation de l'outil.

   Cinq destinations ne tiennent pas cote a cote sur un ecran de telephone.
   Les deux qui servent tous les jours restent visibles ; le reste passe dans
   un menu. Sur grand ecran, tout est affiche.
   ========================================================================== */

const TEXTES = {
  fr: {
    analyser: "Analyser",
    historique: "Historique",
    tarifs: "Tarifs",
    formulaire: "Formulaire COD 🇩🇿",
    connexion: "Connexion",
    credits: "Mes crédits",
    inactif: "Aucune formule active",
    plus: "Plus de pages",
    accueil: "Page d'accueil",
  },
  en: {
    analyser: "Analyse",
    historique: "History",
    tarifs: "Pricing",
    formulaire: "Algeria COD form",
    connexion: "Sign in",
    credits: "My credits",
    inactif: "No active plan",
    plus: "More pages",
    accueil: "Home page",
  },
};

function estActif(chemin: string, href: string): boolean {
  return href === "/analyser" ? chemin === href : chemin.startsWith(href);
}

export function NavOutil({
  proprietaire = false,
  credits = null,
  abonnementActif = false,
}: {
  proprietaire?: boolean;
  /** null quand personne n'est connecte. */
  credits?: number | null;
  abonnementActif?: boolean;
}) {
  const chemin = usePathname();
  const t = useT(TEXTES);
  const PRINCIPAUX = [
    { href: "/analyser", label: t.analyser },
    { href: "/historique", label: t.historique },
  ];
  const SECONDAIRES = [
    { href: "/tarifs", label: t.tarifs },
    { href: "/formulaire", label: t.formulaire },
  ];
  // Diagnostic et Admin ne rejoignent la liste que si le proprietaire est connecte.
  const secondaires = proprietaire
    ? [...SECONDAIRES, { href: "/diagnostic", label: "Diagnostic" }, { href: "/admin", label: "Admin" }]
    : SECONDAIRES;

  const connecte = credits !== null;
  // Le seuil de trois credits : en dessous, une seule video longue ne passe
  // plus. Mieux vaut l'apprendre dans la barre qu'au moment de lancer.
  const bas = connecte && abonnementActif && credits < 3;
  const [ouvert, setOuvert] = useState(false);
  const menu = useRef<HTMLDivElement>(null);

  // Un menu qui reste ouvert apres un clic ailleurs donne l'impression que la
  // page a cesse de repondre.
  useEffect(() => {
    if (!ouvert) return;
    const dehors = (e: MouseEvent) => {
      if (menu.current && !menu.current.contains(e.target as Node)) setOuvert(false);
    };
    const echap = (e: KeyboardEvent) => e.key === "Escape" && setOuvert(false);
    document.addEventListener("mousedown", dehors);
    document.addEventListener("keydown", echap);
    return () => {
      document.removeEventListener("mousedown", dehors);
      document.removeEventListener("keydown", echap);
    };
  }, [ouvert]);

  useEffect(() => setOuvert(false), [chemin]);

  const style = (actif: boolean) =>
    `whitespace-nowrap rounded-full px-2.5 py-1.5 text-sm transition sm:px-3.5 ${
      actif ? "bg-ink-800 text-mist-100" : "text-mist-300 hover:bg-ink-800 hover:text-mist-100"
    }`;

  return (
    <nav className="flex items-center gap-0.5 sm:gap-1">
      {PRINCIPAUX.map((l) => (
        <Link key={l.href} href={l.href} className={style(estActif(chemin, l.href))}>
          {l.label}
        </Link>
      ))}

      {/* Le solde, ou l'invitation a se connecter */}
      {connecte ? (
        <Link
          href="/compte"
          title={abonnementActif ? t.credits : t.inactif}
          className={`ml-1 flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-sm font-medium transition sm:px-3 ${
            bas || !abonnementActif
              ? "border-amber-glow/40 bg-amber-glow/10 text-amber-glow hover:bg-amber-glow/20"
              : "border-brand-500/35 bg-brand-500/10 text-brand-300 hover:bg-brand-500/20"
          }`}
        >
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v10M9.5 9.5h5M9.5 14.5h5" strokeLinecap="round" />
          </svg>
          <span className="tabular-nums">{credits}</span>
        </Link>
      ) : (
        <Link
          href="/connexion"
          className="ml-1 shrink-0 whitespace-nowrap rounded-full border border-brand-500/35 bg-brand-500/10 px-3 py-1 text-sm font-medium text-brand-300 transition hover:bg-brand-500/20"
        >
          {t.connexion}
        </Link>
      )}

      {/* Ecrans larges : tout est visible, pas de menu */}
      <div className="hidden md:flex md:items-center md:gap-1">
        <SelecteurLangue className="mr-1" />
        {secondaires.map((l) => (
          <Link key={l.href} href={l.href} className={style(estActif(chemin, l.href))}>
            {l.label}
          </Link>
        ))}
      </div>

      {/* Telephones et tablettes : le reste passe dans un menu */}
      <div ref={menu} className="relative md:hidden">
        <button
          onClick={() => setOuvert((o) => !o)}
          aria-label={t.plus}
          aria-expanded={ouvert}
          className={`rounded-full p-2 transition ${
            ouvert ? "bg-ink-800 text-mist-100" : "text-mist-300 hover:bg-ink-800"
          }`}
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
          </svg>
        </button>

        {ouvert && (
          <div className="absolute right-0 top-full z-50 mt-2 w-44 overflow-hidden rounded-xl border border-ink-700 bg-ink-900 shadow-xl shadow-black/50">
            {secondaires.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`block px-4 py-2.5 text-sm transition ${
                  estActif(chemin, l.href)
                    ? "bg-ink-800 text-mist-100"
                    : "text-mist-300 hover:bg-ink-850 hover:text-mist-100"
                }`}
              >
                {l.label}
              </Link>
            ))}
            <Link
              href="/"
              className="block border-t border-ink-800 px-4 py-2.5 text-sm text-mist-400 transition hover:bg-ink-850 hover:text-mist-100"
            >
              {t.accueil}
            </Link>
            <div className="border-t border-ink-800 px-4 py-2.5">
              <SelecteurLangue />
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
