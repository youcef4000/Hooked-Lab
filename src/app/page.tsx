"use client";

/* ============================================================================
   Landing scroll-driven, registre "or sur noir". Reference : Framer.

   Ce qu'on en retient : sombre dominant, un seul accent (l'or), titres
   serres et grands, sections qui respirent, et le scroll comme fil narratif.

   La scene centrale est epinglee : pendant le scroll, une creative se fait
   decortiquer — images, script, angles, sourcing, profit — c'est exactement
   le travail de l'application. Autour d'elle, le mouvement reste discret :
   une entree au scroll, un etat de survol, et quelques elements pilotes par
   le defilement (barre de lecture, ligne des etapes, marches qui defilent).

   Le site est bilingue : chaque texte existe en francais et en anglais, et
   les montants d'exemple suivent la langue (euros en francais, dollars en
   anglais).
   ========================================================================== */

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { MiniFrame, MockPhone, ProduitMontre } from "@/components/landing/Visuels";
import { Tarifs } from "@/components/landing/Tarifs";
import { MarchesInteractifs } from "@/components/landing/Marches";
import { AvantApres, PourQui } from "@/components/landing/Sections";
import { MarqueHooked } from "@/components/Logo";
import { CarteVivante } from "@/components/Reveal";
import { SelecteurLangue, useLangue, useT } from "@/components/Langue";
import { prixPlancher } from "@/lib/tarifs";
import { formatMontant } from "@/lib/marches";
import { CARTE_ACTIVE } from "@/lib/public";
import { locale } from "@/lib/langue";

/* ------------------------------------------------------------------ textes */

const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP?.replace(/\D/g, "") ?? "";

const TEXTES = {
  fr: {
    nav: { marche: "Comment ça marche", tarifs: "Tarifs", connexion: "Connexion", creer: "Créer mon compte" },
    badge: "Pour les e-commerçants · US · UK · Europe · Australie · Algérie",
    titre: "Chaque créative virale cache un produit gagnant.",
    titreOr: "Dissèque-la.",
    intro:
      "Colle une pub TikTok, Instagram ou Facebook. L'IA extrait le script, décompose la stratégie, trouve le fournisseur sur Alibaba et 1688, et calcule ta rentabilité pour ton marché — annonces prêtes à lancer.",
    ctaHero: "Analyser ma première créative",
    voir: "Voir la dissection",
    puces: ["Résultat en 3 minutes", "Vidéos et images", "6 marchés, 2 langues"],
    chips: ["Hook 8/10", "Script extrait", "Trouvé sur 1688", "+7,20 € / commande"],
    defile: "défile pour disséquer ↓",
    captions: ["Extraction des images clés", "Le script, mot pour mot", "Les angles qui font vendre", "Le produit, sourcé et chiffré"],
    scriptTitre: "Script reconstitué",
    anglesTitre: "Angles détectés",
    achat: "Achat 1688",
    rendu: "≈ 9,10 € rendu",
    vente: "Vente",
    venteDetail: "France, paiement par carte",
    profitCmd: "Profit / commande",
    finTitre1: "Tout ça, en",
    finOr: "3 minutes",
    finTitre2: ", sur n'importe quelle créative.",
    disséquer: "Disséquer une créative",
    mobileTitre: "La dissection, étape par étape",
    mobileIntro: "Ce que l'application fait de ta créative, en quatre temps.",
    mobileTextes: [
      "La vidéo est découpée en images clés, avec détection des changements de plan.",
      "Voix off et textes à l'écran, reconstitués et horodatés.",
      "Chaque levier de persuasion est identifié et noté sur 10.",
      "Produit sourcé sur 1688, rentabilité calculée pour ton marché.",
    ],
    achatCourt: "Achat",
    stats: [
      { fin: 3, suffixe: " min", label: "par analyse complète" },
      { fin: 6, suffixe: "", label: "marchés couverts" },
      { fin: 8, suffixe: "", label: "livrables par rapport" },
    ],
    bentoTitre: "Un rapport qui remplace une journée de travail",
    bentoIntro: "Ce que font un media buyer, un sourceur et un copywriter, réunis dans une seule analyse.",
    demarrerTitre: CARTE_ACTIVE ? "Prêt à analyser en deux minutes." : "Activé dans l'heure.",
    demarrerIntro: CARTE_ACTIVE
      ? "Un compte, un paiement sécurisé, et ta première analyse part aussitôt. Aucune installation."
      : "Un compte, un message sur WhatsApp, et on t'active dans l'heure. Aucune installation.",
    etapes: CARTE_ACTIVE
      ? [
          { titre: "Crée ton compte", texte: "Email, mot de passe, téléphone. Une minute." },
          { titre: "Choisis ta formule", texte: "Mensuelle sans engagement, ou annuelle 20 % moins chère." },
          { titre: "Paie en 30 secondes", texte: "Visa, Mastercard, Apple Pay ou RedotPay, sécurisé par Stripe." },
          { titre: "Analyse tout de suite", texte: "Tes crédits arrivent à la seconde. Colle ta première créative." },
        ]
      : [
          { titre: "Crée ton compte", texte: "Email, mot de passe, téléphone. Une minute." },
          { titre: "Écris-nous sur WhatsApp", texte: "On te donne les moyens de paiement disponibles." },
          { titre: "Paie", texte: "Tu envoies la preuve de paiement, on vérifie." },
          { titre: "Reçois ton code", texte: "Tu le saisis dans ton compte : tes crédits arrivent aussitôt." },
        ],
    question: "Une question avant ? Écris-nous sur WhatsApp",
    faqTitre: "Questions fréquentes",
    faqIntro: "Tu ne trouves pas ta réponse ?",
    faqWhatsapp: "Pose-la sur WhatsApp",
    faq: [
      { q: "Ça marche avec les vidéos TikTok et Instagram ?", r: "Oui. Tu colles le lien du post, ou tu déposes directement le fichier vidéo ou l'image — c'est la méthode la plus fiable, les plateformes bloquant souvent la récupération automatique. Le rapport est identique dans les deux cas." },
      { q: "Quels marchés sont couverts ?", r: "États-Unis, Royaume-Uni, France et Belgique, reste de l'Europe, Australie et Algérie. Tu choisis le marché à chaque analyse : prix et devise, paiement par carte ou à la livraison, taxes à l'import, langue des annonces et réglementation publicitaire s'adaptent." },
      { q: "Les prix fournisseurs sont-ils fiables ?", r: "Ce sont des fourchettes estimées par l'IA, avec un indice de fiabilité affiché. Les liens Alibaba et 1688 générés te donnent les prix réels des fournisseurs en un clic, et la recherche par image retrouve le produit exact." },
      { q: "Que se passe-t-il si une analyse échoue ?", r: "Tes crédits te sont rendus automatiquement. Une analyse ne se facture que si tu reçois ton rapport." },
      { q: "En quelle langue sont les rapports ?", r: "En français ou en anglais, selon la langue que tu choisis en haut de page. Les annonces, scripts et pages de vente sont écrits dans la langue de ton marché : anglais américain, britannique ou australien, français, ou darija algérienne." },
      { q: "Comment se passe le paiement ?", r: CARTE_ACTIVE ? "Par carte (Visa, Mastercard, Apple Pay, RedotPay) sur une page sécurisée par Stripe : tes crédits arrivent à la seconde. Sans engagement pour la formule mensuelle." : "Tu nous écris sur WhatsApp après ton inscription : on te donne les moyens de paiement disponibles et on active ton compte dans l'heure." },
    ],
    finalTitre: "La prochaine créative que tu vois passer peut devenir ton produit gagnant.",
    aPartir: (prix: string) => `À partir de ${prix} par mois · formule mensuelle sans engagement disponible`,
    footer: "Les prix et estimations sont des ordres de grandeur, à vérifier auprès des fournisseurs.",
    ecrire: "Nous écrire sur WhatsApp",
    messageWa: "Bonjour, j'ai une question sur Hooked Lab.",
    accueil: "Hooked Lab, accueil",
  },
  en: {
    nav: { marche: "How it works", tarifs: "Pricing", connexion: "Sign in", creer: "Create my account" },
    badge: "For e-commerce sellers · US · UK · Europe · Australia · Algeria",
    titre: "Every viral creative hides a winning product.",
    titreOr: "Reverse-engineer it.",
    intro:
      "Paste a TikTok, Instagram or Facebook ad. The AI extracts the script, breaks down the strategy, finds the supplier on Alibaba and 1688, and computes your profit for your market — with ads ready to run.",
    ctaHero: "Analyse my first creative",
    voir: "See the breakdown",
    puces: ["Results in 3 minutes", "Videos and images", "6 markets, 2 languages"],
    chips: ["Hook 8/10", "Script extracted", "Found on 1688", "+$7.70 / order"],
    defile: "scroll to break it down ↓",
    captions: ["Extracting the key frames", "The script, word for word", "The angles that sell", "The product, sourced and costed"],
    scriptTitre: "Reconstructed script",
    anglesTitre: "Angles detected",
    achat: "1688 price",
    rendu: "≈ $9.80 landed",
    vente: "Sale",
    venteDetail: "United States, card payment",
    profitCmd: "Profit / order",
    finTitre1: "All of this, in",
    finOr: "3 minutes",
    finTitre2: ", on any creative.",
    disséquer: "Break down a creative",
    mobileTitre: "The breakdown, step by step",
    mobileIntro: "What the app does with your creative, in four steps.",
    mobileTextes: [
      "The video is split into key frames, with shot changes detected.",
      "Voice-over and on-screen text, reconstructed and timestamped.",
      "Every persuasion lever is identified and scored out of 10.",
      "Product sourced on 1688, profitability computed for your market.",
    ],
    achatCourt: "Cost",
    stats: [
      { fin: 3, suffixe: " min", label: "per full analysis" },
      { fin: 6, suffixe: "", label: "markets covered" },
      { fin: 8, suffixe: "", label: "deliverables per report" },
    ],
    bentoTitre: "One report that replaces a day of work",
    bentoIntro: "What a media buyer, a sourcing agent and a copywriter do, in a single analysis.",
    demarrerTitre: CARTE_ACTIVE ? "Ready to analyse in two minutes." : "Activated within the hour.",
    demarrerIntro: CARTE_ACTIVE
      ? "An account, a secure payment, and your first analysis starts right away. Nothing to install."
      : "An account, a WhatsApp message, and we activate you within the hour. Nothing to install.",
    etapes: CARTE_ACTIVE
      ? [
          { titre: "Create your account", texte: "Email, password, phone. One minute." },
          { titre: "Pick your plan", texte: "Monthly with no commitment, or yearly and 20% cheaper." },
          { titre: "Pay in 30 seconds", texte: "Visa, Mastercard, Apple Pay or RedotPay, secured by Stripe." },
          { titre: "Analyse right away", texte: "Credits land instantly. Paste your first creative." },
        ]
      : [
          { titre: "Create your account", texte: "Email, password, phone. One minute." },
          { titre: "Message us on WhatsApp", texte: "We send you the available payment methods." },
          { titre: "Pay", texte: "Send the proof of payment, we check it." },
          { titre: "Get your code", texte: "Enter it in your account: credits land right away." },
        ],
    question: "A question first? Message us on WhatsApp",
    faqTitre: "Frequently asked questions",
    faqIntro: "Can't find your answer?",
    faqWhatsapp: "Ask it on WhatsApp",
    faq: [
      { q: "Does it work with TikTok and Instagram videos?", r: "Yes. Paste the post link, or upload the video file or image directly — the most reliable option, since platforms often block automated downloads. The report is identical either way." },
      { q: "Which markets are covered?", r: "United States, United Kingdom, France & Belgium, the rest of Europe, Australia and Algeria. You pick the market for each analysis: price and currency, card or cash-on-delivery payment, import taxes, ad language and advertising rules all adapt." },
      { q: "Are supplier prices reliable?", r: "They are AI-estimated ranges with a reliability score. The generated Alibaba and 1688 links give you real supplier prices in one click, and image search finds the exact product." },
      { q: "What if an analysis fails?", r: "Your credits are refunded automatically. You're only charged when you get your report." },
      { q: "Which language are the reports in?", r: "English or French, depending on the language you pick at the top of the page. Ads, scripts and sales pages are written in your market's language: American, British or Australian English, French, or Algerian darija." },
      { q: "How does payment work?", r: CARTE_ACTIVE ? "By card (Visa, Mastercard, Apple Pay, RedotPay) on a page secured by Stripe: credits land instantly. No commitment on the monthly plan." : "Message us on WhatsApp after signing up: we'll share the available payment methods and activate your account within the hour." },
    ],
    finalTitre: "The next creative you scroll past could be your next winning product.",
    aPartir: (prix: string) => `From ${prix} a month · monthly plan with no commitment available`,
    footer: "Prices and estimates are orders of magnitude: always confirm them with suppliers.",
    ecrire: "Message us on WhatsApp",
    messageWa: "Hello, I have a question about Hooked Lab.",
    accueil: "Hooked Lab, home",
  },
};

const SCRIPT_LIGNES = {
  fr: [
    "« Arrête de rater tes appels à la salle… »",
    "« Cette montre fait tout ce que tu veux »",
    "[démonstration — gros plan poignet]",
    "« Regarde comme c'est simple »",
    "« Livraison offerte, retours 30 jours »",
    "« Commande maintenant, stock limité »",
  ],
  en: [
    "“Stop missing calls at the gym…”",
    "“This watch does everything you need”",
    "[demo — wrist close-up]",
    "“Look how simple it is”",
    "“Free shipping, 30-day returns”",
    "“Order now, limited stock”",
  ],
};

const ANGLES_CHIPS = {
  fr: [
    { t: "Hook choc — 8/10", c: "#f2dfa0" },
    { t: "Problème / solution", c: "#d4af37" },
    { t: "Preuve en démonstration", c: "#b87333" },
    { t: "Urgence stock limité", c: "#e08c3a" },
    { t: "Confiance : retours faciles", c: "#3f7d6b" },
  ],
  en: [
    { t: "Shock hook — 8/10", c: "#f2dfa0" },
    { t: "Problem / solution", c: "#d4af37" },
    { t: "Proof by demo", c: "#b87333" },
    { t: "Limited-stock urgency", c: "#e08c3a" },
    { t: "Trust: easy returns", c: "#3f7d6b" },
  ],
};

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

const TEXTES_BENTO = {
  fr: {
    blocs: [
      { titre: "Script et séquences", texte: "Le script complet, voix off et textes à l'écran, découpé plan par plan avec le rôle de chaque séquence dans la vente." },
      { titre: "Angles marketing notés", texte: "Chaque levier de persuasion identifié et noté sur 10, puis réécrit pour les acheteurs de ton marché." },
      { titre: "Sourcing Alibaba et 1688", texte: "Le produit identifié, les requêtes en vrai chinois de fournisseur, et la fourchette de prix d'achat." },
      { titre: "Rentabilité par marché", texte: "Paiement par carte ou à la livraison, taxes à l'import, remboursements : le CPA maximum avant de perdre de l'argent." },
      { titre: "Score de potentiel", texte: "Demande, concurrence, marge, logistique et facilité de tournage : tu sais si le produit vaut le test." },
      { titre: "Pack de lancement", texte: "Script prêt à tourner, page de vente, annonces Meta et TikTok, dans la langue de ton marché." },
    ],
    barres: ["Vente", "Payées", "− produit", "− pub, frais", "Profit"],
    criteres: ["Demande", "Concurrence", "Marge", "Logistique", "Tournage"],
    sourcing: [
      { p: "1688", f: "2,10 – 2,60 $" },
      { p: "Alibaba", f: "2,40 – 3,10 $" },
      { p: "Par image", f: "produit exact" },
    ],
    pack: ["Script prêt à tourner", "Page de vente", "Variante B", "Annonces Meta", "Annonces TikTok"],
  },
  en: {
    blocs: [
      { titre: "Script and sequences", texte: "The full script, voice-over and on-screen text, split shot by shot with the role each sequence plays in the sale." },
      { titre: "Scored marketing angles", texte: "Every persuasion lever identified and scored out of 10, then rewritten for shoppers in your market." },
      { titre: "Alibaba and 1688 sourcing", texte: "The product identified, supplier queries in real Chinese, and the purchase price range." },
      { titre: "Profit per market", texte: "Card or cash-on-delivery payment, import taxes, refunds: the maximum CPA before you lose money." },
      { titre: "Potential score", texte: "Demand, competition, margin, logistics and ease of shooting: you know if the product is worth testing." },
      { titre: "Launch pack", texte: "Ready-to-shoot script, sales page, Meta and TikTok ads, in your market's language." },
    ],
    barres: ["Sale", "Paid", "− product", "− ads, fees", "Profit"],
    criteres: ["Demand", "Competition", "Margin", "Logistics", "Shooting"],
    sourcing: [
      { p: "1688", f: "$2.10 – $2.60" },
      { p: "Alibaba", f: "$2.40 – $3.10" },
      { p: "Image search", f: "exact product" },
    ],
    pack: ["Ready-to-shoot script", "Sales page", "Variant B", "Meta ads", "TikTok ads"],
  },
};

const ICONES_BENTO = [
  "M4 6h16M4 12h10M4 18h13",
  "M12 3l2.6 6.3 6.8.5-5.2 4.4 1.6 6.6L12 17.8 6.2 20.8l1.6-6.6L2.6 9.8l6.8-.5z",
  "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4.2-4.2",
  "M4 19V5m0 14h16M8 15l3.5-4 3 2.5L20 8",
  "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zm0-13v5l3 2",
  "M5 4h14v16l-7-3.5L5 20z",
];
const CLASSES_BENTO = ["sm:col-span-2", "", "", "sm:col-span-2", "lg:col-span-2", ""];

function VisuelScript() {
  const langue = useLangue();
  return (
    <div className="mt-5 space-y-2 rounded-[var(--r-md)] border border-ink-800 bg-ink-950/60 p-4">
      {SCRIPT_LIGNES[langue].slice(0, 3).map((l, i) => (
        <p key={i} className="flex gap-3 text-[13px] leading-snug text-mist-200">
          <span className="shrink-0 font-mono text-[10px] tabular-nums text-brand-400/80">0:0{i + 1}</span>
          {l}
        </p>
      ))}
    </div>
  );
}

function VisuelAngles() {
  const langue = useLangue();
  return (
    <div className="mt-5 flex flex-wrap gap-2">
      {ANGLES_CHIPS[langue].slice(0, 4).map((a) => (
        <span key={a.t} className="rounded-full px-3 py-1.5 text-xs font-medium" style={{ backgroundColor: `${a.c}1c`, color: a.c, border: `1px solid ${a.c}55` }}>
          {a.t}
        </span>
      ))}
    </div>
  );
}

function VisuelSourcing() {
  const t = useT(TEXTES_BENTO);
  return (
    <div className="mt-5 divide-y divide-ink-800 rounded-[var(--r-md)] border border-ink-800 bg-ink-950/60 text-[13px]">
      {t.sourcing.map((r) => (
        <div key={r.p} className="flex items-center justify-between px-3.5 py-2.5">
          <span className="text-mist-300">{r.p}</span>
          <span className="font-medium tabular-nums text-mist-100">{r.f}</span>
        </div>
      ))}
    </div>
  );
}

function VisuelRentabilite() {
  const t = useT(TEXTES_BENTO);
  const langue = useLangue();
  const devise = langue === "fr" ? "EUR" : "USD";
  const barres = [
    { v: 100, m: 29.99, c: "bg-brand-400" },
    { v: 95, m: 28.49, c: "bg-brand-500" },
    { v: 62, m: 18.69, c: "bg-copper" },
    { v: 30, m: 9.19, c: "bg-bronze" },
    { v: 26, m: 7.7, c: "bg-jade" },
  ];
  return (
    <div className="graph-renta mt-5 rounded-[var(--r-md)] border border-ink-800 bg-ink-950/60 p-4">
      <div className="flex h-32 items-end gap-3">
        {barres.map((b, i) => (
          <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
            <span className={`text-[11px] font-medium tabular-nums ${i === 4 ? "text-jade" : "text-mist-300"}`}>
              {i === 4 ? "+" : ""}
              {formatMontant(b.m, devise, langue)}
            </span>
            <div className={`barre-graph w-full max-w-10 rounded-t-[5px] ${b.c}`} style={{ height: `${b.v * 0.78}%` }} />
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-3">
        {t.barres.map((l) => (
          <span key={l} className="flex-1 truncate text-center text-[10px] text-mist-400">
            {l}
          </span>
        ))}
      </div>
    </div>
  );
}

function VisuelScore() {
  const t = useT(TEXTES_BENTO);
  const valeurs = [88, 64, 81, 90, 76];
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
        {t.criteres.map((l, i) => (
          <div key={l} className="flex items-center gap-2">
            <span className="w-20 shrink-0 text-[11px] text-mist-400">{l}</span>
            <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink-800">
              <span className="barre-critere block h-full origin-left rounded-full bg-brand-500" style={{ transform: `scaleX(${valeurs[i] / 100})` }} />
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function VisuelPack() {
  const t = useT(TEXTES_BENTO);
  return (
    <div className="mt-5 flex flex-wrap gap-2">
      {t.pack.map((x) => (
        <span key={x} className="rounded-full border border-ink-700 bg-ink-950/60 px-3 py-1.5 text-xs text-mist-200">
          {x}
        </span>
      ))}
    </div>
  );
}

const VISUELS_BENTO = [VisuelScript, VisuelAngles, VisuelSourcing, VisuelRentabilite, VisuelScore, VisuelPack];

/* --------------------------------------------------------------------- page */

export default function Landing() {
  const racine = useRef<HTMLDivElement>(null);
  const langue = useLangue();
  const t = useT(TEXTES);
  const tb = useT(TEXTES_BENTO);
  const [defile, setDefile] = useState(false);
  const [barreMobile, setBarreMobile] = useState(false);

  const deviseExemple = langue === "fr" ? "EUR" : "USD";
  const profitExemple = langue === "fr" ? 7.2 : 7.7;
  const lienWhatsApp = WHATSAPP ? `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(t.messageWa)}` : "";

  /* La barre du haut se fond dans le hero, puis prend un fond des qu'on
     defile ; la barre d'action mobile apparait une fois le hero depasse et
     s'efface partout ou un bouton identique est deja a l'ecran. */
  useEffect(() => {
    const surDefilement = () => setDefile(window.scrollY > 24);
    surDefilement();
    window.addEventListener("scroll", surDefilement, { passive: true });

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
        gsap.to(".progression-lecture", { scaleX: 1, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: 0.3 } });

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
          gsap.from(el, { y: 34, opacity: 0, duration: 0.8, delay: (i % 3) * 0.06, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 88%" } });
        });

        /* --- Compteurs : valeur finale dans le HTML, on repart de zero ici */
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
              el.textContent = Math.round(obj.v).toLocaleString(locale(langue)) + suffixe;
            },
          });
        });

        /* --- Mini-graphiques du bento ------------------------------------- */
        gsap.from(".barre-graph", { scaleY: 0, duration: 0.6, stagger: 0.07, ease: "power3.out", scrollTrigger: { trigger: ".graph-renta", start: "top 85%" } });
        gsap.utils.toArray<HTMLElement>(".barre-critere").forEach((el, i) => {
          gsap.from(el, { scaleX: 0, duration: 0.6, delay: i * 0.06, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 90%" } });
        });

        /* --- Titres de section : mots qui montent ------------------------- */
        gsap.utils.toArray<HTMLElement>(".st-titre").forEach((el) => {
          gsap.from(el.querySelectorAll<HTMLElement>(".st-mot"), { y: 30, opacity: 0, duration: 0.7, stagger: 0.05, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 86%" } });
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
          gsap.utils.toArray<HTMLElement>(".mb-etape").forEach((etape) => {
            gsap.from(etape, { y: 40, opacity: 0, duration: 0.8, ease: "power3.out", scrollTrigger: { trigger: etape, start: "top 85%" } });
          });
          gsap.from(".mb-frame", { scale: 0.5, opacity: 0, y: 24, duration: 0.55, stagger: 0.1, ease: "back.out(1.9)", scrollTrigger: { trigger: ".mb-frames", start: "top 88%" } });
          gsap.from(".mb-ligne", { opacity: 0, x: -18, duration: 0.4, stagger: 0.1, ease: "power2.out", scrollTrigger: { trigger: ".mb-ligne", start: "top 92%" } });
          gsap.from(".mb-chip", { scale: 0.4, opacity: 0, duration: 0.5, stagger: 0.09, ease: "back.out(2.2)", scrollTrigger: { trigger: ".mb-chip", start: "top 92%" } });
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
          // Les etats de depart sont poses : la scene peut apparaitre.
          document.querySelector(".sec-dissect")?.classList.add("dx-pret");

          const tl = gsap.timeline({
            defaults: { ease: "power2.inOut" },
            scrollTrigger: { trigger: ".sec-dissect", start: "top top", end: "+=3600", scrub: 0.6, pin: true, anticipatePin: 1 },
          });

          const dot = (i: number) => dots.forEach((d, j) => tl.to(d, { backgroundColor: j <= i ? "#d4af37" : "#3a3340", duration: 0.1 }, "<"));

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
          tl.from(".dx-profit", { scale: 0.6, opacity: 0, duration: 0.6, ease: "back.out(2)" });

          tl.to([".dx-script", ".dx-angles", ".dx-sourcing", ".dx-phone", ...frames, captions[3]], { autoAlpha: 0, y: -34, duration: 0.7, stagger: 0.02 }, "+=0.5");
          tl.to(".dx-final", { autoAlpha: 1, y: 0, duration: 0.8 });

          return () => document.querySelector(".sec-dissect")?.classList.remove("dx-pret");
        });
      }, racine);

      // La scene epinglee ajoute 3 600 px de defilement : on recalcule les
      // declencheurs situes en dessous dans l'ordre de la page.
      ScrollTrigger.sort();
      ScrollTrigger.refresh();

      detruire = () => ctx.revert();
    })();

    return () => detruire?.();
  }, [langue]);

  /** Decoupe un titre en mots animables. */
  const mots = (texte: string) =>
    texte.split(" ").map((m, i) => (
      <span key={i} className="st-mot inline-block">
        {m}&nbsp;
      </span>
    ));

  const profit = `+${formatMontant(profitExemple, deviseExemple, langue)}`;

  return (
    <div ref={racine} className="overflow-x-clip">
      {/* ========================================================== BARRE */}
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-[background-color,border-color] duration-300 ${
          defile ? "border-b border-ink-800/80 bg-ink-950/80 backdrop-blur-md" : "border-b border-transparent"
        }`}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-3.5 sm:py-4">
          <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label={t.accueil}>
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-500/15 text-brand-300 ring-1 ring-brand-500/30">
              <MarqueHooked className="h-[19px] w-[19px]" anime />
            </span>
            <span className="hidden whitespace-nowrap text-sm font-semibold tracking-tight text-mist-100 min-[400px]:inline">
              Hooked <span className="text-brand-300">Lab</span>
            </span>
          </Link>

          <nav className="flex items-center gap-1 sm:gap-2">
            <a href="#demarrer" className="hidden rounded-full px-3 py-1.5 text-sm text-mist-300 transition hover:text-mist-100 lg:inline-block">
              {t.nav.marche}
            </a>
            <Link href="/tarifs" className="hidden rounded-full px-3 py-1.5 text-sm text-mist-300 transition hover:text-mist-100 sm:inline-block">
              {t.nav.tarifs}
            </Link>
            <Link href="/connexion" className="rounded-full px-2.5 py-1.5 text-sm text-mist-300 transition hover:text-mist-100 sm:px-3">
              {t.nav.connexion}
            </Link>
            <SelecteurLangue />
            <Link
              href="/inscription"
              className="hidden rounded-full border border-brand-500/40 bg-brand-500/10 px-4 py-1.5 text-sm font-medium text-brand-300 transition hover:border-brand-500/70 hover:text-brand-200 sm:inline-block"
            >
              {t.nav.creer}
            </Link>
          </nav>
        </div>
        <div className="progression-lecture absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-brand-500 via-brand-300 to-brand-500" />
      </header>

      {/* ============================================================= HERO */}
      <section className="sec-hero aurora-glow grain relative border-b border-ink-800 px-5 pb-14 pt-28 sm:pb-20 sm:pt-32">
        <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-12">
          <div className="text-center lg:text-left">
            <span className="hero-sous inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/[0.07] px-4 py-1.5 text-xs text-brand-300">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-400" />
              {t.badge}
            </span>

            <h1 className="mx-auto mt-6 max-w-2xl text-[2.1rem] font-medium leading-[1.06] tracking-[-0.025em] text-mist-100 sm:text-5xl lg:mx-0 lg:text-[4rem]">
              {t.titre.split(" ").map((mot, i) => (
                <span key={i} className="hero-mot inline-block will-change-transform">
                  {mot}&nbsp;
                </span>
              ))}
              <span className="hero-mot text-gold inline-block will-change-transform">{t.titreOr}</span>
            </h1>

            <p className="hero-sous mx-auto mt-5 max-w-xl text-[15px] font-light leading-relaxed text-mist-300 sm:text-base lg:mx-0">
              {t.intro}
            </p>

            <div className="hero-cta mt-8 flex flex-col items-center gap-4 sm:flex-row sm:flex-wrap sm:justify-center lg:justify-start">
              <Magnetic className="w-full sm:w-auto">
                <Link href="/analyser" className="cta-aurora inline-block w-full rounded-full px-7 py-3.5 text-center text-sm font-semibold sm:w-auto sm:py-3">
                  {t.ctaHero}
                </Link>
              </Magnetic>
              <a href="#dissection" className="group inline-flex items-center gap-1.5 px-2 py-1 text-sm font-medium text-mist-300 transition hover:text-brand-300">
                {t.voir}
                <span className="transition-transform duration-200 group-hover:translate-y-0.5">↓</span>
              </a>
            </div>

            <ul className="hero-sous mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-mist-400 lg:justify-start">
              {t.puces.map((x) => (
                <li key={x} className="flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-brand-500" />
                  {x}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="relative mx-auto w-full max-w-[168px] sm:max-w-[230px] lg:max-w-[260px]">
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

              {[
                "absolute -left-24 top-8 border-brand-500/35 text-brand-300",
                "absolute -right-28 top-32 border-copper/40 text-copper",
                "absolute -left-28 bottom-40 border-brand-500/35 text-champagne",
                "absolute -right-24 bottom-14 border-jade/40 text-jade",
              ].map((classe, i) => (
                <span key={i} className={`hero-chip ${classe} hidden rounded-full border bg-ink-900/90 px-3 py-1.5 text-xs font-medium backdrop-blur lg:block`}>
                  {i === 3 ? `${profit} / ${langue === "fr" ? "commande" : "order"}` : t.chips[i]}
                </span>
              ))}
            </div>

            <div className="mt-5 flex flex-wrap justify-center gap-2 lg:hidden">
              {["border-brand-500/35 text-brand-300", "border-copper/40 text-copper", "border-brand-500/35 text-champagne", "border-jade/40 text-jade"].map((classe, i) => (
                <span key={i} className={`hero-chip rounded-full border bg-ink-900/90 px-3 py-1.5 text-[11px] font-medium ${classe}`}>
                  {i === 3 ? `${profit} / ${langue === "fr" ? "commande" : "order"}` : t.chips[i]}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="relative z-10 mt-12 hidden justify-center md:flex">
          <span className="animate-bounce text-xs text-mist-400">{t.defile}</span>
        </div>
      </section>

      {/* ============================================= SCENE DE DISSECTION */}
      <section id="dissection" className="sec-dissect relative hidden h-screen overflow-hidden border-b border-ink-800 md:block">
        {t.captions.map((c, i) => (
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
            <span className="text-xs font-medium uppercase tracking-wide text-brand-300">{t.scriptTitre}</span>
          </div>
          <div className="space-y-2">
            {SCRIPT_LIGNES[langue].map((l, i) => (
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
            <span className="text-xs font-medium uppercase tracking-wide text-brand-300">{t.anglesTitre}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {ANGLES_CHIPS[langue].map((a) => (
              <span key={a.t} className="dx-chip rounded-full px-3 py-1.5 text-xs font-medium" style={{ backgroundColor: `${a.c}1c`, color: a.c, border: `1px solid ${a.c}55` }}>
                {a.t}
              </span>
            ))}
          </div>
        </div>

        <div className="dx-sourcing border-gold absolute bottom-10 left-1/2 z-20 w-[560px] -translate-x-1/2 rounded-xl p-5 shadow-2xl shadow-black/60">
          <div className="grid grid-cols-3 items-center gap-4">
            <div>
              <div className="text-[11px] uppercase tracking-wide text-mist-400">{t.achat}</div>
              <div className="mt-1 text-xl font-semibold tabular-nums text-mist-100">{formatMontant(2.1, "USD", langue)}</div>
              <div className="text-[11px] text-mist-400">{t.rendu}</div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wide text-mist-400">{t.vente}</div>
              <div className="mt-1 text-xl font-semibold tabular-nums text-mist-100">{formatMontant(langue === "fr" ? 27.9 : 29.99, deviseExemple, langue)}</div>
              <div className="text-[11px] text-mist-400">{t.venteDetail}</div>
            </div>
            <div className="rounded-lg bg-jade/12 px-3 py-2 ring-1 ring-inset ring-jade/35">
              <div className="text-[11px] uppercase tracking-wide text-jade">{t.profitCmd}</div>
              <div className="dx-profit mt-1 text-2xl font-bold tabular-nums text-jade">{profit}</div>
            </div>
          </div>
        </div>

        <div className="dx-final absolute inset-0 z-30 flex flex-col items-center justify-center gap-6 text-center">
          <h2 className="max-w-2xl text-4xl font-medium leading-tight tracking-[-0.02em] text-mist-100">
            {t.finTitre1} <span className="text-gold">{t.finOr}</span>
            {t.finTitre2}
          </h2>
          <Magnetic>
            <Link href="/analyser" className="cta-aurora inline-block rounded-full px-8 py-3.5 text-sm font-semibold">
              {t.disséquer}
            </Link>
          </Magnetic>
        </div>
      </section>

      {/* ============================================ DISSECTION — MOBILE */}
      <section className="mb-dissect border-b border-ink-800 px-5 py-16 md:hidden">
        <h2 className="st-titre text-center text-2xl font-medium tracking-[-0.02em] text-mist-100">{mots(t.mobileTitre)}</h2>
        <p className="st-reveal mx-auto mt-3 max-w-xs text-center text-sm font-light text-mist-300">{t.mobileIntro}</p>

        <div className="mx-auto mt-10 max-w-sm space-y-14">
          <div className="mb-etape text-center">
            <span className="font-mono text-xs uppercase tracking-[0.3em] text-brand-400">01</span>
            <h3 className="mt-2 text-xl font-medium text-mist-100">{t.captions[0]}</h3>
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
            <p className="mx-auto mt-4 max-w-xs text-sm font-light text-mist-300">{t.mobileTextes[0]}</p>
          </div>

          <div className="mb-etape text-center">
            <span className="font-mono text-xs uppercase tracking-[0.3em] text-brand-400">02</span>
            <h3 className="mt-2 text-xl font-medium text-mist-100">{t.captions[1]}</h3>
            <div className="border-gold mx-auto mt-5 rounded-xl p-4 text-left">
              {SCRIPT_LIGNES[langue].map((l, i) => (
                <p key={i} className="mb-ligne flex gap-2 py-1 text-[13px] leading-snug text-mist-200">
                  <span className="shrink-0 font-mono text-[10px] tabular-nums text-mist-400">0:0{i + 1}</span>
                  {l}
                </p>
              ))}
            </div>
            <p className="mx-auto mt-4 max-w-xs text-sm font-light text-mist-300">{t.mobileTextes[1]}</p>
          </div>

          <div className="mb-etape text-center">
            <span className="font-mono text-xs uppercase tracking-[0.3em] text-brand-400">03</span>
            <h3 className="mt-2 text-xl font-medium text-mist-100">{t.captions[2]}</h3>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {ANGLES_CHIPS[langue].map((a) => (
                <span key={a.t} className="mb-chip rounded-full px-3 py-1.5 text-xs font-medium" style={{ backgroundColor: `${a.c}1c`, color: a.c, border: `1px solid ${a.c}55` }}>
                  {a.t}
                </span>
              ))}
            </div>
            <p className="mx-auto mt-4 max-w-xs text-sm font-light text-mist-300">{t.mobileTextes[2]}</p>
          </div>

          <div className="mb-etape text-center">
            <span className="font-mono text-xs uppercase tracking-[0.3em] text-brand-400">04</span>
            <h3 className="mt-2 text-xl font-medium text-mist-100">{t.captions[3]}</h3>
            <div className="border-gold mx-auto mt-5 grid grid-cols-3 gap-2 rounded-xl p-4">
              <div>
                <div className="text-[10px] uppercase tracking-wide text-mist-400">{t.achatCourt}</div>
                <div className="mt-1 text-base font-semibold tabular-nums text-mist-100">{formatMontant(2.1, "USD", langue)}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wide text-mist-400">{t.vente}</div>
                <div className="mt-1 text-base font-semibold tabular-nums text-mist-100">{formatMontant(langue === "fr" ? 27.9 : 29.99, deviseExemple, langue)}</div>
              </div>
              <div className="rounded-lg bg-jade/12 px-1.5 py-1 ring-1 ring-inset ring-jade/35">
                <div className="text-[10px] uppercase tracking-wide text-jade">Profit</div>
                <div className="mt-1 text-base font-bold tabular-nums text-jade">{profit}</div>
              </div>
            </div>
            <p className="mx-auto mt-4 max-w-xs text-sm font-light text-mist-300">{t.mobileTextes[3]}</p>
          </div>
        </div>

        <div className="mt-12 text-center">
          <Link href="/analyser" className="cta-aurora inline-block w-full rounded-full px-7 py-3.5 text-center text-sm font-semibold">
            {t.disséquer}
          </Link>
        </div>
      </section>

      {/* ============================================ MARCHES (interactif) */}
      <MarchesInteractifs />

      {/* =================================================== PREUVE CHIFFREE */}
      <section className="border-b border-ink-800 px-5 py-14">
        <div className="mx-auto grid max-w-4xl grid-cols-3 gap-4 text-center">
          {t.stats.map((s) => (
            <div key={s.label} className="st-reveal">
              <div className="text-gold st-compteur text-3xl font-semibold tabular-nums sm:text-5xl" data-fin={s.fin} data-suffixe={s.suffixe}>
                {s.fin}
                {s.suffixe}
              </div>
              <p className="mt-2 text-xs font-light text-mist-300 sm:text-sm">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================= POUR QUI */}
      <PourQui />

      {/* ============================================================ BENTO */}
      <section className="border-b border-ink-800 px-5 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <h2 className="st-titre text-3xl font-medium tracking-[-0.02em] text-mist-100 sm:text-4xl">{mots(t.bentoTitre)}</h2>
            <p className="st-reveal mt-3 max-w-xl text-sm font-light leading-relaxed text-mist-300 sm:text-base">{t.bentoIntro}</p>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tb.blocs.map((b, i) => {
              const Visuel = VISUELS_BENTO[i];
              return (
                <div key={b.titre} className={`st-reveal ${CLASSES_BENTO[i]}`}>
                  <CarteVivante className="flex h-full flex-col p-6">
                    <span className="grid h-10 w-10 place-items-center rounded-[var(--r-sm)] border border-brand-500/25 bg-brand-500/[0.08] text-brand-300">
                      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                        <path d={ICONES_BENTO[i]} />
                      </svg>
                    </span>
                    <h3 className="mt-4 text-base font-medium text-mist-100">{b.titre}</h3>
                    <p className="mt-2 max-w-md text-sm font-light leading-relaxed text-mist-300">{b.texte}</p>
                    <div className="mt-auto">
                      <Visuel />
                    </div>
                  </CarteVivante>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ====================================================== AVANT / APRES */}
      <AvantApres />

      <Tarifs />

      {/* ========================================================= DEMARRER */}
      <section id="demarrer" className="scroll-mt-16 border-b border-ink-800 bg-ink-900/30 px-5 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <h2 className="st-titre text-3xl font-medium tracking-[-0.02em] text-mist-100 sm:text-4xl">{mots(t.demarrerTitre)}</h2>
            <p className="st-reveal mt-3 max-w-xl text-sm font-light leading-relaxed text-mist-300 sm:text-base">{t.demarrerIntro}</p>
          </div>

          <div className="etapes relative mt-14">
            <div className="absolute left-5 right-[calc(25%-38px)] top-5 hidden h-px bg-ink-700 md:block" />
            <div className="ligne-h ligne-demarrage absolute left-5 right-[calc(25%-38px)] top-5 hidden h-px bg-gradient-to-r from-brand-500 via-brand-300 to-brand-500 md:block" />
            <div className="absolute bottom-5 left-5 top-5 w-px bg-ink-700 md:hidden" />
            <div className="ligne-v ligne-demarrage absolute bottom-5 left-5 top-5 w-px bg-gradient-to-b from-brand-500 via-brand-300 to-brand-500 md:hidden" />

            <ol className="relative grid gap-10 md:grid-cols-4 md:gap-6">
              {t.etapes.map((e, i) => (
                <li key={e.titre} className="etape flex gap-5 md:block" data-actif="true">
                  <span className="etape-noeud relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-full border border-ink-600 bg-ink-900 font-mono text-xs font-medium text-mist-300">
                    0{i + 1}
                  </span>
                  <div className="md:mt-5">
                    <h3 className="text-base font-medium text-mist-100">{e.titre}</h3>
                    <p className="mt-1.5 max-w-[16rem] text-sm font-light leading-relaxed text-mist-300">{e.texte}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="cta-demarrer st-reveal mt-14 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <Link href="/inscription" className="cta-aurora inline-block rounded-full px-7 py-3 text-sm font-semibold">
              {t.nav.creer}
            </Link>
            {lienWhatsApp && (
              <a href={lienWhatsApp} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-mist-300 transition hover:text-brand-300">
                <IconeWhatsApp className="h-4 w-4 text-jade" />
                {t.question}
              </a>
            )}
          </div>
        </div>
      </section>

      {/* =============================================================== FAQ */}
      <section className="border-b border-ink-800 px-5 py-20 sm:py-24">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <div>
            <h2 className="st-titre text-3xl font-medium tracking-[-0.02em] text-mist-100 sm:text-4xl">{mots(t.faqTitre)}</h2>
            {lienWhatsApp && (
              <p className="st-reveal mt-3 max-w-sm text-sm font-light leading-relaxed text-mist-300">
                {t.faqIntro}{" "}
                <a href={lienWhatsApp} target="_blank" rel="noopener noreferrer" className="text-brand-300 underline underline-offset-4 hover:text-brand-400">
                  {t.faqWhatsapp}
                </a>
                .
              </p>
            )}
          </div>
          <div className="space-y-3">
            {t.faq.map((f) => (
              <details key={f.q} className="st-reveal group rounded-[var(--r-md)] border border-ink-700 bg-ink-900 px-5 py-4 transition hover:border-brand-500/30 open:border-brand-500/35 open:bg-ink-850">
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
          <h2 className="st-titre text-3xl font-medium tracking-[-0.02em] text-mist-100 sm:text-5xl">{mots(t.finalTitre)}</h2>
          <div className="st-reveal mt-9">
            <Magnetic>
              <Link href="/inscription" className="cta-aurora inline-block rounded-full px-8 py-3.5 text-sm font-semibold">
                {t.nav.creer}
              </Link>
            </Magnetic>
          </div>
          <p className="st-reveal mt-4 text-xs text-mist-400">{t.aPartir(formatMontant(prixPlancher(), "USD", langue))}</p>
        </div>
      </section>

      <footer className="border-t border-ink-800 px-5 py-8 text-center text-xs text-mist-500">
        <p>
          © {new Date().getFullYear()} Hooked Lab · {t.footer}
        </p>
      </footer>

      {/* ================================================ ACTION MOBILE */}
      <div
        className="barre-mobile fixed inset-x-0 bottom-0 z-50 border-t border-ink-800 bg-ink-950/90 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md md:hidden"
        data-visible={barreMobile}
        aria-hidden={!barreMobile}
      >
        <div className="flex items-center gap-2.5">
          <Link href="/inscription" tabIndex={barreMobile ? 0 : -1} className="cta-aurora flex-1 rounded-full px-5 py-3 text-center text-sm font-semibold">
            {t.nav.creer}
          </Link>
          {lienWhatsApp && (
            <a
              href={lienWhatsApp}
              target="_blank"
              rel="noopener noreferrer"
              tabIndex={barreMobile ? 0 : -1}
              aria-label={t.ecrire}
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
