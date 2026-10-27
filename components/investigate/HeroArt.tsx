// Decorative illustration (aria-hidden): hooded figure, floating glass cards, dotted map.
// Purely visual; it carries no data and no claims.
function dots() {
  const out: Array<{ x: number; y: number; hot: boolean }> = [];
  let seed = 7;
  const rnd = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
  for (let y = 150; y <= 292; y += 9) {
    for (let x = 400; x <= 752; x += 9) {
      const dx = (x - 590) / 190;
      const dy = (y - 225) / 85;
      if (dx * dx + dy * dy < 1 && rnd() > 0.38) out.push({ x: x + (y % 18 === 0 ? 4 : 0), y, hot: rnd() > 0.97 });
    }
  }
  return out;
}
const DOTS = dots();

export function HeroArt() {
  return (
    <svg aria-hidden viewBox="0 0 760 300" className="h-full w-full" preserveAspectRatio="xMaxYMid meet" fill="none">
      <defs>
        <radialGradient id="hg" cx="0.55" cy="0.45" r="0.55">
          <stop offset="0" stopColor="#2dd4bf" stopOpacity="0.28" />
          <stop offset="1" stopColor="#2dd4bf" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="rim" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2dd4bf" />
          <stop offset="1" stopColor="#3b82f6" />
        </linearGradient>
        <filter id="blur" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="5" /></filter>
        <filter id="blur2" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2" /></filter>
      </defs>
      <ellipse cx="450" cy="130" rx="300" ry="170" fill="url(#hg)" />
      {DOTS.map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r={d.hot ? 2.6 : 1.2} fill={d.hot ? "#ef4444" : "#2dd4bf"} opacity={d.hot ? 0.95 : 0.35} filter={d.hot ? "url(#blur2)" : undefined} />
      ))}
      {/* figure */}
      <path d="M270 300 C285 240 330 205 355 190 C330 150 335 80 385 45 C420 20 470 25 495 55 C530 90 530 150 510 190 C540 205 585 240 600 300 Z" stroke="url(#rim)" strokeWidth="5" opacity="0.55" filter="url(#blur)" />
      <path d="M270 300 C285 240 330 205 355 190 C330 150 335 80 385 45 C420 20 470 25 495 55 C530 90 530 150 510 190 C540 205 585 240 600 300 Z" fill="#050b14" stroke="url(#rim)" strokeWidth="1.6" />
      <ellipse cx="432" cy="122" rx="40" ry="50" fill="#02060c" stroke="#2dd4bf" strokeOpacity="0.25" />
      <path d="M392 118 q18 -8 36 0 M438 118 q18 -8 36 0" stroke="#2dd4bf" strokeOpacity="0.5" strokeWidth="1.5" />
      {/* laptop */}
      <g transform="rotate(-4 435 250)">
        <rect x="340" y="212" width="190" height="86" rx="5" fill="#0a1624" stroke="url(#rim)" strokeWidth="1.5" />
        <rect x="352" y="224" width="70" height="5" rx="2" fill="#2dd4bf" opacity="0.7" />
        <rect x="352" y="236" width="110" height="4" rx="2" fill="#94a3b8" opacity="0.4" />
        <rect x="352" y="246" width="90" height="4" rx="2" fill="#94a3b8" opacity="0.4" />
        <rect x="352" y="256" width="130" height="4" rx="2" fill="#94a3b8" opacity="0.3" />
      </g>
      {/* floating cards */}
      <g transform="rotate(-8 90 80)">
        <rect x="30" y="38" width="118" height="84" rx="10" fill="#0c1a2c" fillOpacity="0.85" stroke="#2dd4bf" strokeOpacity="0.6" />
        <rect x="44" y="54" width="50" height="5" rx="2" fill="#2dd4bf" opacity="0.7" />
        <rect x="44" y="68" width="82" height="4" rx="2" fill="#94a3b8" opacity="0.5" />
        <rect x="44" y="80" width="70" height="4" rx="2" fill="#94a3b8" opacity="0.4" />
        <rect x="44" y="92" width="76" height="4" rx="2" fill="#94a3b8" opacity="0.3" />
      </g>
      <g transform="rotate(6 235 70)">
        <rect x="178" y="22" width="112" height="88" rx="10" fill="#2a0d14" fillOpacity="0.9" stroke="#ef4444" strokeWidth="1.5" />
        <path d="M234 40 l16 28 h-32 z" stroke="#ef4444" strokeWidth="2" strokeLinejoin="round" />
        <path d="M234 50 v9 M234 63 v1" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
        <text x="234" y="86" textAnchor="middle" fontSize="11" fontWeight="700" fill="#ff6b6b" fontFamily="system-ui">SCAM</text>
        <text x="234" y="100" textAnchor="middle" fontSize="11" fontWeight="700" fill="#ff6b6b" fontFamily="system-ui">DETECTED</text>
      </g>
      <g transform="rotate(-10 640 90)">
        <rect x="590" y="54" width="96" height="74" rx="10" fill="#0c1a2c" fillOpacity="0.85" stroke="#2dd4bf" strokeOpacity="0.6" />
        <path d="M622 98 a10 10 0 0 1 0 -14 l8 -8 a10 10 0 0 1 14 14 M654 84 a10 10 0 0 1 0 14 l-8 8 a10 10 0 0 1 -14 -14" stroke="#2dd4bf" strokeWidth="3" strokeLinecap="round" />
      </g>
      <g transform="rotate(7 665 190)">
        <rect x="620" y="156" width="92" height="68" rx="10" fill="#0c1a2c" fillOpacity="0.85" stroke="#3b82f6" strokeOpacity="0.6" />
        <rect x="634" y="170" width="40" height="5" rx="2" fill="#3b82f6" opacity="0.8" />
        <rect x="634" y="182" width="64" height="4" rx="2" fill="#94a3b8" opacity="0.4" />
        <rect x="634" y="193" width="54" height="4" rx="2" fill="#94a3b8" opacity="0.3" />
      </g>
    </svg>
  );
}
