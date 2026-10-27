import { useId } from "react";
import type { DonutSeg, LineSeries } from "@/lib/dashboard";

export function Sparkline({ values, color }: { values: number[]; color: string }) {
  const id = useId();
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const span = Math.max(max - min, 1);
  const pts = values.map((v, i) => [(i / Math.max(values.length - 1, 1)) * 100, 28 - ((v - min) / span) * 24] as const);
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join("");
  return (
    <svg aria-hidden viewBox="0 0 100 30" preserveAspectRatio="none" className="h-9 w-full">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.35" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${line}L100 30L0 30Z`} fill={`url(#${id})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export function Donut({ segments, total, label }: { segments: DonutSeg[]; total: number; label: string }) {
  const R = 38;
  const C = 2 * Math.PI * R;
  const sum = segments.reduce((a, s) => a + s.value, 0) || 1;
  const starts = segments.map((_, i) => segments.slice(0, i).reduce((acc, x) => acc + (x.value / sum) * C, 0));
  return (
    <div role="img" aria-label={`${label}: ${segments.map((s) => `${s.label} ${s.value}`).join(", ") || "none"}`} className="relative h-[150px] w-[150px] shrink-0">
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle cx="50" cy="50" r={R} fill="none" stroke="#16243a" strokeWidth="14" />
        {segments.map((s, i) => {
          const len = (s.value / sum) * C;
          return <circle key={i} cx="50" cy="50" r={R} fill="none" stroke={s.color} strokeWidth="14" strokeDasharray={`${Math.max(len - 1.5, 0.5)} ${C}`} strokeDashoffset={-starts[i]!} />;
        })}
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className="text-lg font-bold leading-none tabular-nums">{total.toLocaleString("en-IN")}</div>
          <div className="mt-1 text-[10px] text-muted">{label}</div>
        </div>
      </div>
    </div>
  );
}

export function LineChart({ series, xLabels, yMax }: { series: LineSeries[]; xLabels: string[]; yMax: number }) {
  const W = 420, H = 150, PL = 30, PB = 20, PT = 8;
  const n = Math.max(xLabels.length, 2);
  const x = (i: number) => PL + (i / (n - 1)) * (W - PL - 6);
  const y = (v: number) => PT + (1 - v / yMax) * (H - PB - PT);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => Math.round(t * yMax));
  return (
    <svg role="img" aria-label="Activity chart" viewBox={`0 0 ${W} ${H}`} className="h-[150px] w-full">
      {ticks.map((t) => (
        <g key={t}>
          <line x1={PL} x2={W - 6} y1={y(t)} y2={y(t)} stroke="#22324d" strokeDasharray="2 3" />
          <text x={PL - 6} y={y(t) + 3} textAnchor="end" fontSize="8" fill="#7b8aa3">{t}</text>
        </g>
      ))}
      {xLabels.map((l, i) => (i % Math.ceil(n / 7) === 0 ? <text key={i} x={x(i)} y={H - 6} textAnchor="middle" fontSize="8" fill="#7b8aa3">{l}</text> : null))}
      {series.map((s) => {
        const pts = s.values.length === 1 ? [s.values[0]!, s.values[0]!] : s.values;
        return <polyline key={s.label} points={pts.map((v, i) => `${x(i)},${y(v)}`).join(" ")} fill="none" stroke={s.color} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />;
      })}
    </svg>
  );
}

export function Gauge({ value, flagged, label }: { value: number; flagged: number; label: string }) {
  const R = 46;
  const arc = Math.PI * R;
  const ratio = value > 0 ? flagged / value : 0;
  return (
    <div role="img" aria-label={`${value} ${label}, ${flagged} flagged`} className="relative mx-auto h-[86px] w-[150px]">
      <svg viewBox="0 0 120 66" className="h-full w-full">
        <defs><linearGradient id="gg" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#2dd4bf" /><stop offset="1" stopColor="#22c55e" /></linearGradient></defs>
        <path d="M14 60 A46 46 0 0 1 106 60" fill="none" stroke="#16243a" strokeWidth="9" strokeLinecap="round" />
        <path d="M14 60 A46 46 0 0 1 106 60" fill="none" stroke="url(#gg)" strokeWidth="9" strokeLinecap="round" strokeDasharray={`${Math.max(ratio * arc, value > 0 ? 3 : 0)} ${arc}`} />
      </svg>
      <div className="absolute inset-x-0 bottom-0 text-center text-3xl font-bold leading-none text-accent tabular-nums">{value}</div>
    </div>
  );
}
