"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Bell, CreditCard, Globe2, Lightbulb, Link2, Mail, Phone, ShieldAlert, ShieldCheck, TrendingUp, UserRound, type LucideIcon } from "lucide-react";
import { useMemo } from "react";
import { useInvestigation } from "@/context/investigation-context";
import { cn } from "@/lib/cn";
import { SAMPLE, sessionData, type AlertIcon, type DashboardData } from "@/lib/dashboard";
import { RISK_LABEL } from "@/lib/labels";
import { pick } from "@/lib/i18n";
import { relTime } from "@/lib/time";
import { Donut, LineChart, Sparkline } from "./charts";
import { WorldMap } from "./WorldMap";

const KPI_ICON: Record<string, { icon: LucideIcon; ring: string }> = {
  threats: { icon: Globe2, ring: "border-high/40 bg-high/15 text-high" },
  urls: { icon: Link2, ring: "border-low/40 bg-low/15 text-low" },
  scams: { icon: Mail, ring: "border-blue/40 bg-blue/15 text-blue" },
  imp: { icon: UserRound, ring: "border-[#a855f7]/40 bg-[#a855f7]/15 text-[#a855f7]" },
};
const ALERT_ICON: Record<AlertIcon, LucideIcon> = { alert: ShieldAlert, mail: Mail, phone: Phone, user: UserRound, card: CreditCard };
const SEV_CHIP = { high: "border-high/50 bg-high/15 text-high", medium: "border-medium/50 bg-medium/15 text-medium", low: "border-low/50 bg-low/15 text-low" } as const;
const ALERT_TONE = { high: "border-high/30 bg-high/5", medium: "border-medium/30 bg-medium/5", low: "border-low/30 bg-low/5" } as const;
const ALERT_ICON_TONE = { high: "bg-high/15 text-high", medium: "bg-medium/15 text-medium", low: "bg-low/15 text-low" } as const;

const SAMPLE_BADGE = <span className="rounded border border-medium/40 bg-medium/15 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-medium">SAMPLE</span>;
const SESSION_BADGE = <span className="rounded border border-accent/40 bg-accent/15 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-accent">SESSION</span>;

function Panel({ id, title, sub, badge, action, children, className }: { id?: string; title: string; sub?: string; badge?: React.ReactNode; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section id={id} aria-label={title} className={cn("card min-w-0 scroll-mt-24 p-4 sm:p-5", className)}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="flex flex-wrap items-center gap-2 text-base font-semibold sm:text-lg">{title}{badge}</h2>
          {sub && <p className="mt-0.5 text-xs text-muted">{sub}</p>}
        </div>
        {action}
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="rounded-lg border border-dashed border-line p-4 text-sm text-muted">{text}</p>;
}

export function Dashboard() {
  const { history, lang, open } = useInvestigation();
  const router = useRouter();
  const t = (en: string, hi: string) => (lang === "hi" ? hi : en);
  const data: DashboardData = useMemo(
    () => (history.length === 0 ? SAMPLE : sessionData(history.map((h) => h.report), history.map((h) => h.at), lang)),
    [history, lang],
  );
  const session = data.mode === "session";
  const badge = session ? SESSION_BADGE : SAMPLE_BADGE;
  const openReport = (id?: string) => { if (id) { open(id); router.push("/"); } };

  return (
    <div className="space-y-4 pt-14 lg:pt-12">
      <div role="note" className={cn("flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border px-4 py-2.5 text-sm", session ? "border-accent/30 bg-accent/5" : "border-medium/40 bg-medium/10")}>
        {badge}
        <span className="text-[#cbd5e1]">
          {session
            ? t(`Showing real data from the ${history.length} investigation${history.length === 1 ? "" : "s"} in this session. The map and country shares are illustrative samples because TrustLens has no live global feed.`, `इस सत्र की ${history.length} जाँचों का वास्तविक डेटा। मानचित्र और देशों का हिस्सा नमूना है क्योंकि TrustLens के पास कोई लाइव वैश्विक फ़ीड नहीं है।`)
            : t("Illustrative sample data. TrustLens has no live global threat feed. Run an investigation and these panels switch to your real session data.", "ये उदाहरण (नमूना) आँकड़े हैं। TrustLens के पास कोई लाइव वैश्विक फ़ीड नहीं है। जाँच चलाएँ तो पैनल आपके वास्तविक सत्र डेटा पर बदल जाएँगे।")}
        </span>
        {!session && <Link href="/" className="ml-auto inline-flex items-center gap-1 text-accent hover:underline">{t("Start an investigation", "जाँच शुरू करें")} <ArrowRight aria-hidden className="h-4 w-4" /></Link>}
      </div>

      {/* KPI row */}
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {data.kpis.map((k) => {
          const I = KPI_ICON[k.key]!;
          return (
            <li key={k.key} className="card relative overflow-hidden p-4" style={{ boxShadow: `inset 0 -40px 60px -50px ${k.color}55` }}>
              <div className="flex items-center gap-3">
                <span className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-xl border", I.ring)}><I.icon aria-hidden className="h-5 w-5" /></span>
                <div className="min-w-0">
                  <div className="text-[11px] font-medium uppercase tracking-wider text-muted">{pick(k.label, lang)}</div>
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="text-2xl font-bold tabular-nums">{k.value}</span>
                    {k.delta && <span className="text-xs font-semibold" style={{ color: k.color }}>{k.delta}</span>}
                  </div>
                </div>
                {!session && <span className="ml-auto self-start">{SAMPLE_BADGE}</span>}
              </div>
              <div className="mt-1 text-[11px] text-muted">{k.sub}</div>
              <Sparkline values={k.spark} color={k.color} />
            </li>
          );
        })}
      </ul>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_390px]">
        <div className="min-w-0 space-y-4">
          {/* Map: always illustrative */}
          <Panel id="map" title={t("Global Threat Map", "वैश्विक खतरा मानचित्र")} badge={SAMPLE_BADGE} sub={t("Illustrative sample. TrustLens does not geolocate submissions or have a live geographic feed.", "केवल उदाहरण। TrustLens सबमिशन की भौगोलिक स्थिति नहीं जाँचता और उसके पास लाइव भौगोलिक फ़ीड नहीं है।")}>
            <WorldMap label={t("Illustrative world map with sample hotspots", "नमूना हॉटस्पॉट के साथ उदाहरण विश्व मानचित्र")} />
            <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
              {[["🇮🇳", "India", 28], ["🇺🇸", "United States", 18], ["🇮🇩", "Indonesia", 12], ["🇬🇧", "United Kingdom", 8], ["🌐", "Others", 34]].map(([f, n, p]) => (
                <li key={String(n)} className="rounded-xl border border-line bg-surface-2/50 p-3 opacity-80">
                  <div className="flex items-center gap-1.5 text-xs text-muted"><span aria-hidden>{f}</span><span className="truncate">{n}</span></div>
                  <div className="mt-1 text-xl font-semibold tabular-nums">{p}%</div>
                </li>
              ))}
            </ul>
          </Panel>

          <div id="trends" className="grid scroll-mt-24 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_minmax(0,1.25fr)]">
            <Panel title={t("Threat Types", "खतरों के प्रकार")} badge={badge}>
              {data.donut.segments.length === 0 ? <Empty text={t("No threat categories yet.", "अभी कोई खतरा श्रेणी नहीं।")} /> : (
                <div className="flex flex-col items-center gap-3">
                  <Donut segments={data.donut.segments} total={data.donut.total} label={t("Total threats", "कुल खतरे")} />
                  <ul className="w-full space-y-1.5 text-sm">
                    {data.donut.segments.map((s) => (
                      <li key={s.label} className="flex items-center justify-between gap-2"><span className="flex items-center gap-2"><span aria-hidden className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />{s.label}</span><span className="tabular-nums text-muted">{session ? s.value : `${s.value}%`}</span></li>
                    ))}
                  </ul>
                </div>
              )}
            </Panel>
            <Panel title={data.line.title === "Threat activity" ? t("Threat Activity", "खतरा गतिविधि") : data.line.title} badge={badge}>
              {session && data.line.xLabels.length < 2 ? <Empty text={t("Run at least two investigations to see a trend.", "रुझान देखने के लिए कम से कम दो जाँच चलाएँ।")} /> : (
                <>
                  <ul className="mb-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px]">
                    {data.line.series.map((s) => <li key={s.label} className="flex items-center gap-1.5"><span aria-hidden className="h-2 w-2 rounded-full" style={{ background: s.color }} />{s.label}</li>)}
                  </ul>
                  <LineChart series={data.line.series} xLabels={data.line.xLabels} yMax={data.line.yMax} />
                </>
              )}
            </Panel>
            <Panel title={data.ranks.title === "Top targeted" ? t("Top Targeted", "सबसे अधिक निशाने पर") : data.ranks.title} badge={badge}>
              {data.ranks.rows.length === 0 ? <Empty text={t("No indicators yet.", "अभी कोई संकेत नहीं।")} /> : (
                <ol className="space-y-3">
                  {data.ranks.rows.map((r, i) => (
                    <li key={r.label}>
                      <div className="flex items-center gap-2 text-sm"><span className="grid h-5 w-5 shrink-0 place-items-center rounded bg-high/20 text-[11px] text-high">{i + 1}</span><span className="min-w-0 flex-1 truncate">{r.label}</span><span className="text-xs tabular-nums text-muted">{r.pct}%</span></div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-3"><div className="h-full rounded-full bg-high" style={{ width: `${Math.min(100, r.pct * (session ? 1 : 5))}%` }} /></div>
                    </li>
                  ))}
                </ol>
              )}
            </Panel>
          </div>
        </div>

        {/* Alerts */}
        <Panel id="alerts" title={session ? t("Recent Alerts", "हाल की चेतावनियाँ") : t("Alerts", "चेतावनियाँ")} badge={badge} sub={t("Scam and fraud detections", "ठगी और धोखाधड़ी की पहचान")} action={<Link href="/history" className="inline-flex items-center gap-1 text-sm text-accent hover:underline">{t("View All", "सब देखें")} <ArrowRight aria-hidden className="h-4 w-4" /></Link>} className="xl:h-full">
          {session && data.alerts.length === 0 ? <Empty text={t("No Medium or High risk results in this session.", "इस सत्र में कोई मध्यम या उच्च जोखिम परिणाम नहीं।")} /> : (
            <ul className="space-y-2.5">
              {data.alerts.map((a) => {
                const I = ALERT_ICON[a.icon];
                const inner = (
                  <>
                    <span className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-xl", ALERT_ICON_TONE[a.risk])}><I aria-hidden className="h-5 w-5" /></span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold">{a.title}</span>
                        <span className={cn("rounded border px-1.5 py-0.5 text-[10px] font-medium", SEV_CHIP[a.risk])}>{a.risk === "high" ? t("High", "उच्च") : a.risk === "medium" ? t("Medium", "मध्यम") : t("Low", "कम")}</span>
                        <span className="ml-auto text-[11px] text-muted">{a.at ? relTime(a.at, lang) : a.agoText}</span>
                      </span>
                      <span className="mt-0.5 block break-all text-xs text-[#cbd5e1]">{a.line2}</span>
                      <span className="block text-xs text-muted">{a.line3}</span>
                    </span>
                  </>
                );
                return (
                  <li key={a.id}>
                    {a.reportId ? <button type="button" onClick={() => openReport(a.reportId)} className={cn("flex w-full gap-3 rounded-xl border p-3 text-left hover:brightness-110", ALERT_TONE[a.risk])}>{inner}</button> : <div className={cn("flex gap-3 rounded-xl border p-3 opacity-90", ALERT_TONE[a.risk])}>{inner}</div>}
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_390px]">
        <Panel id="detections" title={t("Recent Detections", "हाल की पहचान")} badge={badge} action={<Link href="/history" className="inline-flex items-center gap-1 text-sm text-accent hover:underline">{t("View All", "सब देखें")} <ArrowRight aria-hidden className="h-4 w-4" /></Link>}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="text-[11px] uppercase tracking-wider text-muted">
                <tr><th className="py-1.5 pr-3 font-medium">{t("Time", "समय")}</th><th className="pr-3 font-medium">{t("Target", "लक्ष्य")}</th><th className="pr-3 font-medium">{t("Type", "प्रकार")}</th><th className="pr-3 font-medium">{t("Risk", "जोखिम")}</th><th className="font-medium">{t("Summary", "सारांश")}</th></tr>
              </thead>
              <tbody>
                {data.detections.map((d, i) => (
                  <tr key={i} onClick={d.reportId ? () => openReport(d.reportId) : undefined} className={cn("border-t border-line/60", d.reportId && "cursor-pointer hover:bg-surface-2/60")}>
                    <td className="whitespace-nowrap py-2.5 pr-3 tabular-nums text-muted">{d.time}</td>
                    <td className="max-w-[210px] truncate pr-3 font-mono text-[13px]">{d.target}</td>
                    <td className="pr-3">{d.type}</td>
                    <td className="pr-3"><span className={cn("rounded border px-2 py-0.5 text-[11px] font-medium", d.risk === "high" ? SEV_CHIP.high : d.risk === "medium" ? SEV_CHIP.medium : d.risk === "low" ? SEV_CHIP.low : "border-line-strong text-muted")}>{pick(RISK_LABEL[d.risk], lang).replace(/ risk| जोखिम/i, "")}</span></td>
                    <td className="text-[#cbd5e1]">{d.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
        <Panel id="insights" title={t("Security Insights", "सुरक्षा इनसाइट्स")} badge={badge} sub={data.insightsNote}>
          <ul className="grid gap-2.5 sm:grid-cols-3 xl:grid-cols-1">
            {data.insights.map((x, i) => {
              const I = x.icon === "up" ? TrendingUp : x.icon === "bulb" ? Lightbulb : ShieldCheck;
              const tone = ["text-high bg-high/15", "text-medium bg-medium/15", "text-low bg-low/15"][i]!;
              return (
                <li key={i} className="rounded-xl border border-line bg-surface-2/50 p-3">
                  <div className="flex items-center gap-2.5"><span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-lg", tone)}><I aria-hidden className="h-4 w-4" /></span><span className="text-lg font-bold leading-tight">{x.big}</span></div>
                  <p className="mt-2 text-xs leading-relaxed text-muted">{x.text}</p>
                </li>
              );
            })}
          </ul>
          <Bell aria-hidden className="sr-only" />
        </Panel>
      </div>
    </div>
  );
}
