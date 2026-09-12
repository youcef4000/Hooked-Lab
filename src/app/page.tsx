"use client";

/* ============================================================================
   Landing scroll-driven, registre "or sur noir".

   La scene centrale est epinglee : pendant le scroll, une creative se fait
   decortiquer — frames, script, angles, sourcing, profit — c'est exactement
   le travail de l'application. GSAP ScrollTrigger pilote l'ensemble, charge
   dynamiquement cote client.
   ========================================================================== */

import { useEffect, useRef, type ReactNode } from "react";
import Link from "next/link";
import { CarteResultat, MiniFrame, MockPhone, ProduitMontre, type Resultat } from "@/components/landing/Visuels";
import { Tarifs } from "@/components/landing/Tarifs";
import { MarqueHooked } from "@/components/Logo";

/* ------------------------------------------------------------------ donnees */

/** Resultats d'analyse montres dans le bandeau : le livrable, pas des vignettes. */
const RESULTATS: Resultat[] = [
  { produit: "Montre connectée sport", categorie: "High-tech", score: 82, achat: "2,10 $", vente: "4 900 DA", profit: "+1 240 DA", hook: 8 },
  { produit: "Mini blender portable", categorie: "Cuisine", score: 74, achat: "3,40 $", vente: "5 500 DA", profit: "+1 180 DA", hook: 7 },
  { produit: "Lampe LED coucher soleil", categorie: "Deco", score: 68, achat: "1,80 $", vente: "3 200 DA", profit: "+740 DA", hook: 9 },
  { produit: "Organisateur de voiture", categorie: "Auto", score: 71, achat: "1,20 $", vente: "2 900 DA", profit: "+820 DA", hook: 6 },
  { produit: "Brosse lissante céramique", categorie: "Beaute", score: 79, achat: "4,60 $", vente: "6 900 DA", profit: "+1 510 DA", hook: 8 },
  { produit: "Aspirateur sans fil auto", categorie: "Auto", score: 63, achat: "5,90 $", vente: "7 400 DA", profit: "+690 DA", hook: 5 },
  { produit: "Tapis de jeu bébé pliable", categorie: "Bebe", score: 77, achat: "6,20 $", vente: "8 900 DA", profit: "+1 630 DA", hook: 7 },
  { produit: "Projecteur astronaute", categorie: "Deco", score: 85, achat: "3,10 $", vente: "5 900 DA", profit: "+1 720 DA", hook: 9 },
];

const ETAPES = [
  { n: "01", titre: "Dépose la créative", texte: "Une vidéo ou une image reperee sur TikTok, Instagram ou Facebook. Glisse le fichier, ou colle le lien du post." },
  { n: "02", titre: "L'IA decortique tout", texte: "Script reconstitue, séquences chronometrees, force du hook, angles de persuasion et structure de montage." },
  { n: "03", titre: "Lance le produit", texte: "Produit source sur Alibaba et 1688, rentabilité au taux de livraison COD réel, script darija et annonces prêts." },
];

const BLOCS = [
  { titre: "Script et séquences", texte: "Le script complet, voix off et textes a l'écran, découpé plan par plan avec le role de chaque séquence dans la vente.", icone: "M4 6h16M4 12h10M4 18h13" },
  { titre: "Angles marketing notes", texte: "Chaque levier de persuasion identifié et note sur 10, puis réécrit pour le client algérien qui paie à la livraison.", icone: "M12 3l2.6 6.3 6.8.5-5.2 4.4 1.6 6.6L12 17.8 6.2 20.8l1.6-6.6L2.6 9.8l6.8-.5z" },
  { titre: "Sourcing Alibaba et 1688", texte: "Le produit identifié, les requêtes traduites en chinois réel de fournisseur, et la fourchette de prix d'achat.", icone: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4.2-4.2" },
  { titre: "Rentabilité COD", texte: "Taux de livraison, coût des retours, taux de change parallele : le CPA maximum avant de perdre de l'argent.", icone: "M4 19V5m0 14h16M8 15l3.5-4 3 2.5L20 8" },
  { titre: "Pack de lancement", texte: "Script en darija prêt à tourner, pages de vente en français et en arabe, annonces Facebook et TikTok.", icone: "M5 4h14v16l-7-3.5L5 20z" },
  { titre: "Score de potentiel DZ", texte: "Demande, concurrence, marge, logistique et facilité de tournage notees sur 100 : tu sais si le produit vaut le test.", icone: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zm0-13v5l3 2" },
];


const FAQ = [
  { q: "Est-ce que ça marche avec les vidéos TikTok et Instagram ?", r: "Oui. Tu colles le lien du post, ou tu déposés directement le fichier vidéo ou l'image — c'est la methode la plus fiable, les plateformes bloquant souvent le téléchargement automatique. Le rapport est identique dans les deux cas." },
  { q: "Les prix de sourcing sont-ils fiables ?", r: "Ce sont des fourchettes estimees par l'IA avec un indice de fiabilité affiché. Les liens Alibaba et 1688 générés te donnent les prix réels des fournisseurs en un clic, et la recherche par image retrouve le produit exact." },
  { q: "Le calcul de rentabilité est-il adapté à l'Algérie ?", r: "Oui, c'est son seul objet : paiement à la livraison, taux de livraison réel (55 a 75 %), coût des retours, tarifs Yalidine et stopdesk, taux de change du marche parallele. Chaque hypothèse est ajustable." },
  { q: "En quelle langue sont les livrables ?", r: "L'analyse est en français. Le script vidéo est réécrit en darija algérienne telle qu'on la parle, et la page de vente est fournie en français et en arabe." },
];

const SCRIPT_LIGNES = [
  "« Arrête de perdre ton argent... »",
  "« Cette montre fait tout ce que tu veux »",
  "[démonstration — gros plan poignet]",
  "« Regarde comme c'est simple »",
  "« Livraison 58 wilayas, paiement main a main »",
  "« Commande maintenant, stock limite »",
];

const ANGLES_CHIPS = [
  { t: "Hook choc — 8/10", c: "#f2dfa0" },
  { t: "Problème / solution", c: "#d4af37" },
  { t: "Preuve en démonstration", c: "#b87333" },
  { t: "Urgence stock limite", c: "#e08c3a" },
  { t: "Confiance COD", c: "#3f7d6b" },
];

/* --------------------------------------------------------------- utilitaires */

function Magnetic({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div
      ref={ref}
      className="inline-block transition-transform duration-200 ease-out"
      onMouseMove={(e) => {
        const el = ref.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        el.style.transform = `translate(${((e.clientX - r.left) / r.width - 0.5) * 14}px, ${((e.clientY - r.top) / r.height - 0.5) * 10}px)`;
      }}
      onMouseLeave={() => {
        if (ref.current) ref.current.style.transform = "translate(0, 0)";
      }}
    >
      {children}
    </div>
  );
}

/* --------------------------------------------------------------------- page */

export default function Landing() {
  const racine = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let detruire: (() => void) | undefined;

    (async () => {
      const gsap = (await import("gsap")).default;
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      gsap.registerPlugin(ScrollTrigger);

      const ctx = gsap.context(() => {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        const mm = gsap.matchMedia();

        /* --- Hero -------------------------------------------------------- */
        gsap.from(".hero-mot", { y: 48, opacity: 0, duration: 0.9, stagger: 0.06, ease: "power3.out" });
        gsap.from(".hero-sous", { y: 24, opacity: 0, duration: 0.8, delay: 0.45, ease: "power3.out" });
        gsap.from(".hero-cta", { y: 18, opacity: 0, duration: 0.7, delay: 0.62, ease: "power3.out" });
        gsap.from(".hero-phone", { y: 70, opacity: 0, scale: 0.94, duration: 1.2, delay: 0.25, ease: "power3.out" });
        gsap.from(".hero-chip", { scale: 0.5, opacity: 0, duration: 0.7, delay: 0.85, stagger: 0.12, ease: "back.out(2)" });

        gsap.to(".hero-chip", { y: -70, scrollTrigger: { trigger: ".sec-hero", start: "top top", end: "bottom top", scrub: 1 } });
        gsap.to(".hero-phone", { y: 90, scrollTrigger: { trigger: ".sec-hero", start: "top top", end: "bottom top", scrub: 1 } });

        /* --- Reveals ------------------------------------------------------ */
        gsap.utils.toArray<HTMLElement>(".st-reveal").forEach((el, i) => {
          gsap.from(el, {
            y: 34,
            opacity: 0,
            duration: 0.8,
            delay: (i % 3) * 0.08,
            ease: "power3.out",
            scrollTrigger: { trigger: el, start: "top 88%" },
          });
        });

        /* --- Compteurs de la preuve chiffree ------------------------------ */
        gsap.utils.toArray<HTMLElement>(".st-compteur").forEach((el) => {
          const fin = Number(el.dataset.fin || 0);
          const suffixe = el.dataset.suffixe || "";
          const obj = { v: 0 };
          gsap.to(obj, {
            v: fin,
            duration: 1.6,
            ease: "power2.out",
            scrollTrigger: { trigger: el, start: "top 88%" },
            onUpdate: () => {
              el.textContent = Math.round(obj.v).toLocaleString("fr-FR") + suffixe;
            },
          });
        });

        /* --- Titres de section : lettres qui montent ---------------------- */
        gsap.utils.toArray<HTMLElement>(".st-titre").forEach((el) => {
          gsap.from(el.querySelectorAll<HTMLElement>(".st-mot"), {
            y: 30,
            opacity: 0,
            duration: 0.7,
            stagger: 0.05,
            ease: "power3.out",
            scrollTrigger: { trigger: el, start: "top 86%" },
          });
        });

        /* --- Sequence de dissection (mobile) ------------------------------ */
        mm.add("(max-width: 767px)", () => {
          // Chaque etape se revele a l'approche, puis anime son propre visuel.
          gsap.utils.toArray<HTMLElement>(".mb-etape").forEach((etape) => {
            gsap.from(etape, {
              y: 40,
              opacity: 0,
              duration: 0.8,
              ease: "power3.out",
              scrollTrigger: { trigger: etape, start: "top 85%" },
            });
          });

          gsap.from(".mb-frame", {
            scale: 0.5,
            opacity: 0,
            y: 24,
            duration: 0.55,
            stagger: 0.1,
            ease: "back.out(1.9)",
            scrollTrigger: { trigger: ".mb-frames", start: "top 88%" },
          });

          gsap.from(".mb-ligne", {
            opacity: 0,
            x: -18,
            duration: 0.4,
            stagger: 0.1,
            ease: "power2.out",
            scrollTrigger: { trigger: ".mb-ligne", start: "top 92%" },
          });

          gsap.from(".mb-chip", {
            scale: 0.4,
            opacity: 0,
            duration: 0.5,
            stagger: 0.09,
            ease: "back.out(2.2)",
            scrollTrigger: { trigger: ".mb-chip", start: "top 92%" },
          });

          const profit = { v: 0 };
          const cibleMobile = document.querySelector(".mb-profit");
          if (cibleMobile) {
            gsap.to(profit, {
              v: 1240,
              duration: 1.4,
              ease: "power2.out",
              scrollTrigger: { trigger: cibleMobile, start: "top 90%" },
              onUpdate: () => {
                cibleMobile.textContent = `+${Math.round(profit.v).toLocaleString("fr-FR")} DA`;
              },
            });
          }
        });

        /* --- Scene de dissection (desktop) -------------------------------- */
        mm.add("(min-width: 768px)", () => {
          const frames = gsap.utils.toArray<HTMLElement>(".dx-frame");
          const captions = gsap.utils.toArray<HTMLElement>(".dx-caption");
          const dots = gsap.utils.toArray<HTMLElement>(".dx-dot");

          gsap.set(".dx-script", { xPercent: -130, autoAlpha: 0 });
          gsap.set(".dx-angles", { xPercent: 130, autoAlpha: 0 });
          gsap.set(".dx-sourcing", { yPercent: 140, autoAlpha: 0 });
          gsap.set(".dx-final", { autoAlpha: 0, y: 20 });
          gsap.set(captions, { autoAlpha: 0, y: 18 });
          gsap.set(frames, { x: 0, y: 0, rotate: 0, autoAlpha: 0 });

          const tl = gsap.timeline({
            defaults: { ease: "power2.inOut" },
            scrollTrigger: {
              trigger: ".sec-dissect",
              start: "top top",
              end: "+=3600",
              scrub: 0.6,
              pin: true,
              anticipatePin: 1,
            },
          });

          const dot = (i: number) =>
            dots.forEach((d, j) =>
              tl.to(d, { backgroundColor: j <= i ? "#d4af37" : "#3a3340", duration: 0.1 }, "<"),
            );

          tl.to(captions[0], { autoAlpha: 1, y: 0, duration: 0.35 });
          dot(0);
          tl.to(frames, {
            autoAlpha: 1,
            x: (i) => (i - 2) * 120,
            y: (i) => -252 + Math.abs(i - 2) * 26,
            rotate: (i) => (i - 2) * 9,
            duration: 1,
            stagger: 0.06,
          });

          tl.to(captions[0], { autoAlpha: 0, y: -18, duration: 0.3 }, "+=0.3");
          tl.to(captions[1], { autoAlpha: 1, y: 0, duration: 0.35 });
          dot(1);
          tl.to(".dx-phone", { x: 140, scale: 0.9, duration: 0.8 }, "<");
          tl.to(".dx-script", { xPercent: 0, autoAlpha: 1, duration: 0.8 }, "<0.1");
          tl.from(".dx-ligne", { opacity: 0, x: -20, stagger: 0.09, duration: 0.4 });

          tl.to(captions[1], { autoAlpha: 0, y: -18, duration: 0.3 }, "+=0.35");
          tl.to(captions[2], { autoAlpha: 1, y: 0, duration: 0.35 });
          dot(2);
          tl.to(".dx-phone", { x: 0, duration: 0.8 }, "<");
          tl.to(".dx-angles", { xPercent: 0, autoAlpha: 1, duration: 0.8 }, "<0.1");
          tl.from(".dx-chip", { scale: 0.4, opacity: 0, stagger: 0.08, duration: 0.45, ease: "back.out(2.2)" });

          tl.to(captions[2], { autoAlpha: 0, y: -18, duration: 0.3 }, "+=0.35");
          tl.to(captions[3], { autoAlpha: 1, y: 0, duration: 0.35 });
          dot(3);
          tl.to(".dx-phone", { scale: 0.82, y: -40, duration: 0.8 }, "<");
          tl.to(".dx-sourcing", { yPercent: 0, autoAlpha: 1, duration: 0.8 }, "<0.1");

          const c = { v: 0 };
          const cible = document.querySelector(".dx-profit");
          tl.to(c, {
            v: 1240,
            duration: 1.1,
            ease: "power1.out",
            onUpdate: () => {
              if (cible) cible.textContent = `+${Math.round(c.v).toLocaleString("fr-FR")} DA`;
            },
          });

          tl.to(
            [".dx-script", ".dx-angles", ".dx-sourcing", ".dx-phone", ...frames, captions[3]],
            { autoAlpha: 0, y: -34, duration: 0.7, stagger: 0.02 },
            "+=0.5",
          );
          tl.to(".dx-final", { autoAlpha: 1, y: 0, duration: 0.8 });
        });
      }, racine);

      detruire = () => ctx.revert();
    })();

    return () => detruire?.();
  }, []);

  /** Decoupe un titre en mots animables. */
  const mots = (t: string) =>
    t.split(" ").map((m, i) => (
      <span key={i} className="st-mot inline-block">
        {m}&nbsp;
      </span>
    ));

  return (
    <div ref={racine} className="overflow-x-clip">
      {/* ========================================================== BARRE */}
      {/* Volontairement minimale : un visiteur venu d'une publicite n'a que
          deux choses a faire ici, comprendre puis essayer. Lui montrer
          "Historique" ou "Diagnostic" ne ferait que le disperser. */}
      <header className="absolute inset-x-0 top-0 z-50">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
          {/* Sur la vitrine, les barres centrales respirent : le premier
              signe de vie que voit un visiteur venu d'une publicite. */}
          <span className="flex shrink-0 items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-500/15 text-brand-300 ring-1 ring-brand-500/30">
              <MarqueHooked className="h-[19px] w-[19px]" anime />
            </span>
            <span className="whitespace-nowrap text-sm font-semibold tracking-tight text-mist-100">
              Hooked <span className="text-brand-300">Lab</span>
            </span>
          </span>

          <nav className="flex items-center gap-1.5 sm:gap-3">
            <a
              href="/tarifs"
              className="hidden rounded-full px-3 py-1.5 text-sm text-mist-300 transition hover:text-mist-100 sm:inline-block"
            >
              Tarifs
            </a>
            <Link
              href="/analyser"
              className="rounded-full border border-brand-500/40 bg-brand-500/10 px-4 py-1.5 text-sm font-medium text-brand-300 transition hover:border-brand-500/70 hover:text-brand-200"
            >
              Ouvrir l&apos;outil
            </Link>
          </nav>
        </div>
      </header>

      {/* ============================================================= HERO */}
      <section className="sec-hero aurora-glow grain relative border-b border-ink-800 px-5 pb-14 pt-24 sm:pb-16 sm:pt-28">
        {/* Sur mobile tout est centre et le produit passe en premier ; a partir
            de lg on repasse en deux colonnes avec le texte aligne a gauche. */}
        <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-12">
          <div className="text-center lg:text-left">
            <span className="hero-sous inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/[0.07] px-4 py-1.5 text-xs text-brand-300">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-400" />
              Pour les e-commercants algériens
            </span>

            <h1 className="mx-auto mt-6 max-w-2xl text-[2rem] font-medium leading-[1.08] tracking-[-0.02em] text-mist-100 sm:text-5xl lg:mx-0 lg:text-6xl">
              {"Chaque créative virale cache un produit gagnant.".split(" ").map((mot, i) => (
                <span key={i} className="hero-mot inline-block will-change-transform">
                  {mot}&nbsp;
                </span>
              ))}
              <span className="hero-mot text-gold inline-block will-change-transform">Disseque-la.</span>
            </h1>

            <p className="hero-sous mx-auto mt-5 max-w-xl text-[15px] font-light leading-relaxed text-mist-300 sm:text-base lg:mx-0">
              Colle une pub TikTok, Instagram ou Facebook. L&apos;IA extrait le script, decompose la
              stratégie, source le produit sur Alibaba et 1688, et calcule ta rentabilité en
              paiement à la livraison.
            </p>

            <div className="hero-cta mt-8 flex flex-col items-center gap-3 sm:flex-row sm:flex-wrap sm:justify-center lg:justify-start">
              <Magnetic>
                <Link
                  href="/analyser"
                  className="cta-aurora inline-block w-full rounded-full px-7 py-3.5 text-center text-sm font-semibold sm:w-auto sm:py-3"
                >
                  Analyser ma première créative
                </Link>
              </Magnetic>
              <a
                href="#dissection"
                className="w-full rounded-full border border-ink-600 px-7 py-3.5 text-center text-sm font-medium text-mist-200 transition hover:border-brand-500/50 hover:text-brand-300 sm:w-auto sm:py-3"
              >
                Voir la dissection ↓
              </a>
            </div>

            <div className="hero-sous mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-mist-400 lg:justify-start lg:gap-x-6">
              <span>3 minutes par analyse</span>
              <span className="h-3 w-px bg-ink-600" />
              <span>Vidéos et images</span>
              <span className="h-3 w-px bg-ink-600" />
              <span>Darija prête à tourner</span>
            </div>
          </div>

          <div>
            <div className="relative mx-auto w-full max-w-[168px] sm:max-w-[230px] lg:max-w-[260px]">
              {/* anneaux qui pulsent derriere le telephone */}
              {[0, 1200, 2400].map((d, i) => (
                <span
                  key={i}
                  className="anim-ring absolute left-1/2 top-1/2 h-44 w-44 rounded-full border border-brand-500/25 sm:h-60 sm:w-60 lg:h-64 lg:w-64"
                  style={{ "--d": `${d}ms` } as React.CSSProperties}
                />
              ))}
              <div className="hero-phone anim-float relative">
                <MockPhone />
              </div>

              {/* Sur grand ecran les etiquettes flottent autour du produit. */}
              <span className="hero-chip absolute -left-24 top-8 hidden rounded-full border border-brand-500/35 bg-ink-900/90 px-3 py-1.5 text-xs font-medium text-brand-300 backdrop-blur lg:block">
                Hook 8/10
              </span>
              <span className="hero-chip absolute -right-28 top-32 hidden rounded-full border border-copper/40 bg-ink-900/90 px-3 py-1.5 text-xs font-medium text-copper backdrop-blur lg:block">
                Script extrait
              </span>
              <span className="hero-chip absolute -left-28 bottom-40 hidden rounded-full border border-brand-500/35 bg-ink-900/90 px-3 py-1.5 text-xs font-medium text-champagne backdrop-blur lg:block">
                Trouve sur 1688
              </span>
              <span className="hero-chip absolute -right-24 bottom-14 hidden rounded-full border border-jade/40 bg-ink-900/90 px-3 py-1.5 text-xs font-medium text-jade backdrop-blur lg:block">
                +1 240 DA / commande
              </span>
            </div>

            {/* En dessous de lg, elles passent en rangee centree sous le produit
                plutot que d'etre masquees : c'est la preuve de valeur. */}
            <div className="mt-5 flex flex-wrap justify-center gap-2 lg:hidden">
              <span className="hero-chip rounded-full border border-brand-500/35 bg-ink-900/90 px-3 py-1.5 text-[11px] font-medium text-brand-300">
                Hook 8/10
              </span>
              <span className="hero-chip rounded-full border border-copper/40 bg-ink-900/90 px-3 py-1.5 text-[11px] font-medium text-copper">
                Script extrait
              </span>
              <span className="hero-chip rounded-full border border-brand-500/35 bg-ink-900/90 px-3 py-1.5 text-[11px] font-medium text-champagne">
                Trouve sur 1688
              </span>
              <span className="hero-chip rounded-full border border-jade/40 bg-ink-900/90 px-3 py-1.5 text-[11px] font-medium text-jade">
                +1 240 DA / commande
              </span>
            </div>
          </div>
        </div>

        <div className="relative z-10 mt-12 flex justify-center">
          <span className="animate-bounce text-xs text-mist-400">scrolle pour dissequer ↓</span>
        </div>
      </section>

      {/* ============================================= SCENE DE DISSECTION */}
      <section id="dissection" className="sec-dissect relative hidden h-screen overflow-hidden border-b border-ink-800 md:block">
        {["Extraction des images clés", "Le script, mot pour mot", "Les angles qui font vendre", "Le produit, source et chiffre"].map((c, i) => (
          <div key={i} className="dx-caption absolute inset-x-0 top-14 z-20 text-center">
            <span className="font-mono text-xs uppercase tracking-[0.3em] text-brand-400">0{i + 1}</span>
            <h2 className="mt-2 text-3xl font-medium tracking-[-0.02em] text-mist-100">{c}</h2>
          </div>
        ))}

        <div className="absolute left-1/2 top-6 z-20 flex -translate-x-1/2 gap-2">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className="dx-dot h-1.5 w-8 rounded-full bg-ink-600" />
          ))}
        </div>

        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="dx-frame absolute left-1/2 top-1/2 z-10 -ml-[34px] -mt-14">
            <MiniFrame t={`0:0${i + 1}.${i * 2}`} decalage={i * 900} />
          </div>
        ))}

        <div className="dx-phone absolute left-1/2 top-1/2 z-10 w-[240px] -translate-x-1/2 -translate-y-1/2">
          <div className="relative">
            <MockPhone />
            <div className="anim-scanline pointer-events-none absolute inset-x-0 h-12 bg-gradient-to-b from-transparent via-brand-400/45 to-transparent" />
          </div>
        </div>

        <div className="dx-script border-gold absolute left-10 top-1/2 z-20 w-[330px] -translate-y-1/2 rounded-xl p-5 shadow-2xl shadow-black/60">
          <div className="mb-3 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-brand-400" />
            <span className="text-xs font-medium uppercase tracking-wide text-brand-300">Script reconstitue</span>
          </div>
          <div className="space-y-2">
            {SCRIPT_LIGNES.map((l, i) => (
              <p key={i} className="dx-ligne flex gap-2 text-[13px] leading-snug text-mist-200">
                <span className="shrink-0 font-mono text-[10px] tabular-nums text-mist-400">0:0{i + 1}</span>
                {l}
              </p>
            ))}
          </div>
        </div>

        <div className="dx-angles border-gold absolute right-10 top-1/2 z-20 w-[300px] -translate-y-1/2 rounded-xl p-5 shadow-2xl shadow-black/60">
          <div className="mb-3 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-copper" />
            <span className="text-xs font-medium uppercase tracking-wide text-brand-300">Angles détectés</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {ANGLES_CHIPS.map((a) => (
              <span
                key={a.t}
                className="dx-chip rounded-full px-3 py-1.5 text-xs font-medium"
                style={{ backgroundColor: `${a.c}1c`, color: a.c, border: `1px solid ${a.c}55` }}
              >
                {a.t}
              </span>
            ))}
          </div>
        </div>

        <div className="dx-sourcing border-gold absolute bottom-10 left-1/2 z-20 w-[560px] -translate-x-1/2 rounded-xl p-5 shadow-2xl shadow-black/60">
          <div className="grid grid-cols-3 items-center gap-4">
            <div>
              <div className="text-[11px] uppercase tracking-wide text-mist-400">Achat 1688</div>
              <div className="mt-1 text-xl font-semibold tabular-nums text-mist-100">2,10 $</div>
              <div className="text-[11px] text-mist-400">≈ 530 DA rendu</div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wide text-mist-400">Vente DZ</div>
              <div className="mt-1 text-xl font-semibold tabular-nums text-mist-100">4 900 DA</div>
              <div className="text-[11px] text-mist-400">paiement à la livraison</div>
            </div>
            <div className="rounded-lg bg-jade/12 px-3 py-2 ring-1 ring-inset ring-jade/35">
              <div className="text-[11px] uppercase tracking-wide text-jade">Profit / commande</div>
              <div className="dx-profit mt-1 text-2xl font-bold tabular-nums text-jade">+0 DA</div>
            </div>
          </div>
        </div>

        <div className="dx-final absolute inset-0 z-30 flex flex-col items-center justify-center gap-6 text-center">
          <h2 className="max-w-2xl text-4xl font-medium leading-tight tracking-[-0.02em] text-mist-100">
            Tout ca, en <span className="text-gold">3 minutes</span>, sur n&apos;importe quelle créative.
          </h2>
          <Magnetic>
            <Link href="/analyser" className="cta-aurora inline-block rounded-full px-8 py-3.5 text-sm font-semibold">
              Dissequer une créative
            </Link>
          </Magnetic>
        </div>
      </section>

      {/* ============================================ DISSECTION — MOBILE
          Le scroll-jacking d'un ecran epingle est penible au doigt : sur
          mobile la meme sequence est deroulee verticalement, chaque etape
          revelant son propre visuel anime au scroll. */}
      <section className="mb-dissect border-b border-ink-800 px-5 py-14 md:hidden">
        <h2 className="st-titre text-center text-2xl font-medium tracking-[-0.02em] text-mist-100">
          {mots("La dissection, étape par étape")}
        </h2>
        <p className="st-reveal mx-auto mt-3 max-w-xs text-center text-sm font-light text-mist-300">
          Ce que l&apos;application fait de ta créative, en quatre temps.
        </p>

        <div className="mx-auto mt-10 max-w-sm space-y-14">
          {/* 01 — la creative scannee */}
          <div className="mb-etape text-center">
            <span className="font-mono text-xs uppercase tracking-[0.3em] text-brand-400">01</span>
            <h3 className="mt-2 text-xl font-medium text-mist-100">Extraction des images clés</h3>
            <div className="relative mx-auto mt-5 w-40">
              <MockPhone />
              <div className="anim-scanline pointer-events-none absolute inset-x-0 h-10 bg-gradient-to-b from-transparent via-brand-400/50 to-transparent" />
            </div>
            <div className="mb-frames mt-5 flex justify-center gap-2">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="mb-frame">
                  <MiniFrame t={`0:0${i + 1}`} decalage={i * 900} />
                </div>
              ))}
            </div>
            <p className="mx-auto mt-4 max-w-xs text-sm font-light text-mist-300">
              La vidéo est découpée en images clés, avec detection des changements de plan.
            </p>
          </div>

          {/* 02 — le script */}
          <div className="mb-etape text-center">
            <span className="font-mono text-xs uppercase tracking-[0.3em] text-brand-400">02</span>
            <h3 className="mt-2 text-xl font-medium text-mist-100">Le script, mot pour mot</h3>
            <div className="border-gold mx-auto mt-5 rounded-xl p-4 text-left">
              {SCRIPT_LIGNES.map((l, i) => (
                <p key={i} className="mb-ligne flex gap-2 py-1 text-[13px] leading-snug text-mist-200">
                  <span className="shrink-0 font-mono text-[10px] tabular-nums text-mist-400">
                    0:0{i + 1}
                  </span>
                  {l}
                </p>
              ))}
            </div>
            <p className="mx-auto mt-4 max-w-xs text-sm font-light text-mist-300">
              Voix off et textes a l&apos;écran, reconstitues et horodates.
            </p>
          </div>

          {/* 03 — les angles */}
          <div className="mb-etape text-center">
            <span className="font-mono text-xs uppercase tracking-[0.3em] text-brand-400">03</span>
            <h3 className="mt-2 text-xl font-medium text-mist-100">Les angles qui font vendre</h3>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {ANGLES_CHIPS.map((a) => (
                <span
                  key={a.t}
                  className="mb-chip rounded-full px-3 py-1.5 text-xs font-medium"
                  style={{ backgroundColor: `${a.c}1c`, color: a.c, border: `1px solid ${a.c}55` }}
                >
                  {a.t}
                </span>
              ))}
            </div>
            <p className="mx-auto mt-4 max-w-xs text-sm font-light text-mist-300">
              Chaque levier de persuasion est identifié et note sur 10.
            </p>
          </div>

          {/* 04 — sourcing et profit */}
          <div className="mb-etape text-center">
            <span className="font-mono text-xs uppercase tracking-[0.3em] text-brand-400">04</span>
            <h3 className="mt-2 text-xl font-medium text-mist-100">Le produit, source et chiffre</h3>
            <div className="border-gold mx-auto mt-5 grid grid-cols-3 gap-2 rounded-xl p-4">
              <div>
                <div className="text-[10px] uppercase tracking-wide text-mist-400">Achat</div>
                <div className="mt-1 text-base font-semibold tabular-nums text-mist-100">2,10 $</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wide text-mist-400">Vente</div>
                <div className="mt-1 text-base font-semibold tabular-nums text-mist-100">4 900 DA</div>
              </div>
              <div className="rounded-lg bg-jade/12 px-1.5 py-1 ring-1 ring-inset ring-jade/35">
                <div className="text-[10px] uppercase tracking-wide text-jade">Profit</div>
                <div className="mb-profit mt-1 text-base font-bold tabular-nums text-jade">+0 DA</div>
              </div>
            </div>
            <p className="mx-auto mt-4 max-w-xs text-sm font-light text-mist-300">
              Produit source sur 1688, rentabilité calculee au taux de livraison algérien.
            </p>
          </div>
        </div>

        <div className="mt-12 text-center">
          <Magnetic>
            <Link
              href="/analyser"
              className="cta-aurora inline-block w-full rounded-full px-7 py-3.5 text-center text-sm font-semibold"
            >
              Dissequer une créative
            </Link>
          </Magnetic>
        </div>
      </section>

      {/* ============================ BANDEAU DE RESULTATS (preuve produit) */}
      <section className="marquee-hold overflow-hidden border-b border-ink-800 py-14">
        <div className="mx-auto mb-8 max-w-3xl px-5 text-center">
          <h2 className="st-titre text-3xl font-medium tracking-[-0.02em] text-mist-100">
            {mots("Des produits analyses, chiffres, prêts a lancer")}
          </h2>
          <p className="st-reveal mx-auto mt-3 max-w-xl text-sm font-light text-mist-300">
            Voila ce que tu recois pour chaque créative — passe la souris sur une carte pour
            arreter le defilement.
          </p>
        </div>

        <div className="flex w-max gap-3 anim-marquee">
          {[...Array(2)].flatMap((_, rep) =>
            RESULTATS.map((r, i) => <CarteResultat key={`${rep}-${i}`} r={r} />),
          )}
        </div>
        <div className="mt-3 flex w-max gap-3 anim-marquee-reverse">
          {[...Array(2)].flatMap((_, rep) =>
            [...RESULTATS].reverse().map((r, i) => <CarteResultat key={`${rep}-${i}`} r={r} />),
          )}
        </div>
      </section>

      {/* =================================================== PREUVE CHIFFREE */}
      <section className="border-b border-ink-800 px-5 py-16">
        <div className="mx-auto grid max-w-5xl gap-6 text-center sm:grid-cols-3">
          {[
            { fin: 3, suffixe: " min", label: "par analyse complète" },
            { fin: 6, suffixe: "", label: "livrables dans chaque rapport" },
            { fin: 58, suffixe: "", label: "wilayas couvertes par le calcul COD" },
          ].map((s) => (
            <div key={s.label} className="st-reveal">
              <div className="text-gold st-compteur text-5xl font-semibold tabular-nums" data-fin={s.fin} data-suffixe={s.suffixe}>
                0
              </div>
              <p className="mt-2 text-sm font-light text-mist-300">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================== FEATURES */}
      <section className="border-b border-ink-800 px-5 py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="st-titre text-center text-3xl font-medium tracking-[-0.02em] text-mist-100">
            {mots("Un rapport qui remplace une journee de travail")}
          </h2>
          <p className="st-reveal mx-auto mt-3 max-w-2xl text-center text-sm font-light text-mist-300">
            Ce que fait un media buyer, un sourceur et un copywriter — reuni dans une seule analyse.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {BLOCS.map((b) => (
              <div
                key={b.titre}
                className="st-reveal group relative overflow-hidden rounded-xl border border-ink-700 bg-ink-900 p-6 text-center transition-all duration-300 hover:-translate-y-1.5 hover:border-brand-500/40 hover:shadow-2xl hover:shadow-black/50 sm:text-left"
              >
                {/* halo qui s'allume au survol */}
                <span className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-brand-500/0 blur-3xl transition-all duration-500 group-hover:bg-brand-500/15" />
                <span className="relative mx-auto grid h-10 w-10 place-items-center rounded-lg border border-brand-500/25 bg-brand-500/[0.08] text-brand-300 transition-transform duration-300 group-hover:scale-110 sm:mx-0">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                    <path d={b.icone} />
                  </svg>
                </span>
                <h3 className="relative mt-4 text-base font-medium text-mist-100">{b.titre}</h3>
                <p className="relative mt-2 text-sm font-light leading-relaxed text-mist-300">{b.texte}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Tarifs />

      {/* =============================================================== FAQ */}
      <section className="border-b border-ink-800 px-5 py-16">
        <div className="mx-auto max-w-3xl">
          <h2 className="st-titre text-center text-3xl font-medium tracking-[-0.02em] text-mist-100">
            {mots("Questions frequentes")}
          </h2>
          <div className="mt-10 space-y-3">
            {FAQ.map((f) => (
              <details
                key={f.q}
                className="st-reveal group rounded-xl border border-ink-700 bg-ink-900 px-5 py-4 transition hover:border-brand-500/30 open:border-brand-500/35 open:bg-ink-850"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium text-mist-100 marker:content-none">
                  {f.q}
                  <span className="shrink-0 text-brand-400 transition-transform duration-300 group-open:rotate-45">+</span>
                </summary>
                <p className="mt-2.5 text-sm font-light leading-relaxed text-mist-300">{f.r}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================= CTA FINAL */}
      <section className="aurora-glow grain relative px-5 py-24">
        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <div className="st-reveal mx-auto mb-8 w-28">
            <ProduitMontre className="anim-float h-auto w-full" />
          </div>
          <h2 className="st-titre text-3xl font-medium tracking-[-0.02em] text-mist-100 sm:text-4xl">
            {mots("La prochaine créative que tu vois passer peut devenir ton produit gagnant.")}
          </h2>
          <div className="st-reveal mt-8">
            <Magnetic>
              <Link href="/analyser" className="cta-aurora inline-block rounded-full px-8 py-3.5 text-sm font-semibold">
                Analyser une créative maintenant
              </Link>
            </Magnetic>
          </div>
          <p className="st-reveal mt-4 text-xs text-mist-400">
            Abonnement dès 2 000 DA par mois. Sans engagement possible.
          </p>
        </div>
      </section>
    </div>
  );
}
