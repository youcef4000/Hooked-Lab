"use client";

import { useEffect, useRef, type ReactNode } from "react";

/* ============================================================================
   Revelation au scroll.

   Un seul mecanisme pour toute la page : les elements portant .rev montent
   de 22 pixels en apparaissant, en cascade. GSAP retire simplement la classe
   au bon moment — le CSS fait la transition. Sans JavaScript, tout reste
   visible : l'etat par defaut d'une page ne doit jamais etre "invisible".

   La cascade est de 60 ms, dans la fourchette imposee (40 a 80). Au-dela
   l'oeil attend, en deca la cascade ne se voit pas.
   ========================================================================== */

export function Reveal({
  children,
  className = "",
  /** Decalage entre les enfants directs marques .rev, en millisecondes. */
  cascade = 60,
}: {
  children: ReactNode;
  className?: string;
  cascade?: number;
}) {
  const racine = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = racine.current;
    if (!el) return;

    // Le mouvement est un agrement : qui l'a coupe recoit la page complete,
    // immediatement.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.querySelectorAll(".rev").forEach((n) => n.classList.add("rev-visible"));
      return;
    }

    let nettoyer: (() => void) | undefined;

    // Filet de securite : si GSAP tarde ou echoue a charger — connexion
    // lente, blocage reseau — la page ne doit jamais rester vide. Au bout de
    // deux secondes, tout s'affiche, animation ou pas.
    const filet = window.setTimeout(() => {
      el.querySelectorAll(".rev").forEach((n) => n.classList.add("rev-visible"));
    }, 2000);

    (async () => {
      const gsap = (await import("gsap")).default;
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      gsap.registerPlugin(ScrollTrigger);
      window.clearTimeout(filet);

      const ctx = gsap.context(() => {
        const groupes = el.querySelectorAll<HTMLElement>("[data-rev-groupe]");
        const cibles = groupes.length ? Array.from(groupes) : [el];

        for (const groupe of cibles) {
          const elements = groupe.querySelectorAll<HTMLElement>(".rev");
          if (!elements.length) continue;

          ScrollTrigger.create({
            trigger: groupe,
            // 82 % : l'element s'anime quand il entre franchement dans le
            // champ, pas au moment ou il affleure le bas de l'ecran.
            start: "top 82%",
            once: true,
            onEnter: () => {
              elements.forEach((n, i) => {
                window.setTimeout(() => n.classList.add("rev-visible"), i * cascade);
              });
            },
          });
        }
      }, el);

      nettoyer = () => ctx.revert();
    })();

    return () => {
      window.clearTimeout(filet);
      nettoyer?.();
    };
  }, [cascade]);

  return (
    <div ref={racine} className={className}>
      {children}
    </div>
  );
}

/**
 * Carte qui se souleve au survol, avec une lueur suivant le curseur.
 * Les coordonnees passent par deux variables CSS : aucune propriete de mise
 * en page n'est touchee, donc aucun recalcul de layout pendant le mouvement.
 */
export function CarteVivante({
  children,
  className = "",
  onClick,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  function suivre(e: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--sx", `${e.clientX - r.left}px`);
    el.style.setProperty("--sy", `${e.clientY - r.top}px`);
  }

  return (
    <div
      ref={ref}
      onMouseMove={suivre}
      onClick={onClick}
      className={`carte-vivante suit-curseur border border-ink-800 bg-ink-900 ${className}`}
    >
      {children}
    </div>
  );
}
