// The mark and the lockup, drawn from the same geometry as public/brand/*.svg so the wordmark is
// never set in a live font. Strokes take currentColor; the tile and its bars take the tint and
// on-tint pair, so the mark is graphite with white bars in light mode and light graphite with
// ink bars in dark mode.
const WORD_PATHS = [
  'M29 29V111M29 29H86M29 72H77',
  'M120.5 59V111',
  'M155 111V59M155 80C155 67 165 58 179 58C193 58 203 67 203 80V111',
  'M237 29V111M237 29H273C289 29 297 38 297 49.5C297 61 289 70 273 70H237M237 70H279C296 70 305 79 305 90.5C305 102 296 111 279 111H237',
  'M339 59V88C339 102 349 111 363 111C377 111 387 102 387 88V59M387 59V111',
  'M473 29V111',
  'M559 29V111',
  'M593 59L616 108M639 59L605 130C601 138 594 142 585 141',
];

function Tile() {
  return (
    <>
      <rect className="fill-tint" width="64" height="64" rx="16" />
      <rect className="fill-on-tint" x="14" y="21" width="36" height="8" rx="4" />
      <rect className="fill-on-tint" x="14" y="35" width="16" height="8" rx="4" />
      <rect className="fill-on-tint" x="34" y="35" width="16" height="8" rx="4" />
    </>
  );
}

export function Mark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className} aria-hidden="true" focusable="false">
      <Tile />
    </svg>
  );
}

/** Mark at 64, a 20-unit gap, the wordmark at a 64-unit cap height. */
export function Lockup({ height = 32, className, title = 'FinBuddy' }: { height?: number; className?: string; title?: string }) {
  const width = (height / 96) * 540;
  return (
    <svg viewBox="0 0 540 96" width={width} height={height} className={className} role="img" aria-label={title} focusable="false">
      <g transform="translate(0 16)">
        <Tile />
      </g>
      <g transform="translate(84 2) scale(0.64)" fill="none" stroke="currentColor" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round">
        {WORD_PATHS.map((d) => (
          <path key={d} d={d} />
        ))}
        <circle cx="447" cy="85" r="26" />
        <circle cx="533" cy="85" r="26" />
        <rect className="fill-tint" x="111" y="20" width="19" height="19" rx="5" stroke="none" />
      </g>
    </svg>
  );
}
