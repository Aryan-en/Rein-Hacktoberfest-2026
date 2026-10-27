"use client";

import { Crosshair, Maximize2, Minus, Plus, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useInvestigation } from "@/context/investigation-context";
import { cn } from "@/lib/cn";
import { landDotsPath, MAP_H, MAP_W, project } from "@/lib/worldmap";

type Intensity = "high" | "medium" | "low";
interface Hotspot { id: string; name: { en: string; hi: string }; lon: number; lat: number; size: number; intensity: Intensity; share?: number }

// ILLUSTRATIVE hotspots only. TrustLens does not geolocate submissions or have a global feed.
const HOT: Hotspot[] = [
  { id: "us-east", name: { en: "United States (East)", hi: "अमेरिका (पूर्व)" }, lon: -75, lat: 40, size: 7, intensity: "high", share: 18 },
  { id: "us-west", name: { en: "United States (West)", hi: "अमेरिका (पश्चिम)" }, lon: -120, lat: 37, size: 5, intensity: "medium" },
  { id: "brazil", name: { en: "Brazil", hi: "ब्राज़ील" }, lon: -47, lat: -15, size: 6, intensity: "medium" },
  { id: "uk", name: { en: "United Kingdom", hi: "यूनाइटेड किंगडम" }, lon: -1, lat: 52, size: 5, intensity: "medium", share: 8 },
  { id: "nigeria", name: { en: "Nigeria", hi: "नाइजीरिया" }, lon: 8, lat: 9, size: 4, intensity: "low" },
  { id: "india", name: { en: "India", hi: "भारत" }, lon: 78, lat: 21, size: 8, intensity: "high", share: 28 },
  { id: "china", name: { en: "China", hi: "चीन" }, lon: 116, lat: 35, size: 7, intensity: "high" },
  { id: "indonesia", name: { en: "Indonesia", hi: "इंडोनेशिया" }, lon: 110, lat: -3, size: 5, intensity: "medium", share: 12 },
  { id: "australia", name: { en: "Australia", hi: "ऑस्ट्रेलिया" }, lon: 150, lat: -33, size: 4, intensity: "low" },
  { id: "russia", name: { en: "Russia", hi: "रूस" }, lon: 60, lat: 58, size: 4, intensity: "low" },
  { id: "e-europe", name: { en: "Eastern Europe", hi: "पूर्वी यूरोप" }, lon: 30, lat: 50, size: 4, intensity: "medium" },
  { id: "sea", name: { en: "South-East Asia", hi: "दक्षिण-पूर्व एशिया" }, lon: 100, lat: 14, size: 4, intensity: "low" },
];
const ARCS: Array<[string, string]> = [["india", "uk"], ["uk", "us-east"], ["us-east", "india"], ["china", "india"], ["india", "indonesia"], ["india", "sea"], ["e-europe", "india"], ["russia", "china"], ["us-east", "uk"], ["us-west", "us-east"], ["us-west", "china"], ["brazil", "us-east"], ["nigeria", "uk"], ["australia", "indonesia"]];
const COLOR: Record<Intensity, string> = { high: "#ef4444", medium: "#f59e0b", low: "#eab308" };
const TILES: Array<{ flag: string; name: string; share: number; id?: string }> = [
  { flag: "🇮🇳", name: "India", share: 28, id: "india" },
  { flag: "🇺🇸", name: "United States", share: 18, id: "us-east" },
  { flag: "🇮🇩", name: "Indonesia", share: 12, id: "indonesia" },
  { flag: "🇬🇧", name: "United Kingdom", share: 8, id: "uk" },
  { flag: "🌐", name: "Others", share: 34 },
];
const INTENSITY_LABEL = { high: { en: "High", hi: "उच्च" }, medium: { en: "Medium", hi: "मध्यम" }, low: { en: "Low", hi: "कम" } };

export function WorldMap({ label }: { label: string }) {
  const { lang } = useInvestigation();
  const dots = useMemo(() => landDotsPath(), []);
  const [zoom, setZoom] = useState(1);
  const [selected, setSelected] = useState<string | null>(null);
  const [focused, setFocused] = useState<string | null>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const byId = useMemo(() => new Map(HOT.map((h) => [h.id, h])), []);
  const sel = selected ? byId.get(selected) ?? null : null;
  const t = (en: string, hi: string) => (lang === "hi" ? hi : en);

  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setSelected(null); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [selected]);

  const toggle = (id: string) => setSelected((cur) => (cur === id ? null : id));
  const linked = sel ? [...new Set(ARCS.filter(([a, b]) => a === sel.id || b === sel.id).map(([a, b]) => (a === sel.id ? b : a)))].map((id) => byId.get(id)!) : [];
  // Keep the card away from the selected node: node on the right half -> card on the left, and vice versa.
  const cardOnLeft = sel ? project(sel.lon, sel.lat)[0] > MAP_W / 2 : true;

  return (
    <>
      <div ref={wrap} className="relative overflow-hidden rounded-xl bg-bg/40">
        <svg role="group" aria-label={label} viewBox={`0 0 ${MAP_W} ${MAP_H}`} className="w-full" style={{ transform: `scale(${zoom})`, transformOrigin: "50% 50%", transition: "transform .2s" }}>
          <path d={dots} stroke="#2dd4bf" strokeOpacity="0.28" strokeWidth="2.4" strokeLinecap="round" fill="none" />
          {ARCS.map(([a, b], i) => {
            const A = byId.get(a)!, B = byId.get(b)!;
            const [x1, y1] = project(A.lon, A.lat);
            const [x2, y2] = project(B.lon, B.lat);
            const hot = sel && (sel.id === a || sel.id === b);
            return <path key={i} d={`M${x1} ${y1} Q${(x1 + x2) / 2} ${Math.min(y1, y2) - 70} ${x2} ${y2}`} fill="none" stroke={hot ? "#ff8a8a" : "#ef4444"} strokeOpacity={hot ? 0.95 : sel ? 0.18 : 0.45} strokeWidth={hot ? 2 : 1.2} />;
          })}
          {HOT.map((h) => {
            const [x, y] = project(h.lon, h.lat);
            const c = COLOR[h.intensity];
            const isSel = selected === h.id;
            const ring = isSel || focused === h.id;
            return (
              <g
                key={h.id}
                role="button"
                tabIndex={0}
                aria-label={`${h.name[lang]}: ${t("sample hotspot", "नमूना हॉटस्पॉट")}, ${INTENSITY_LABEL[h.intensity][lang]}`}
                aria-pressed={isSel}
                onClick={() => toggle(h.id)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(h.id); } }}
                onFocus={() => setFocused(h.id)}
                onBlur={() => setFocused(null)}
                className="cursor-pointer outline-none"
                style={{ opacity: sel && !isSel && !linked.includes(h) ? 0.45 : 1, transition: "opacity .15s" }}
              >
                <circle cx={x} cy={y} r={Math.max(h.size * 3.2, 26)} fill="transparent" />
                <circle cx={x} cy={y} r={h.size * 3.2} fill={c} opacity="0.14" />
                <circle cx={x} cy={y} r={h.size * 1.6} fill={c} opacity="0.35" />
                <circle cx={x} cy={y} r={h.size * 0.55} fill={c} />
                {ring && <circle cx={x} cy={y} r={h.size * 2.3 + 4} fill="none" stroke="#f8fafc" strokeWidth="2" strokeDasharray={isSel ? undefined : "4 3"} />}
              </g>
            );
          })}
        </svg>

        <div className="no-print absolute left-3 top-3 flex flex-col overflow-hidden rounded-lg border border-line bg-bg/70">
          <button type="button" aria-label="Zoom in" onClick={() => setZoom((z) => Math.min(2.2, +(z + 0.3).toFixed(1)))} className="grid h-9 w-9 place-items-center hover:bg-surface-3"><Plus aria-hidden className="h-4 w-4" /></button>
          <button type="button" aria-label="Zoom out" onClick={() => setZoom((z) => Math.max(1, +(z - 0.3).toFixed(1)))} className="grid h-9 w-9 place-items-center border-t border-line hover:bg-surface-3"><Minus aria-hidden className="h-4 w-4" /></button>
        </div>
        <button type="button" aria-label="Reset view" onClick={() => { setZoom(1); setSelected(null); }} className="no-print absolute bottom-3 left-3 grid h-9 w-9 place-items-center rounded-lg border border-line bg-bg/70 hover:bg-surface-3"><Crosshair aria-hidden className="h-4 w-4" /></button>
        <button type="button" aria-label="Toggle full screen" onClick={() => { if (document.fullscreenElement) void document.exitFullscreen(); else void wrap.current?.requestFullscreen?.(); }} className="no-print absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-lg border border-line bg-bg/70 hover:bg-surface-3"><Maximize2 aria-hidden className="h-4 w-4" /></button>

        {sel && (
          <div role="dialog" aria-label={sel.name[lang]} className={cn("animate-fade-up pointer-events-none absolute top-3 z-10 w-[min(260px,calc(100%-7rem))] rounded-xl border border-line-strong bg-bg/85 p-3 text-sm shadow-[0_16px_48px_-16px_rgba(0,0,0,0.8)] backdrop-blur", cardOnLeft ? "left-14" : "right-14")}>
            <div className="flex items-start gap-2">
              <span aria-hidden className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: COLOR[sel.intensity] }} />
              <div className="min-w-0 flex-1">
                <div className="font-semibold">{sel.name[lang]}</div>
                <div className="text-xs text-muted">{t("Intensity", "तीव्रता")}: {INTENSITY_LABEL[sel.intensity][lang]}</div>
              </div>
              <button type="button" aria-label={t("Close", "बंद करें")} onClick={() => setSelected(null)} className="pointer-events-auto grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted hover:bg-surface-3 hover:text-text"><X aria-hidden className="h-4 w-4" /></button>
            </div>
            <dl className="mt-2 space-y-1 text-xs">
              <div className="flex justify-between gap-3"><dt className="text-muted">{t("Sample share", "नमूना हिस्सा")}</dt><dd className="tabular-nums">{sel.share !== undefined ? `${sel.share}%` : "—"}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-muted">{t("Linked to", "से जुड़ा")}</dt><dd className="text-right">{linked.length ? linked.map((l) => l.name[lang]).join(", ") : "—"}</dd></div>
            </dl>
            <p className="mt-2 rounded-md bg-medium/10 px-2 py-1.5 text-[11px] leading-snug text-medium">{t("Illustrative sample hotspot. TrustLens has no real geographic data.", "यह केवल उदाहरण (नमूना) हॉटस्पॉट है। TrustLens के पास वास्तविक भौगोलिक डेटा नहीं है।")}</p>
          </div>
        )}

        <div className="pointer-events-none absolute bottom-3 right-3 hidden rounded-lg border border-line bg-bg/80 p-3 text-xs sm:block">
          <div className="mb-1.5 font-medium">{t("Threat intensity", "खतरे की तीव्रता")}</div>
          {(["high", "medium", "low"] as const).map((k) => (
            <div key={k} className="flex items-center gap-2 py-0.5"><span aria-hidden className="h-2.5 w-2.5 rounded-full" style={{ background: COLOR[k] }} />{INTENSITY_LABEL[k][lang]}</div>
          ))}
        </div>
      </div>

      <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
        {TILES.map((x) => {
          const active = !!x.id && selected === x.id;
          const body = (
            <>
              <div className="flex items-center gap-1.5 text-xs text-muted"><span aria-hidden>{x.flag}</span><span className="truncate">{x.name}</span></div>
              <div className="mt-1 text-xl font-semibold tabular-nums">{x.share}%</div>
            </>
          );
          return (
            <li key={x.name}>
              {x.id ? (
                <button type="button" aria-pressed={active} onClick={() => toggle(x.id!)} className={cn("w-full rounded-xl border bg-surface-2/50 p-3 text-left transition-colors hover:border-accent/50", active ? "border-accent" : "border-line")}>{body}</button>
              ) : (
                <div className="rounded-xl border border-line bg-surface-2/50 p-3 opacity-80">{body}</div>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}
