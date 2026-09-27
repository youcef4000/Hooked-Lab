"use client";

/* ============================================================================
   Landing scroll-driven, registre "or sur noir". Reference : Framer.

   Ce qu'on en retient : sombre dominant, un seul accent (l'or), titres
   serres et grands, sections qui respirent, et le scroll comme fil narratif.

   La scene centrale est epinglee : pendant le scroll, une creative se fait
   decortiquer — images, script, angles, sourcing, profit — c'est exactement
   le travail de l'application. Autour d'elle, le mouvement reste discret :
   une entree au scroll, un etat de survol, et deux elements pilotes par le
   defilement (la barre de lecture, la ligne des etapes de demarrage).
   GSAP ScrollTrigger pilote l'ensemble, charge dynamiquement cote client.
   ========================================================================== */

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { CarteResultat, MiniFrame, MockPhone, ProduitMontre, type Resultat } from "@/components/landing/Visuels";
import { Tarifs } from "@/components/landing/Tarifs";
import { MarqueHooked } from "@/components/Logo";
import { CarteVivante } from "@/components/Reveal";
import { ENGAGEMENTS, PALIERS, prixMensuelAvecRemise } from "@/lib/tarifs";
import { CARTE_ACTIVE, MOYENS_PAIEMENT } from "@/lib/public";

/* ------------------------------------------------------------------ donnees */

/** Resultats d'analyse montres dans le bandeau : le livrable, pas des vignettes. */
const RESULTATS: Resultat[] = [
  { produit: "Montre connectée sport", categorie: "High-tech", score: 82, achat: "2,10 $", vente: "4 900 DA", profit: "+1 240 DA", hook: 8 },
  { produit: "Mini blender portable", categorie: "Cuisine", score: 74, achat: "3,40 $", vente: "5 500 DA", profit: "+1 180 DA", hook: 7 },
  { produit: "Lampe LED coucher de soleil", categorie: "Déco", score: 68, achat: "1,80 $", vente: "3 200 DA", profit: "+740 DA", hook: 9 },
  { produit: "Organisateur de voiture", categorie: "Auto", score: 71, achat: "1,20 $", vente: "2 900 DA", profit: "+820 DA", hook: 6 },
  { produit: "Brosse lissante céramique", categorie: "Beauté", score: 79, achat: "4,60 $", vente: "6 900 DA", profit: "+1 510 DA", hook: 8 },
  { produit: "Aspirateur sans fil auto", categorie: "Auto", score: 63, achat: "5,90 $", vente: "7 400 DA", profit: "+690 DA", hook: 5 },
  { produit: "Tapis de jeu bébé pliable", categorie: "Bébé", score: 77, achat: "6,20 $", vente: "8 900 DA", profit: "+1 630 DA", hook: 7 },
  { produit: "Projecteur astronaute", categorie: "Déco", score: 85, achat: "3,10 $", vente: "5 900 DA", profit: "+1 720 DA", hook: 9 },
];

/** Comment on demarre : la question numero un d'un acheteur, avant de payer. */
const DEMARRAGE = CARTE_ACTIVE
  ? [
      { n: "01", titre: "Crée ton compte", texte: "Nom, téléphone, email. Deux minutes." },
      { n: "02", titre: "Choisis ta formule", texte: "Mensuelle sans engagement, ou 6 et 12 mois moins chers." },
      { n: "03", titre: "Paie en 30 secondes", texte: "Carte Visa, Mastercard ou RedotPay. En dinars : BaridiMob ou CCP." },
      { n: "04", titre: "Analyse tout de suite", texte: "Tes crédits arrivent à la seconde. Colle ta première créative." },
    ]
  : [
      { n: "01", titre: "Crée ton compte", texte: "Nom, téléphone, email. Deux minutes, aucune carte demandée." },
      { n: "02", titre: "On t'appelle", texte: "Pour confirmer ta formule et te donner les coordonnées de paiement." },
      { n: "03", titre: "Paie par BaridiMob ou CCP", texte: "Tu envoies la capture du versement sur WhatsApp." },
      { n: "04", titre: "Reçois ton code", texte: "Tu le saisis dans ton compte : tes crédits arrivent aussitôt." },
    ];

const TITRE_DEMARRAGE = CARTE_ACTIVE
  ? "Prêt à analyser en deux minutes."
  : "Sans carte bancaire. Activé le jour même.";
const SOUS_TITRE_DEMARRAGE = CARTE_ACTIVE
  ? "Un compte, un paiement, et ta première analyse part aussitôt. Aucune installation."
  : "Pas de paiement en ligne : un appel, un versement BaridiMob ou CCP, et un code qui charge tes crédits.";

const FAQ = [
  { q: "Est-ce que ça marche avec les vidéos TikTok et Instagram ?", r: "Oui. Tu colles le lien du post, ou tu déposes directement le fichier vidéo ou l'image — c'est la méthode la plus fiable, les plateformes bloquant souvent la récupération automatique. Le rapport est identique dans les deux cas." },
  {
    q: "Comment se passe le paiement ?",
    r: CARTE_ACTIVE
      ? "Par carte Visa, Mastercard ou RedotPay depuis ton compte : tes crédits arrivent à la seconde. En Algérie, tu peux aussi payer en dinars par BaridiMob ou CCP : on t'appelle, tu envoies la capture, tu reçois un code."
      : "Sans carte bancaire. Tu crées ton compte, on t'appelle pour confirmer ta formule, tu paies par BaridiMob ou versement CCP, et tu reçois un code qui charge tes crédits immédiatement.",
  },
  { q: "Les prix de sourcing sont-ils fiables ?", r: "Ce sont des fourchettes estimées par l'IA, avec un indice de fiabilité affiché. Les liens Alibaba et 1688 générés te donnent les prix réels des fournisseurs en un clic, et la recherche par image retrouve le produit exact." },
  { q: "Le calcul de rentabilité est-il adapté à l'Algérie ?", r: "C'est son seul objet : paiement à la livraison, taux de livraison réel (55 à 75 %), coût des retours, tarifs à domicile et en stop desk, taux de change du marché parallèle. Chaque hypothèse est ajustable." },
  { q: "Que se passe-t-il si une analyse échoue ?", r: "Tes crédits te sont rendus automatiquement. Une analyse ne se facture que si tu reçois ton rapport." },
  { q: "En quelle langue sont les livrables ?", r: "L'analyse est en français. Le script vidéo est réécrit en darija algérienne telle qu'on la parle, et la page de vente est fournie en français et en arabe." },
];

const SCRIPT_LIGNES = [
  "« Arrête de perdre ton argent… »",
  "« Cette montre fait tout ce que tu veux »",
  "[démonstration — gros plan poignet]",
  "« Regarde comme c'est simple »",
  "« Livraison 58 wilayas, paiement main à main »",
  "« Commande maintenant, stock limité »",
];

const ANGLES_CHIPS = [
  { t: "Hook choc — 8/10", c: "#f2dfa0" },
  { t: "Problème / solution", c: "#d4af37" },
  { t: "Preuve en démonstration", c: "#b87333" },
  { t: "Urgence stock limité", c: "#e08c3a" },
  { t: "Confiance COD", c: "#3f7d6b" },
];

/** Le prix d'appel affiche : le palier le moins cher, a la meilleure remise. */
const REMISE_MAX = Math.max(...ENGAGEMENTS.map((e) => e.remise));
const PRIX_PLANCHER = Math.min(...PALIERS.map((p) => prixMensuelAvecRemise(p.base, REMISE_MAX)));
const PRIX_PLANCHER_INTL = Math.min(...PALIERS.map((p) => Math.round(p.baseInternational * (1 - REMISE_MAX))));

const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP?.replace(/\D/g, "") ?? "";
const LIEN_WHATSAPP = WHATSAPP
  ? `https://wa.me/${WHATSAPP}?text=${encodeURIComponent("Bonjour, j'ai une question sur Hooked Lab.")}`
  : "";

/* --------------------------------------------------------------- utilitaires */

function Magnetic({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div
      ref={ref}
      className={`inline-block transition-transform duration-200 ease-out ${className}`}
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

function IconeWhatsApp({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.4.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.4.1-.6.3a2.5 2.5 0 0 0-.8 1.9 4.4 4.4 0 0 0 .9 2.3 10 10 0 0 0 3.8 3.4c1.4.6 2 .7 2.7.6.4-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2l-.4-.2z" />
    </svg>
  );
}

/* --------------------------------------------------------- visuels du bento */

/** Trois lignes de script horodatees : ce que contient l'onglet Script. */
function VisuelScript() {
  return (
    <div className="mt-5 space-y-2 rounded-[var(--r-md)] border border-ink-800 bg-ink-950/60 p-4">
      {SCRIPT_LIGNES.slice(0, 3).map((l, i) => (
        <p key={i} className="flex gap-3 text-[13px] leading-snug text-mist-200">
          <span className="shrink-0 font-mono text-[10px] tabular-nums text-brand-400/80">0:0{i + 1}</span>
          {l}
        </p>
      ))}
    </div>
  );
}

/** Le calcul COD resume en barres : le prix de vente fond a chaque etape. */
function VisuelRentabilite() {
  const barres = [
    { l: "Vente", v: 100, m: "4 900", c: "bg-brand-400" },
    { l: "Livrées", v: 68, m: "3 330", c: "bg-brand-500" },
    { l: "− produit", v: 44, m: "2 150", c: "bg-copper" },
    { l: "− pub, retours", v: 30, m: "1 470", c: "bg-bronze" },
    { l: "Profit", v: 25, m: "+1 240", c: "bg-jade" },
  ];
  return (
    <div className="graph-renta mt-5 rounded-[var(--r-md)] border border-ink-800 bg-ink-950/60 p-4">
      <div className="flex h-32 items-end gap-3">
        {barres.map((b) => (
          <div key={b.l} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
            <span className={`text-[11px] font-medium tabular-nums ${b.l === "Profit" ? "text-jade" : "text-mist-300"}`}>
              {b.m}
            </span>
            <div
              className={`barre-graph w-full max-w-10 rounded-t-[5px] ${b.c}`}
              style={{ height: `${b.v * 0.78}%` }}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-3">
        {barres.map((b) => (
          <span key={b.l} className="flex-1 truncate text-center text-[10px] text-mist-400">
            {b.l}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Le score DZ et ses cinq criteres. */
function VisuelScore() {
  const criteres = [
    { l: "Demande", v: 88 },
    { l: "Concurrence", v: 64 },
    { l: "Marge", v: 81 },
    { l: "Logistique", v: 90 },
    { l: "Tournage", v: 76 },
  ];
  return (
    <div className="mt-5 flex items-center gap-5 rounded-[var(--r-md)] border border-ink-800 bg-ink-950/60 p-4">
      <div className="grid h-20 w-20 shrink-0 place-items-center rounded-full border-2 border-brand-500/70 bg-brand-500/[0.07]">
        <span className="text-center leading-none">
          <span className="st-compteur block text-2xl font-semibold tabular-nums text-brand-300" data-fin="82">
            82
          </span>
          <span className="text-[10px] text-mist-400">/100</span>
        </span>
      </div>
      <div className="min-w-0 flex-1 space-y-1.5">
        {criteres.map((c) => (
          <div key={c.l} className="flex items-center gap-2">
            <span className="w-20 shrink-0 text-[11px] text-mist-400">{c.l}</span>
            <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink-800">
              <span
                className="barre-critere block h-full origin-left rounded-full bg-brand-500"
                style={{ transform: `scaleX(${c.v / 100})` }}
              />
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Trois angles notes : un extrait de l'onglet Angles. */
function VisuelAngles() {
  return (
    <div className="mt-5 flex flex-wrap gap-2">
      {ANGLES_CHIPS.slice(0, 4).map((a) => (
        <span
          key={a.t}
          className="rounded-full px-3 py-1.5 text-xs font-medium"
          style={{ backgroundColor: `${a.c}1c`, color: a.c, border: `1px solid ${a.c}55` }}
        >
          {a.t}
        </span>
      ))}
    </div>
  );
}

/** Fourchettes de prix par plateforme, comme dans l'onglet Sourcing. */
function VisuelSourcing() {
  return (
    <div className="mt-5 divide-y divide-ink-800 rounded-[var(--r-md)] border border-ink-800 bg-ink-950/60 text-[13px]">
      {[
        { p: "1688", f: "2,10 – 2,60 $" },
        { p: "Alibaba", f: "2,40 – 3,10 $" },
        { p: "Par image", f: "produit exact" },
      ].map((r) => (
        <div key={r.p} className="flex items-center justify-between px-3.5 py-2.5">
          <span className="text-mist-300">{r.p}</span>
          <span className="font-medium tabular-nums text-mist-100">{r.f}</span>
        </div>
      ))}
    </div>
  );
}

/** Les livrables du pack, en etiquettes. */
function VisuelPack() {
  return (
    <div className="mt-5 flex flex-wrap gap-2">
      {["Script darija", "Page FR", "صفحة البيع", "Annonces Meta", "Annonces TikTok"].map((t) => (
        <span
          key={t}
          className="rounded-full border border-ink-700 bg-ink-950/60 px-3 py-1.5 text-xs text-mist-200"
        >
          {t}
        </span>
      ))}
    </div>
  );
}

type Bloc = {
  titre: string;
  texte: string;
  icone: string;
  /** Les grandes cartes portent un apercu du livrable : c'est la hierarchie. */
  visuel?: ReactNode;
  classe: string;
};

const BLOCS: Bloc[] = [
  {
    titre: "Script et séquences",
    texte: "Le script complet, voix off et textes à l'écran, découpé plan par plan avec le rôle de chaque séquence dans la vente.",
    icone: "M4 6h16M4 12h10M4 18h13",
    visuel: <VisuelScript />,
    classe: "sm:col-span-2",
  },
  {
    titre: "Angles marketing notés",
    texte: "Chaque levier de persuasion identifié et noté sur 10, puis réécrit pour le client algérien qui paie à la livraison.",
    icone: "M12 3l2.6 6.3 6.8.5-5.2 4.4 1.6 6.6L12 17.8 6.2 20.8l1.6-6.6L2.6 9.8l6.8-.5z",
    visuel: <VisuelAngles />,
    classe: "",
  },
  {
    titre: "Sourcing Alibaba et 1688",
    texte: "Le produit identifié, les requêtes traduites en vrai chinois de fournisseur, et la fourchette de prix d'achat.",
    icone: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4.2-4.2",
    visuel: <VisuelSourcing />,
    classe: "",
  },
  {
    titre: "Rentabilité COD",
    texte: "Taux de livraison, coût des retours, taux de change parallèle : le CPA maximum avant de perdre de l'argent.",
    icone: "M4 19V5m0 14h16M8 15l3.5-4 3 2.5L20 8",
    visuel: <VisuelRentabilite />,
    classe: "sm:col-span-2",
  },
  {
    titre: "Score de potentiel DZ",
    texte: "Demande, concurrence, marge, logistique et facilité de tournage : tu sais si le produit vaut le test.",
    icone: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zm0-13v5l3 2",
    visuel: <VisuelScore />,
    classe: "lg:col-span-2",
  },
  {
    titre: "Pack de lancement",
    texte: "Script en darija prêt à tourner, pages de vente en français et en arabe, annonces Facebook et TikTok.",
    icone: "M5 4h14v16l-7-3.5L5 20z",
    visuel: <VisuelPack />,
    classe: "",
  },
];

/* --------------------------------------------------------------------- page */

export default function Landing() {
  const racine = useRef<HTMLDivElement>(null);
  const [defile, setDefile] = useState(false);
  const [barreMobile, setBarreMobile] = useState(false);

  /* La barre du haut se fond dans le hero, puis prend un fond des qu'on
     defile ; la barre d'action mobile apparait une fois le hero depasse et
     s'efface devant le dernier appel a l'action, pour ne pas le doubler. */
  useEffect(() => {
    const surDefilement = () => setDefile(window.scrollY > 24);
    surDefilement();
    window.addEventListener("scroll", surDefilement, { passive: true });

    // La barre s'efface partout ou un bouton identique est deja a l'ecran.
    const zones = [".sec-hero", ".sec-final", ".cta-demarrer"]
      .map((c) => document.querySelector(c))
      .filter((e): e is Element => e !== null);
    const visibles = new Map<Element, boolean>();
    const observateur = new IntersectionObserver((entrees) => {
      entrees.forEach((e) => visibles.set(e.target, e.isIntersecting));
      setBarreMobile(!zones.some((z) => visibles.get(z)));
    });
    zones.forEach((z) => observateur.observe(z));

    return () => {
      window.removeEventListener("scroll", surDefilement);
      observateur.disconnect();
    };
  }, []);

  useEffect(() => {
    let detruire: (() => void) | undefined;

    (async () => {
      const gsap = (await import("gsap")).default;
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      gsap.registerPlugin(ScrollTrigger);

      const ctx = gsap.context(() => {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        const mm = gsap.matchMedia();

        /* --- Barre de lecture ------------------------------------------- */
        gsap.to(".progression-lecture", {
          scaleX: 1,
          ease: "none",
          scrollTrigger: { start: 0, end: "max", scrub: 0.3 },
        });

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
            delay: (i % 3) * 0.06,
            ease: "power3.out",
            scrollTrigger: { trigger: el, start: "top 88%" },
          });
        });

        /* --- Compteurs : la valeur finale est dans le HTML (lisible sans
               animation), on repart de zero seulement ici. ---------------- */
        gsap.utils.toArray<HTMLElement>(".st-compteur").forEach((el) => {
          const fin = Number(el.dataset.fin || 0);
          const suffixe = el.dataset.suffixe || "";
          const obj = { v: 0 };
          el.textContent = "0" + suffixe;
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

        /* --- Mini-graphiques du bento : les barres poussent ---------------- */
        gsap.from(".barre-graph", {
          scaleY: 0,
          duration: 0.6,
          stagger: 0.07,
          ease: "power3.out",
          scrollTrigger: { trigger: ".graph-renta", start: "top 85%" },
        });
        gsap.utils.toArray<HTMLElement>(".barre-critere").forEach((el, i) => {
          gsap.from(el, {
            scaleX: 0,
            duration: 0.6,
            delay: i * 0.06,
            ease: "power3.out",
            scrollTrigger: { trigger: el, start: "top 90%" },
          });
        });

        /* --- Titres de section : mots qui montent ------------------------- */
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

        /* --- Etapes de demarrage : la ligne se dessine au scroll ---------- */
        const etapes = gsap.utils.toArray<HTMLElement>(".etape");
        const allumer = (p: number) =>
          etapes.forEach((e, i) => {
            e.dataset.actif = String(p >= i / Math.max(1, etapes.length - 1) - 0.02);
          });
        const suiviEtapes = () => ({
          trigger: ".etapes",
          start: "top 72%",
          end: "bottom 58%",
          scrub: 0.4,
          onUpdate: (s: { progress: number }) => allumer(s.progress),
          onRefresh: (s: { progress: number }) => allumer(s.progress),
        });
        mm.add("(min-width: 768px)", () => {
          gsap.fromTo(".ligne-h", { scaleX: 0 }, { scaleX: 1, ease: "none", scrollTrigger: suiviEtapes() });
        });
        mm.add("(max-width: 767px)", () => {
          gsap.fromTo(".ligne-v", { scaleY: 0 }, { scaleY: 1, ease: "none", scrollTrigger: suiviEtapes() });
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
            cibleMobile.textContent = "+0 DA";
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
          const profitDx = document.querySelector(".dx-profit");
          if (profitDx) profitDx.textContent = "+0 DA";
          // Les etats de depart sont poses : la scene peut apparaitre.
          document.querySelector(".sec-dissect")?.classList.add("dx-pret");

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
          tl.to(c, {
            v: 1240,
            duration: 1.1,
            ease: "power1.out",
            onUpdate: () => {
              if (profitDx) profitDx.textContent = `+${Math.round(c.v).toLocaleString("fr-FR")} DA`;
            },
          });

          tl.to(
            [".dx-script", ".dx-angles", ".dx-sourcing", ".dx-phone", ...frames, captions[3]],
            { autoAlpha: 0, y: -34, duration: 0.7, stagger: 0.02 },
            "+=0.5",
          );
          tl.to(".dx-final", { autoAlpha: 1, y: 0, duration: 0.8 });

          return () => document.querySelector(".sec-dissect")?.classList.remove("dx-pret");
        });
      }, racine);

      // La scene epinglee ajoute 3 600 px de defilement. Les declencheurs
      // crees avant elle mais places en dessous l'ignoraient et se jouaient
      // trop tot : on les recalcule dans l'ordre de la page.
      ScrollTrigger.sort();
      ScrollTrigger.refresh();

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
          deux choses a faire ici, comprendre puis s'inscrire. Elle reste
          accessible tout au long du defilement, et prend un fond des qu'on
          quitte le haut de page. */}
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-[background-color,border-color] duration-300 ${
          defile
            ? "border-b border-ink-800/80 bg-ink-950/80 backdrop-blur-md"
            : "border-b border-transparent"
        }`}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-3.5 sm:py-4">
          {/* Sur la vitrine, les barres centrales respirent : le premier
              signe de vie que voit un visiteur venu d'une publicite. */}
          <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label="Hooked Lab, accueil">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-500/15 text-brand-300 ring-1 ring-brand-500/30">
              <MarqueHooked className="h-[19px] w-[19px]" anime />
            </span>
            <span className="whitespace-nowrap text-sm font-semibold tracking-tight text-mist-100">
              Hooked <span className="text-brand-300">Lab</span>
            </span>
          </Link>

          <nav className="flex items-center gap-1 sm:gap-2">
            <a
              href="#demarrer"
              className="hidden rounded-full px-3 py-1.5 text-sm text-mist-300 transition hover:text-mist-100 lg:inline-block"
            >
              Comment ça marche
            </a>
            <Link
              href="/tarifs"
              className="hidden rounded-full px-3 py-1.5 text-sm text-mist-300 transition hover:text-mist-100 sm:inline-block"
            >
              Tarifs
            </Link>
            <Link
              href="/connexion"
              className="rounded-full px-3 py-1.5 text-sm text-mist-300 transition hover:text-mist-100"
            >
              Connexion
            </Link>
            <Link
              href="/inscription"
              className="hidden rounded-full border border-brand-500/40 bg-brand-500/10 px-4 py-1.5 text-sm font-medium text-brand-300 transition hover:border-brand-500/70 hover:text-brand-200 sm:inline-block"
            >
              Créer mon compte
            </Link>
          </nav>
        </div>
        {/* Barre de lecture : l'or avance avec le defilement. */}
        <div className="progression-lecture absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-brand-500 via-brand-300 to-brand-500" />
      </header>

      {/* ============================================================= HERO */}
      <section className="sec-hero aurora-glow grain relative border-b border-ink-800 px-5 pb-14 pt-28 sm:pb-20 sm:pt-32">
        {/* Sur mobile tout est centre et le produit passe en premier ; a partir
            de lg on repasse en deux colonnes avec le texte aligne a gauche. */}
        <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-12">
          <div className="text-center lg:text-left">
            <span className="hero-sous inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/[0.07] px-4 py-1.5 text-xs text-brand-300">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-400" />
              Pour les e-commerçants algériens
            </span>

            <h1 className="mx-auto mt-6 max-w-2xl text-[2.1rem] font-medium leading-[1.06] tracking-[-0.025em] text-mist-100 sm:text-5xl lg:mx-0 lg:text-[4rem]">
              {"Chaque créative virale cache un produit gagnant.".split(" ").map((mot, i) => (
                <span key={i} className="hero-mot inline-block will-change-transform">
                  {mot}&nbsp;
                </span>
              ))}
              <span className="hero-mot text-gold inline-block will-change-transform">Dissèque-la.</span>
            </h1>

            <p className="hero-sous mx-auto mt-5 max-w-xl text-[15px] font-light leading-relaxed text-mist-300 sm:text-base lg:mx-0">
              Colle une pub TikTok, Instagram ou Facebook. L&apos;IA extrait le script, décompose la
              stratégie, source le produit sur Alibaba et 1688, et calcule ta rentabilité en
              paiement à la livraison.
            </p>

            <div className="hero-cta mt-8 flex flex-col items-center gap-4 sm:flex-row sm:flex-wrap sm:justify-center lg:justify-start">
              <Magnetic className="w-full sm:w-auto">
                <Link
                  href="/analyser"
                  className="cta-aurora inline-block w-full rounded-full px-7 py-3.5 text-center text-sm font-semibold sm:w-auto sm:py-3"
                >
                  Analyser ma première créative
                </Link>
              </Magnetic>
              <a
                href="#dissection"
                className="group inline-flex items-center gap-1.5 px-2 py-1 text-sm font-medium text-mist-300 transition hover:text-brand-300"
              >
                Voir la dissection
                <span className="transition-transform duration-200 group-hover:translate-y-0.5">↓</span>
              </a>
            </div>

            <ul className="hero-sous mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-mist-400 lg:justify-start">
              {["Résultat en 3 minutes", "Vidéos et images", MOYENS_PAIEMENT].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-brand-500" />
                  {t}
                </li>
              ))}
            </ul>
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
                Trouvé sur 1688
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
                Trouvé sur 1688
              </span>
              <span className="hero-chip rounded-full border border-jade/40 bg-ink-900/90 px-3 py-1.5 text-[11px] font-medium text-jade">
                +1 240 DA / commande
              </span>
            </div>
          </div>
        </div>

        <div className="relative z-10 mt-12 hidden justify-center md:flex">
          <span className="animate-bounce text-xs text-mist-400">défile pour disséquer ↓</span>
        </div>
      </section>

      {/* ============================================= SCENE DE DISSECTION */}
      <section id="dissection" className="sec-dissect relative hidden h-screen scroll-mt-0 overflow-hidden border-b border-ink-800 md:block">
        {["Extraction des images clés", "Le script, mot pour mot", "Les angles qui font vendre", "Le produit, sourcé et chiffré"].map((c, i) => (
          <div key={i} className="dx-caption absolute inset-x-0 top-16 z-20 text-center">
            <span className="font-mono text-xs uppercase tracking-[0.3em] text-brand-400">0{i + 1}</span>
            <h2 className="mt-2 text-3xl font-medium tracking-[-0.02em] text-mist-100">{c}</h2>
          </div>
        ))}

        <div className="absolute left-1/2 top-8 z-20 flex -translate-x-1/2 gap-2">
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
            <span className="text-xs font-medium uppercase tracking-wide text-brand-300">Script reconstitué</span>
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
              <div className="dx-profit mt-1 text-2xl font-bold tabular-nums text-jade">+1 240 DA</div>
            </div>
          </div>
        </div>

        <div className="dx-final absolute inset-0 z-30 flex flex-col items-center justify-center gap-6 text-center">
          <h2 className="max-w-2xl text-4xl font-medium leading-tight tracking-[-0.02em] text-mist-100">
            Tout ça, en <span className="text-gold">3 minutes</span>, sur n&apos;importe quelle créative.
          </h2>
          <Magnetic>
            <Link href="/analyser" className="cta-aurora inline-block rounded-full px-8 py-3.5 text-sm font-semibold">
              Disséquer une créative
            </Link>
          </Magnetic>
        </div>
      </section>

      {/* ============================================ DISSECTION — MOBILE
          Le scroll-jacking d'un ecran epingle est penible au doigt : sur
          mobile la meme sequence est deroulee verticalement, chaque etape
          revelant son propre visuel anime au scroll. */}
      <section className="mb-dissect border-b border-ink-800 px-5 py-16 md:hidden">
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
              La vidéo est découpée en images clés, avec détection des changements de plan.
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
              Voix off et textes à l&apos;écran, reconstitués et horodatés.
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
              Chaque levier de persuasion est identifié et noté sur 10.
            </p>
          </div>

          {/* 04 — sourcing et profit */}
          <div className="mb-etape text-center">
            <span className="font-mono text-xs uppercase tracking-[0.3em] text-brand-400">04</span>
            <h3 className="mt-2 text-xl font-medium text-mist-100">Le produit, sourcé et chiffré</h3>
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
                <div className="mb-profit mt-1 text-base font-bold tabular-nums text-jade">+1 240 DA</div>
              </div>
            </div>
            <p className="mx-auto mt-4 max-w-xs text-sm font-light text-mist-300">
              Produit sourcé sur 1688, rentabilité calculée au taux de livraison algérien.
            </p>
          </div>
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/analyser"
            className="cta-aurora inline-block w-full rounded-full px-7 py-3.5 text-center text-sm font-semibold"
          >
            Disséquer une créative
          </Link>
        </div>
      </section>

      {/* ============================ BANDEAU DE RESULTATS (preuve produit) */}
      <section className="marquee-hold overflow-hidden pb-10 pt-20 sm:pt-24">
        <div className="mx-auto mb-10 max-w-3xl px-5 text-center">
          <h2 className="st-titre text-3xl font-medium tracking-[-0.02em] text-mist-100 sm:text-4xl">
            {mots("Des produits analysés, chiffrés, prêts à lancer")}
          </h2>
          <p className="st-reveal mx-auto mt-3 max-w-xl text-sm font-light text-mist-300">
            Voilà ce que tu reçois pour chaque créative. Passe la souris sur une carte pour arrêter
            le défilement.
          </p>
        </div>

        <div className="fondu-bords">
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
        </div>
      </section>

      {/* =================================================== PREUVE CHIFFREE
          Serree contre le bandeau : c'est la meme preuve, en trois chiffres. */}
      <section className="border-b border-ink-800 px-5 pb-16 pt-8">
        <div className="mx-auto grid max-w-4xl grid-cols-3 gap-4 text-center">
          {[
            { fin: 3, suffixe: " min", label: "par analyse complète" },
            { fin: 6, suffixe: "", label: "livrables par rapport" },
            { fin: 58, suffixe: "", label: "wilayas dans le calcul COD" },
          ].map((s) => (
            <div key={s.label} className="st-reveal">
              <div
                className="text-gold st-compteur text-3xl font-semibold tabular-nums sm:text-5xl"
                data-fin={s.fin}
                data-suffixe={s.suffixe}
              >
                {s.fin}
                {s.suffixe}
              </div>
              <p className="mt-2 text-xs font-light text-mist-300 sm:text-sm">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ============================================================ BENTO */}
      <section className="border-b border-ink-800 px-5 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <h2 className="st-titre text-3xl font-medium tracking-[-0.02em] text-mist-100 sm:text-4xl">
              {mots("Un rapport qui remplace une journée de travail")}
            </h2>
            <p className="st-reveal mt-3 max-w-xl text-sm font-light leading-relaxed text-mist-300 sm:text-base">
              Ce que font un media buyer, un sourceur et un copywriter, réunis dans une seule
              analyse.
            </p>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {BLOCS.map((b) => (
              <div key={b.titre} className={`st-reveal ${b.classe}`}>
                <CarteVivante className="flex h-full flex-col p-6">
                  <span className="grid h-10 w-10 place-items-center rounded-[var(--r-sm)] border border-brand-500/25 bg-brand-500/[0.08] text-brand-300">
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                      <path d={b.icone} />
                    </svg>
                  </span>
                  <h3 className="mt-4 text-base font-medium text-mist-100">{b.titre}</h3>
                  <p className="mt-2 max-w-md text-sm font-light leading-relaxed text-mist-300">{b.texte}</p>
                  {b.visuel && <div className="mt-auto">{b.visuel}</div>}
                </CarteVivante>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Tarifs />

      {/* ========================================================= DEMARRER */}
      <section id="demarrer" className="scroll-mt-16 border-b border-ink-800 bg-ink-900/30 px-5 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <h2 className="st-titre text-3xl font-medium tracking-[-0.02em] text-mist-100 sm:text-4xl">
              {mots(TITRE_DEMARRAGE)}
            </h2>
            <p className="st-reveal mt-3 max-w-xl text-sm font-light leading-relaxed text-mist-300 sm:text-base">
              {SOUS_TITRE_DEMARRAGE}
            </p>
          </div>

          <div className="etapes relative mt-14">
            {/* Rail et ligne d'or : horizontaux sur grand ecran, verticaux au doigt. */}
            <div className="absolute left-5 right-[calc(25%-38px)] top-5 hidden h-px bg-ink-700 md:block" />
            <div className="ligne-h ligne-demarrage absolute left-5 right-[calc(25%-38px)] top-5 hidden h-px bg-gradient-to-r from-brand-500 via-brand-300 to-brand-500 md:block" />
            <div className="absolute bottom-5 left-5 top-5 w-px bg-ink-700 md:hidden" />
            <div className="ligne-v ligne-demarrage absolute bottom-5 left-5 top-5 w-px bg-gradient-to-b from-brand-500 via-brand-300 to-brand-500 md:hidden" />

            <ol className="relative grid gap-10 md:grid-cols-4 md:gap-6">
              {DEMARRAGE.map((e) => (
                <li key={e.n} className="etape flex gap-5 md:block" data-actif="true">
                  <span className="etape-noeud relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-full border border-ink-600 bg-ink-900 font-mono text-xs font-medium text-mist-300">
                    {e.n}
                  </span>
                  <div className="md:mt-5">
                    <h3 className="text-base font-medium text-mist-100">{e.titre}</h3>
                    <p className="mt-1.5 max-w-[16rem] text-sm font-light leading-relaxed text-mist-300">
                      {e.texte}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="cta-demarrer st-reveal mt-14 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <Link
              href="/inscription"
              className="cta-aurora inline-block rounded-full px-7 py-3 text-sm font-semibold"
            >
              Créer mon compte
            </Link>
            {LIEN_WHATSAPP && (
              <a
                href={LIEN_WHATSAPP}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-mist-300 transition hover:text-brand-300"
              >
                <IconeWhatsApp className="h-4 w-4 text-jade" />
                Une question avant ? Écris-nous sur WhatsApp
              </a>
            )}
          </div>
        </div>
      </section>

      {/* =============================================================== FAQ */}
      <section className="border-b border-ink-800 px-5 py-20 sm:py-24">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <div>
            <h2 className="st-titre text-3xl font-medium tracking-[-0.02em] text-mist-100 sm:text-4xl">
              {mots("Questions fréquentes")}
            </h2>
            <p className="st-reveal mt-3 max-w-sm text-sm font-light leading-relaxed text-mist-300">
              Tu ne trouves pas ta réponse ?{" "}
              {LIEN_WHATSAPP ? (
                <a href={LIEN_WHATSAPP} target="_blank" rel="noopener noreferrer" className="text-brand-300 underline underline-offset-4 hover:text-brand-400">
                  Pose-la sur WhatsApp
                </a>
              ) : (
                "Pose-la lors de l'appel d'activation"
              )}
              .
            </p>
          </div>
          <div className="space-y-3">
            {FAQ.map((f) => (
              <details
                key={f.q}
                className="st-reveal group rounded-[var(--r-md)] border border-ink-700 bg-ink-900 px-5 py-4 transition hover:border-brand-500/30 open:border-brand-500/35 open:bg-ink-850"
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
      <section className="sec-final aurora-glow grain relative px-5 py-28 sm:py-36">
        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <div className="st-reveal mx-auto mb-8 w-28">
            <ProduitMontre className="anim-float h-auto w-full" />
          </div>
          <h2 className="st-titre text-3xl font-medium tracking-[-0.02em] text-mist-100 sm:text-5xl">
            {mots("La prochaine créative que tu vois passer peut devenir ton produit gagnant.")}
          </h2>
          <div className="st-reveal mt-9">
            <Magnetic>
              <Link href="/inscription" className="cta-aurora inline-block rounded-full px-8 py-3.5 text-sm font-semibold">
                Créer mon compte
              </Link>
            </Magnetic>
          </div>
          <p className="st-reveal mt-4 text-xs text-mist-400">
            À partir de {PRIX_PLANCHER.toLocaleString("fr-FR")} DA ou {PRIX_PLANCHER_INTL} $ par mois ·
            formule mensuelle sans engagement disponible
          </p>
        </div>
      </section>

      <footer className="border-t border-ink-800 px-5 py-8 text-center text-xs text-mist-500">
        <p>
          © {new Date().getFullYear()} Hooked Lab · Les prix et estimations sont des ordres de
          grandeur, à vérifier auprès des fournisseurs.
        </p>
      </footer>

      {/* ================================================ ACTION MOBILE
          Le visiteur arrive d'une publicite, sur son telephone : l'appel a
          l'action le suit pendant tout le defilement, a portee de pouce. */}
      <div
        className="barre-mobile fixed inset-x-0 bottom-0 z-50 border-t border-ink-800 bg-ink-950/90 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md md:hidden"
        data-visible={barreMobile}
        aria-hidden={!barreMobile}
      >
        <div className="flex items-center gap-2.5">
          <Link
            href="/inscription"
            tabIndex={barreMobile ? 0 : -1}
            className="cta-aurora flex-1 rounded-full px-5 py-3 text-center text-sm font-semibold"
          >
            Créer mon compte
          </Link>
          {LIEN_WHATSAPP && (
            <a
              href={LIEN_WHATSAPP}
              target="_blank"
              rel="noopener noreferrer"
              tabIndex={barreMobile ? 0 : -1}
              aria-label="Nous écrire sur WhatsApp"
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-jade/40 bg-jade/10 text-jade"
            >
              <IconeWhatsApp className="h-5 w-5" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
