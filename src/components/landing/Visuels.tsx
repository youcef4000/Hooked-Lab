"use client";

/* ============================================================================
   Visuels de la landing.

   Le produit est dessine en SVG plutot que photographie : il reste net a
   toutes les tailles, pese quelques kilo-octets, et se teinte avec la palette
   du theme. C'est une montre connectee — le produit e-commerce archetypal.
   ========================================================================== */

/** Montre connectee premium, en SVG. */
export function ProduitMontre({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 220 300" className={className} role="img" aria-label="Montre connectée">
      <defs>
        <linearGradient id="pm-boitier" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f2dfa0" />
          <stop offset="26%" stopColor="#d4af37" />
          <stop offset="52%" stopColor="#8c6b3f" />
          <stop offset="74%" stopColor="#e0be55" />
          <stop offset="100%" stopColor="#6b5220" />
        </linearGradient>
        <linearGradient id="pm-bracelet" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#1a171d" />
          <stop offset="45%" stopColor="#332d38" />
          <stop offset="100%" stopColor="#15131a" />
        </linearGradient>
        <linearGradient id="pm-ecran" x1="0" y1="0" x2="0.6" y2="1">
          <stop offset="0%" stopColor="#12101a" />
          <stop offset="60%" stopColor="#0a0910" />
          <stop offset="100%" stopColor="#16121f" />
        </linearGradient>
        <linearGradient id="pm-reflet" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.34" />
          <stop offset="45%" stopColor="#ffffff" stopOpacity="0.04" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="pm-anneau" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f2dfa0" />
          <stop offset="100%" stopColor="#8c6b3f" />
        </linearGradient>
        <filter id="pm-ombre" x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dy="10" stdDeviation="12" floodColor="#000" floodOpacity="0.65" />
        </filter>
      </defs>

      {/* bracelet arriere */}
      <path d="M78 12h64l-6 56H84z" fill="url(#pm-bracelet)" />
      <path d="M84 232h52l6 56H78z" fill="url(#pm-bracelet)" />
      {/* stries du bracelet */}
      {[22, 36, 50, 246, 260, 274].map((y) => (
        <rect key={y} x="84" y={y} width="52" height="2" rx="1" fill="#000" opacity="0.4" />
      ))}

      {/* boitier */}
      <g filter="url(#pm-ombre)">
        <rect x="46" y="58" width="128" height="184" rx="40" fill="url(#pm-boitier)" />
        <rect x="52" y="64" width="116" height="172" rx="35" fill="#0c0a10" />
        {/* ecran */}
        <rect x="58" y="70" width="104" height="160" rx="30" fill="url(#pm-ecran)" />

        {/* cadran : anneau de progression */}
        <circle cx="110" cy="132" r="34" fill="none" stroke="#241f2c" strokeWidth="7" />
        <circle
          cx="110"
          cy="132"
          r="34"
          fill="none"
          stroke="url(#pm-anneau)"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray="160 214"
          transform="rotate(-90 110 132)"
        />
        <text
          x="110"
          y="139"
          textAnchor="middle"
          fill="#f2dfa0"
          fontSize="22"
          fontWeight="600"
          fontFamily="ui-sans-serif, system-ui"
        >
          87
        </text>

        {/* lignes d'interface */}
        <rect x="80" y="182" width="60" height="5" rx="2.5" fill="#3a3340" />
        <rect x="80" y="194" width="42" height="5" rx="2.5" fill="#2a2530" />
        <rect x="88" y="88" width="44" height="4" rx="2" fill="#2a2530" />

        {/* reflet vitre */}
        <path d="M58 70h104v96C126 150 88 118 58 122z" fill="url(#pm-reflet)" />
      </g>

      {/* couronne laterale */}
      <rect x="172" y="112" width="9" height="26" rx="4" fill="url(#pm-boitier)" />
      <rect x="172" y="150" width="9" height="16" rx="4" fill="url(#pm-boitier)" />
    </svg>
  );
}

/* ------------------------------------------------------------------------- */

export interface Resultat {
  produit: string;
  score: number;
  achat: string;
  vente: string;
  profit: string;
  hook: number;
  categorie: string;
}

/**
 * Carte de resultat d'analyse. C'est ce qui defile dans le bandeau : montrer
 * le livrable convertit, la ou des vignettes abstraites ne disaient rien.
 */
export function CarteResultat({ r }: { r: Resultat }) {
  const ton =
    r.score >= 75 ? "text-jade" : r.score >= 55 ? "text-brand-400" : "text-amber-glow";

  return (
    <article className="w-[290px] shrink-0 rounded-xl border border-ink-700 bg-ink-900 p-4 transition-colors duration-300 hover:border-brand-500/45">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-mist-100">{r.produit}</p>
          <p className="mt-0.5 text-[11px] uppercase tracking-wide text-mist-400">{r.categorie}</p>
        </div>
        <div className="shrink-0 text-right">
          <div className={`text-xl font-bold tabular-nums ${ton}`}>{r.score}</div>
          <div className="text-[10px] text-mist-400">/100</div>
        </div>
      </div>

      {/* jauge de score */}
      <div className="mt-3 h-1 overflow-hidden rounded-full bg-ink-800">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#8c6b3f] to-[#f2dfa0]"
          style={{ width: `${r.score}%` }}
        />
      </div>

      <dl className="mt-3 grid grid-cols-3 gap-2 border-t border-ink-800 pt-3 text-center">
        <div>
          <dt className="text-[10px] uppercase tracking-wide text-mist-400">Achat</dt>
          <dd className="mt-0.5 text-xs font-medium tabular-nums text-mist-200">{r.achat}</dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase tracking-wide text-mist-400">Vente</dt>
          <dd className="mt-0.5 text-xs font-medium tabular-nums text-mist-200">{r.vente}</dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase tracking-wide text-mist-400">Profit</dt>
          <dd className="mt-0.5 text-xs font-semibold tabular-nums text-jade">{r.profit}</dd>
        </div>
      </dl>

      <div className="mt-3 flex items-center gap-1.5">
        <span className="rounded-full bg-brand-500/12 px-2 py-0.5 text-[10px] font-medium text-brand-300 ring-1 ring-inset ring-brand-500/25">
          Hook {r.hook}/10
        </span>
        <span className="rounded-full bg-ink-800 px-2 py-0.5 text-[10px] text-mist-300">
          Sourcing 1688
        </span>
        <span className="rounded-full bg-ink-800 px-2 py-0.5 text-[10px] text-mist-300">Darija</span>
      </div>
    </article>
  );
}

/** Creative publicitaire simulee, avec le produit reel a l'interieur. */
export function MockPhone({ className = "" }: { className?: string }) {
  return (
    <div
      className={`relative aspect-[9/16] w-full overflow-hidden rounded-[26px] border border-ink-600 bg-ink-950 shadow-2xl shadow-black/70 ring-1 ring-brand-500/10 ${className}`}
    >
      <div className="mock-video absolute inset-0" />

      {/* halo conique lent derriere le produit */}
      <div className="absolute left-1/2 top-1/2 h-[130%] w-[130%] -translate-x-1/2 -translate-y-1/2 opacity-25">
        <div
          className="anim-spin-slow h-full w-full"
          style={{
            background:
              "conic-gradient(from 0deg, transparent 0deg, rgba(212,175,55,0.5) 60deg, transparent 130deg, transparent 240deg, rgba(240,217,140,0.35) 300deg, transparent 360deg)",
          }}
        />
      </div>

      {/* le produit */}
      <ProduitMontre className="absolute left-1/2 top-1/2 h-[46%] -translate-x-1/2 -translate-y-1/2" />

      {/* etincelles */}
      {[
        { l: "26%", t: "62%", d: 0 },
        { l: "70%", t: "58%", d: 1300 },
        { l: "42%", t: "68%", d: 2600 },
        { l: "60%", t: "70%", d: 3900 },
      ].map((s, i) => (
        <span
          key={i}
          className="anim-spark absolute h-1 w-1 rounded-full bg-champagne"
          style={{ left: s.l, top: s.t, "--d": `${s.d}ms` } as React.CSSProperties}
        />
      ))}

      {/* encoche */}
      <div className="absolute left-1/2 top-2.5 h-4 w-20 -translate-x-1/2 rounded-full bg-black/70" />

      {/* sous-titres façon TikTok */}
      <div
        className="mock-caption absolute inset-x-4 top-[14%] text-center"
        style={{ "--d": "0ms" } as React.CSSProperties}
      >
        <span className="inline-block rounded-lg bg-black/80 px-3 py-1.5 text-[13px] font-bold text-white ring-1 ring-white/10">
          ARRÊTE DE PERDRE TON ARGENT
        </span>
      </div>
      <div
        className="mock-caption absolute inset-x-4 top-[14%] text-center"
        style={{ "--d": "3000ms" } as React.CSSProperties}
      >
        <span className="inline-block rounded-lg bg-black/80 px-3 py-1.5 text-[13px] font-bold text-champagne ring-1 ring-brand-500/25">
          CE PRODUIT SE VEND SEUL
        </span>
      </div>
      <div
        className="mock-caption absolute inset-x-4 top-[14%] text-center"
        style={{ "--d": "6000ms" } as React.CSSProperties}
      >
        <span className="inline-block rounded-lg bg-black/80 px-3 py-1.5 text-[13px] font-bold text-white ring-1 ring-white/10">
          LIVRAISON 58 WILAYAS
        </span>
      </div>

      {/* sticker prix */}
      <div className="mock-sticker absolute right-3 top-[70%]">
        <span className="inline-block rounded-xl bg-gradient-to-br from-[#f2dfa0] to-[#c9a227] px-3 py-2 text-sm font-black text-[#120e04] shadow-lg">
          4 900 DA
        </span>
      </div>

      {/* progression */}
      <div className="absolute inset-x-3 bottom-3">
        <div className="h-1 overflow-hidden rounded-full bg-white/15">
          <div className="mock-progress h-full rounded-full bg-champagne" />
        </div>
      </div>
    </div>
  );
}

/** Vignette de frame extraite, pour l'eventail de la dissection. */
export function MiniFrame({ t, decalage = 0 }: { t: string; decalage?: number }) {
  return (
    <div className="relative h-28 w-[68px] shrink-0 overflow-hidden rounded-lg border border-ink-600 bg-ink-950 shadow-lg shadow-black/50">
      <div
        className="mock-video absolute inset-0"
        style={{ animationDelay: `${decalage}ms` }}
      />
      <ProduitMontre className="absolute left-1/2 top-1/2 h-[62%] -translate-x-1/2 -translate-y-1/2 opacity-90" />
      <span className="absolute bottom-1 left-1 rounded bg-black/80 px-1 text-[9px] tabular-nums text-champagne">
        {t}
      </span>
    </div>
  );
}
