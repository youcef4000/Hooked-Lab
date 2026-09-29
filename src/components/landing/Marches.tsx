"use client";

import { useEffect, useRef, useState } from "react";
import { useLangue, useT } from "../Langue";
import { MockPhone } from "./Visuels";
import { formatMontant, type DeviseMarche, type MarcheId } from "@/lib/marches";

/* ============================================================================
   « Choisis ton marche » — la section qui remplace le bandeau de produits.

   Le meme produit (une montre connectee), analyse pour six marches : le prix,
   le cout rendu, la pub, le profit, le mode de paiement et l'accroche
   changent sous les yeux du visiteur. C'est la promesse du produit rendue
   tangible : une creative, un dossier de lancement par marche.

   Les chiffres sont un exemple realiste, pas une promesse : ils sont
   presentes comme tels. Sans interaction, les marches defilent seuls tant
   que la section est visible ; au premier clic, le visiteur prend la main.
   ========================================================================== */

interface Exemple {
  id: MarcheId;
  drapeau: string;
  devise: DeviseMarche;
  prix: number;
  cout: number;
  pub: number;
  profit: number;
  cod: boolean;
  taux: number;
  accroche: string;
  rtl?: boolean;
  regions: Record<"fr" | "en", string>;
}

const EXEMPLES: Exemple[] = [
  { id: "us", drapeau: "🇺🇸", devise: "USD", prix: 29.99, cout: 9.8, pub: 11, profit: 7.7, cod: false, taux: 95, accroche: "I stopped missing calls at the gym — for $29.", regions: { fr: "Californie · Texas · Floride", en: "California · Texas · Florida" } },
  { id: "uk", drapeau: "🇬🇧", devise: "GBP", prix: 24.99, cout: 8.4, pub: 9, profit: 6.1, cod: false, taux: 94, accroche: "Smartwatch features, a quarter of the price. Seriously.", regions: { fr: "Londres · Manchester · Birmingham", en: "London · Manchester · Birmingham" } },
  { id: "fr", drapeau: "🇫🇷", devise: "EUR", prix: 27.9, cout: 9.1, pub: 9.5, profit: 7.2, cod: false, taux: 93, accroche: "J'ai arrêté de rater mes appels à la salle — pour 27 €.", regions: { fr: "Île-de-France · Lyon · Bruxelles", en: "Paris region · Lyon · Brussels" } },
  { id: "eu", drapeau: "🇪🇺", devise: "EUR", prix: 26.9, cout: 9.3, pub: 9, profit: 6.9, cod: false, taux: 92, accroche: "Tracks your runs, your sleep and your calls. €26.", regions: { fr: "Allemagne · Pays-Bas · Espagne", en: "Germany · Netherlands · Spain" } },
  { id: "au", drapeau: "🇦🇺", devise: "AUD", prix: 44.95, cout: 15.2, pub: 16, profit: 10.4, cod: false, taux: 94, accroche: "Does everything the $400 one does. Honestly.", regions: { fr: "Sydney · Melbourne · Brisbane", en: "Sydney · Melbourne · Brisbane" } },
  { id: "dz", drapeau: "🇩🇿", devise: "DZD", prix: 4900, cout: 1850, pub: 1100, profit: 1240, cod: true, taux: 65, accroche: "ساعة ذكية بـ 4900 دج — الدفع عند الاستلام", rtl: true, regions: { fr: "Alger · Oran · Sétif", en: "Algiers · Oran · Sétif" } },
];

const TEXTES = {
  fr: {
    surtitre: "Un produit, six marchés",
    titre: "Choisis ton marché. Le dossier s'adapte.",
    sousTitre:
      "La même créative ne se lance pas de la même façon à Chicago, Paris ou Alger. Prix, devise, paiement, taxes, langue des annonces : chaque analyse est faite pour le marché que tu vises.",
    noms: { us: "États-Unis", uk: "Royaume-Uni", fr: "France", eu: "Europe", au: "Australie", dz: "Algérie" } as Record<MarcheId, string>,
    produit: "Montre connectée sport",
    prix: "Prix de vente",
    cout: "Coût rendu",
    pub: "Pub par commande",
    profit: "Profit par commande",
    paiement: "Paiement",
    badgePrepaye: "Paiement d'avance",
    prepaye: (t: number) => `Carte, avant expédition · ${t} % non remboursées`,
    cod: (t: number) => `À la livraison (COD) · ${t} % livrées`,
    accroche: "Accroche générée",
    regions: "Où cibler",
    note: "Exemple illustratif, calculé comme dans un vrai rapport. Tous les paramètres sont ajustables.",
  },
  en: {
    surtitre: "One product, six markets",
    titre: "Pick your market. The playbook adapts.",
    sousTitre:
      "The same creative doesn't launch the same way in Chicago, Paris or Algiers. Price, currency, payment, taxes, ad language: every analysis is built for the market you target.",
    noms: { us: "United States", uk: "United Kingdom", fr: "France", eu: "Europe", au: "Australia", dz: "Algeria" } as Record<MarcheId, string>,
    produit: "Sport smartwatch",
    prix: "Selling price",
    cout: "Landed cost",
    pub: "Ad cost per order",
    profit: "Profit per order",
    paiement: "Payment",
    badgePrepaye: "Prepaid",
    prepaye: (t: number) => `Card, before shipping · ${t}% not refunded`,
    cod: (t: number) => `Cash on delivery (COD) · ${t}% delivered`,
    accroche: "Generated hook",
    regions: "Where to target",
    note: "Illustrative example, computed like a real report. Every parameter is adjustable.",
  },
};

/** Fait glisser un nombre vers sa nouvelle valeur (transform-free : texte seul). */
function useCompteur(cible: number, duree = 650): number {
  const [valeur, setValeur] = useState(cible);
  const depart = useRef(cible);
  useEffect(() => {
    const reduit = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduit) {
      setValeur(cible);
      depart.current = cible;
      return;
    }
    const de = depart.current;
    const t0 = performance.now();
    let frame = 0;
    const pas = (t: number) => {
      const p = Math.min(1, (t - t0) / duree);
      const e = 1 - Math.pow(1 - p, 3);
      setValeur(de + (cible - de) * e);
      if (p < 1) frame = requestAnimationFrame(pas);
      else depart.current = cible;
    };
    frame = requestAnimationFrame(pas);
    return () => {
      cancelAnimationFrame(frame);
      depart.current = cible;
    };
  }, [cible, duree]);
  return valeur;
}

function Chiffre({ label, valeur, devise, ton = "neutre" }: { label: string; valeur: number; devise: DeviseMarche; ton?: "neutre" | "vert" }) {
  const langue = useLangue();
  const anime = useCompteur(valeur);
  const arrondi = devise === "DZD" ? Math.round(anime) : Math.round(anime * 100) / 100;
  return (
    <div className="rounded-[var(--r-md)] border border-ink-800 bg-ink-950/60 px-4 py-3">
      <p className="text-[11px] uppercase tracking-wide text-mist-500">{label}</p>
      <p className={`mt-1 text-xl font-semibold tabular-nums sm:text-2xl ${ton === "vert" ? "text-jade" : "text-mist-100"}`}>
        {ton === "vert" ? "+" : ""}
        {formatMontant(arrondi, devise, langue)}
      </p>
    </div>
  );
}

export function MarchesInteractifs() {
  const t = useT(TEXTES);
  const langue = useLangue();
  const [index, setIndex] = useState(0);
  const [pris, setPris] = useState(false);
  const [visible, setVisible] = useState(false);
  const racine = useRef<HTMLElement>(null);
  const liste = useRef<HTMLDivElement>(null);
  const e = EXEMPLES[index];

  // Sur telephone, la liste des marches deborde : l'onglet actif est ramene
  // dans le champ, horizontalement seulement (la page ne doit pas sauter).
  useEffect(() => {
    const l = liste.current;
    const b = l?.children[index] as HTMLElement | undefined;
    if (!l || !b || l.scrollWidth <= l.clientWidth) return;
    l.scrollTo({ left: b.offsetLeft - (l.clientWidth - b.offsetWidth) / 2, behavior: "smooth" });
  }, [index]);

  // Defilement automatique tant que la section est a l'ecran et que le
  // visiteur n'a pas choisi lui-meme.
  useEffect(() => {
    const el = racine.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entree]) => setVisible(entree.isIntersecting), { threshold: 0.35 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  useEffect(() => {
    if (!visible || pris || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % EXEMPLES.length), 3800);
    return () => clearInterval(id);
  }, [visible, pris]);

  return (
    <section ref={racine} className="border-b border-ink-800 px-5 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <p className="st-reveal text-xs font-medium uppercase tracking-[0.2em] text-brand-400">{t.surtitre}</p>
          <h2 className="st-titre mt-3 text-3xl font-medium tracking-[-0.02em] text-mist-100 sm:text-4xl">
            {t.titre.split(" ").map((m, i) => (
              <span key={i} className="st-mot inline-block">
                {m}&nbsp;
              </span>
            ))}
          </h2>
          <p className="st-reveal mt-3 text-sm font-light leading-relaxed text-mist-300 sm:text-base">{t.sousTitre}</p>
        </div>

        {/* Selecteur de marche ------------------------------------------------ */}
        <div ref={liste} role="tablist" className="st-reveal barre-masquee relative mt-9 flex gap-2 overflow-x-auto pb-1">
          {EXEMPLES.map((x, i) => (
            <button
              key={x.id}
              role="tab"
              aria-selected={i === index}
              onClick={() => {
                setIndex(i);
                setPris(true);
              }}
              className={`relative flex shrink-0 items-center gap-2 overflow-hidden rounded-full border px-4 py-2 text-sm font-medium transition ${
                i === index
                  ? "border-brand-500 bg-brand-500/12 text-mist-100"
                  : "border-ink-700 text-mist-300 hover:border-ink-600 hover:text-mist-100"
              }`}
            >
              <span className="text-base leading-none">{x.drapeau}</span>
              {t.noms[x.id]}
              {/* Barre de progression du defilement automatique */}
              {i === index && visible && !pris && (
                <span key={index} className="barre-marche absolute inset-x-0 bottom-0 h-0.5 origin-left bg-brand-400" />
              )}
            </button>
          ))}
        </div>

        {/* Le dossier ----------------------------------------------------- */}
        <div className="st-reveal mt-6 grid gap-5 rounded-[var(--r-xl)] border border-ink-700 bg-ink-900 p-5 sm:p-7 lg:grid-cols-[220px_1fr]">
          <div className="mx-auto w-full max-w-[132px] sm:max-w-[200px]">
            <MockPhone prix={formatMontant(e.prix, e.devise, langue)} />
            <p className="mt-3 text-center text-xs text-mist-400">{t.produit}</p>
          </div>

          <div key={e.id} className="anim-fade-up min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-2xl leading-none">{e.drapeau}</span>
              <h3 className="text-lg font-medium text-mist-100">{t.noms[e.id]}</h3>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${
                  e.cod ? "bg-amber-glow/12 text-amber-glow ring-amber-glow/30" : "bg-jade/12 text-jade ring-jade/30"
                }`}
              >
                {e.cod ? "COD" : t.badgePrepaye}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Chiffre label={t.prix} valeur={e.prix} devise={e.devise} />
              <Chiffre label={t.cout} valeur={e.cout} devise={e.devise} />
              <Chiffre label={t.pub} valeur={e.pub} devise={e.devise} />
              <Chiffre label={t.profit} valeur={e.profit} devise={e.devise} ton="vert" />
            </div>

            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div className="rounded-[var(--r-md)] border border-ink-800 px-4 py-3">
                <dt className="text-[11px] uppercase tracking-wide text-mist-500">{t.paiement}</dt>
                <dd className="mt-1 text-mist-200">{e.cod ? t.cod(e.taux) : t.prepaye(e.taux)}</dd>
              </div>
              <div className="rounded-[var(--r-md)] border border-ink-800 px-4 py-3">
                <dt className="text-[11px] uppercase tracking-wide text-mist-500">{t.regions}</dt>
                <dd className="mt-1 text-mist-200">{e.regions[langue]}</dd>
              </div>
            </dl>

            <div className="mt-3 rounded-[var(--r-md)] border border-brand-500/25 bg-brand-500/[0.06] px-4 py-3">
              <p className="text-[11px] uppercase tracking-wide text-brand-400">{t.accroche}</p>
              <p dir={e.rtl ? "rtl" : "ltr"} className="mt-1 text-base font-medium text-mist-100">
                {langue === "fr" ? `« ${e.accroche} »` : `“${e.accroche}”`}
              </p>
            </div>

            <p className="mt-3 text-[11px] text-mist-500">{t.note}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
