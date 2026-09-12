/* ============================================================================
   Marque Hooked Lab.

   Quatre barres de hauteurs inegales : une timeline de montage. Les deux
   extremes montent haut, les deux du milieu restent basses — le H apparait
   sans jamais etre dessine. C'est la lecture d'une creative decoupee en
   sequences, ce que fait l'application, reduit a quatre rectangles.

   Le trace est identique a toutes les tailles : aucune version simplifiee a
   maintenir, et rien qui se casse a 16 pixels dans un onglet.
   ========================================================================== */

/** Geometrie partagee : x, y, hauteur. Largeur constante de 5.5. */
const BARRES = [
  { x: 8, y: 8, h: 32 },
  { x: 16.5, y: 19, h: 10 },
  { x: 25, y: 19, h: 10 },
  { x: 33.5, y: 8, h: 32 },
] as const;

export function MarqueHooked({
  className = "h-4 w-4",
  degrade = false,
  anime = false,
  id = "or",
}: {
  className?: string;
  /** Degrade or vertical, pour les grandes tailles. En petit, l'aplat est plus net. */
  degrade?: boolean;
  /** Les barres centrales respirent, comme un niveau audio. Reserve a la vitrine. */
  anime?: boolean;
  /** Identifiant du degrade : deux logos sur une meme page se voleraient le leur. */
  id?: string;
}) {
  const remplissage = degrade ? `url(#hooked-${id})` : "currentColor";

  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      {degrade && (
        <defs>
          <linearGradient id={`hooked-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f2dfa0" />
            <stop offset="100%" stopColor="#a8801d" />
          </linearGradient>
        </defs>
      )}
      <g fill={remplissage}>
        {BARRES.map((b, i) => (
          <rect
            key={i}
            x={b.x}
            y={b.y}
            width="5.5"
            height={b.h}
            rx="2.75"
            className={anime && (i === 1 || i === 2) ? "marque-barre" : undefined}
            style={anime && (i === 1 || i === 2) ? { animationDelay: `${i * 240}ms` } : undefined}
          />
        ))}
      </g>
    </svg>
  );
}

/** Logo complet : pastille et nom. Utilise dans les deux barres de navigation. */
export function Logo({
  compact = false,
  className = "",
}: {
  /** Masque le nom sous 640 px : sur un telephone, la pastille suffit. */
  compact?: boolean;
  className?: string;
}) {
  return (
    <span className={`flex shrink-0 items-center gap-2.5 ${className}`}>
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-500/15 text-brand-300 ring-1 ring-brand-500/30">
        <MarqueHooked className="h-[19px] w-[19px]" />
      </span>
      <span
        className={`whitespace-nowrap text-sm font-semibold tracking-tight text-mist-100 ${
          compact ? "hidden sm:inline" : ""
        }`}
      >
        Hooked <span className="text-brand-300">Lab</span>
      </span>
    </span>
  );
}
