"use client";

import { Crosshair, Maximize2, Minus, Plus } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { landDotsPath, MAP_H, MAP_W, project } from "@/lib/worldmap";

// ILLUSTRATIVE hotspots only. TrustLens does not geolocate submissions or have a global feed.
const HOT: Array<[number, number, number]> = [
  [-75, 40, 7], [-120, 37, 5], [-47, -15, 6], [-1, 52, 5], [8, 9, 4], [78, 21, 8], [116, 35, 7], [110, -3, 5], [150, -33, 4], [60, 58, 4], [30, 50, 4], [100, 14, 4],
];
const ARCS: Array<[number, number]> = [[5, 6], [6, 0], [3, 5], [7, 6], [0, 3], [5, 8], [9, 6]];

export function WorldMap({ compact = false, label }: { compact?: boolean; label: string }) {
  const dots = useMemo(() => landDotsPath(), []);
  const [zoom, setZoom] = useState(1);
  const wrap = useRef<HTMLDivElement>(null);
  const pts = HOT.map(([lon, lat, r]) => ({ p: project(lon, lat), r }));
  return (
    <div ref={wrap} className="relative overflow-hidden rounded-xl bg-bg/40">
      <svg role="img" aria-label={label} viewBox={`0 0 ${MAP_W} ${MAP_H}`} className="w-full" style={{ transform: `scale(${zoom})`, transformOrigin: "50% 50%", transition: "transform .2s" }}>
        <path d={dots} stroke="#2dd4bf" strokeOpacity="0.28" strokeWidth="2.4" strokeLinecap="round" fill="none" />
        {ARCS.map(([a, b], i) => {
          const [x1, y1] = pts[a]!.p;
          const [x2, y2] = pts[b]!.p;
          return <path key={i} d={`M${x1} ${y1} Q${(x1 + x2) / 2} ${Math.min(y1, y2) - 70} ${x2} ${y2}`} fill="none" stroke="#ef4444" strokeOpacity="0.45" strokeWidth="1.2" />;
        })}
        {pts.map(({ p: [x, y], r }, i) => (
          <g key={i}>
            <circle cx={x} cy={y} r={r * 3.2} fill="#ef4444" opacity="0.14" />
            <circle cx={x} cy={y} r={r * 1.6} fill="#ef4444" opacity="0.35" />
            <circle cx={x} cy={y} r={r * 0.55} fill="#ff6b6b" />
          </g>
        ))}
      </svg>
      {!compact && (
        <>
          <div className="no-print absolute left-3 top-3 flex flex-col overflow-hidden rounded-lg border border-line bg-bg/70">
            <button type="button" aria-label="Zoom in" onClick={() => setZoom((z) => Math.min(2.2, +(z + 0.3).toFixed(1)))} className="grid h-9 w-9 place-items-center hover:bg-surface-3"><Plus aria-hidden className="h-4 w-4" /></button>
            <button type="button" aria-label="Zoom out" onClick={() => setZoom((z) => Math.max(1, +(z - 0.3).toFixed(1)))} className="grid h-9 w-9 place-items-center border-t border-line hover:bg-surface-3"><Minus aria-hidden className="h-4 w-4" /></button>
          </div>
          <button type="button" aria-label="Reset view" onClick={() => setZoom(1)} className="no-print absolute bottom-3 left-3 grid h-9 w-9 place-items-center rounded-lg border border-line bg-bg/70 hover:bg-surface-3"><Crosshair aria-hidden className="h-4 w-4" /></button>
          <button type="button" aria-label="Toggle full screen" onClick={() => { if (document.fullscreenElement) void document.exitFullscreen(); else void wrap.current?.requestFullscreen?.(); }} className="no-print absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-lg border border-line bg-bg/70 hover:bg-surface-3"><Maximize2 aria-hidden className="h-4 w-4" /></button>
          <div className="absolute bottom-3 right-3 hidden rounded-lg border border-line bg-bg/80 p-3 text-xs sm:block">
            <div className="mb-1.5 font-medium">Threat intensity</div>
            {[["High", "#ef4444"], ["Medium", "#f59e0b"], ["Low", "#eab308"]].map(([l, c]) => (
              <div key={l} className="flex items-center gap-2 py-0.5"><span aria-hidden className="h-2.5 w-2.5 rounded-full" style={{ background: c }} />{l}</div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
