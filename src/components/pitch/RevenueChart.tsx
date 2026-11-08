"use client";

import { useEffect, useRef, useState } from "react";
import type { PitchMonth } from "@/lib/pitch-data";
import { monthLabel, rm } from "./format";

// Validated pair (dataviz validator, light surface): blue #0052A0 vs gold #D99A00, CVD ΔE ≥ 34.
// Gold sits below 3:1 against white, so both series are named in the legend and the table view.
const SERIES = [
  { key: "revenue", label: "Revenue", color: "#0052A0" },
  { key: "costs", label: "Cash operating costs", color: "#D99A00" },
] as const;
const POSITIVE = "#00843A";
const GRID = "#E3E9F0";
const TICKS = [0, 5000, 10000, 15000, 20000];

export function RevenueChart({
  months,
  positiveMonth,
  fundedMonths,
}: {
  months: readonly PitchMonth[];
  positiveMonth: number;
  fundedMonths: number;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(760);
  const [active, setActive] = useState<number | null>(null);
  // "rest" = fully drawn (server render, reduced motion, or already on screen); "hidden" → "drawn" plays the lines in.
  const [phase, setPhase] = useState<"rest" | "hidden" | "drawn">("rest");

  useEffect(() => {
    const el = wrap.current;
    if (!el || !("IntersectionObserver" in window) || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight && r.bottom > 0) return;
    setPhase("hidden");
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        setPhase("drawn");
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.max(280, Math.round(entry.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const narrow = width < 560;
  const height = narrow ? 250 : 320;
  const m = { l: 36, r: 10, t: 30, b: 30 };
  const iw = width - m.l - m.r;
  const ih = height - m.t - m.b;
  const max = TICKS[TICKS.length - 1];
  const n = months.length;
  const x = (i: number) => m.l + (i / (n - 1)) * iw;
  const y = (v: number) => m.t + ih - (Math.max(0, v) / max) * ih;
  const line = (key: "revenue" | "costs") =>
    months.map((d, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(d[key]).toFixed(1)}`).join("");

  const xTicks = narrow ? [0, 12, n - 1] : [0, 6, 12, 18, n - 1];
  const split = (x(fundedMonths - 1) + x(fundedMonths)) / 2;
  const pIndex = positiveMonth - 1;

  function indexAt(clientX: number) {
    const rect = wrap.current!.getBoundingClientRect();
    const i = Math.round(((clientX - rect.left - m.l) / iw) * (n - 1));
    return Math.min(n - 1, Math.max(0, i));
  }

  function onKey(e: React.KeyboardEvent) {
    const step = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (step) {
      e.preventDefault();
      setActive((a) => Math.min(n - 1, Math.max(0, (a ?? (step > 0 ? -1 : n)) + step)));
    } else if (e.key === "Home" || e.key === "End") {
      e.preventDefault();
      setActive(e.key === "Home" ? 0 : n - 1);
    } else if (e.key === "Escape") {
      setActive(null);
    }
  }

  const d = active === null ? null : months[active];
  // Tooltip sits beside the crosshair, on the side with more room, so it never covers the point being read.
  const tipOnLeft = active !== null && x(active) > width / 2;
  const tipX = active === null ? {} : tipOnLeft ? { right: width - x(active) + 12 } : { left: x(active) + 12 };
  // …and above or below the two points, whichever leaves them uncovered.
  const ys = active === null ? [0, 0] : SERIES.map((s) => y(months[active][s.key]));
  const tipTop = Math.max(...ys) < m.t + ih / 2 ? Math.max(...ys) + 14 : Math.max(m.t, Math.min(...ys) - 104);
  const tipStyle = { top: tipTop, ...tipX };

  return (
    <div>
      <ul className="mb-4 flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-600" aria-label="Legend">
        {SERIES.map((s) => (
          <li key={s.key} className="flex items-center gap-2">
            <span className="h-0.5 w-4 rounded-full" style={{ background: s.color }} aria-hidden />
            {s.label}
          </li>
        ))}
        <li className="flex items-center gap-2">
          <span className="h-3 w-px" style={{ background: POSITIVE }} aria-hidden />
          EBITDA turns positive
        </li>
      </ul>

      <div
        ref={wrap}
        tabIndex={0}
        role="group"
        aria-label={`Monthly revenue and cash operating costs, ${monthLabel(1)} to ${monthLabel(n)}. Use the left and right arrow keys to read each month.`}
        onPointerMove={(e) => setActive(indexAt(e.clientX))}
        onPointerDown={(e) => setActive(indexAt(e.clientX))}
        onPointerLeave={() => setActive(null)}
        onFocus={() => setActive((a) => a ?? n - 1)}
        onBlur={() => setActive(null)}
        onKeyDown={onKey}
        className="relative touch-pan-y rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-(--blue) focus-visible:ring-offset-4"
      >
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="block h-auto w-full overflow-visible" aria-hidden>
          {/* Year bands */}
          <text x={m.l} y={12} className="fill-slate-500 text-[11px] font-medium">
            {narrow ? "Year 1" : `Year 1, funded by the raise`}
          </text>
          <text x={split + 8} y={12} className="fill-slate-500 text-[11px] font-medium">
            Year 2
          </text>
          <line x1={split} x2={split} y1={2} y2={m.t + ih} stroke={GRID} />

          {/* Grid + y axis */}
          {TICKS.map((t) => (
            <g key={t}>
              <line x1={m.l} x2={width - m.r} y1={y(t)} y2={y(t)} stroke={t === 0 ? "#CBD5E1" : GRID} />
              <text x={m.l - 8} y={y(t)} dy="0.32em" textAnchor="end" className="fill-slate-500 text-[11px] tabular-nums">
                {t === 0 ? "0" : `${t / 1000}K`}
              </text>
            </g>
          ))}

          {/* X ticks */}
          {xTicks.map((i, k) => (
            <text
              key={i}
              x={x(i)}
              y={height - 8}
              textAnchor={k === 0 ? "start" : k === xTicks.length - 1 ? "end" : "middle"}
              className="fill-slate-500 text-[11px]"
            >
              {monthLabel(months[i].month)}
            </text>
          ))}

          {/* EBITDA positive marker: appears once the lines have reached it */}
          <g
            style={{
              opacity: phase === "hidden" ? 0 : 1,
              transition: phase === "drawn" ? "opacity 0.5s ease 1.7s" : undefined,
            }}
          >
            <line x1={x(pIndex)} x2={x(pIndex)} y1={m.t - 4} y2={m.t + ih} stroke={POSITIVE} strokeWidth={1} />
            <text x={x(pIndex) - 6} y={m.t + 8} textAnchor="end" className="fill-slate-700 text-[11px] font-semibold">
              {monthLabel(months[pIndex].month)}
            </text>
          </g>

          {/* Series */}
          {SERIES.map((s) => (
            <path
              key={s.key}
              d={line(s.key)}
              fill="none"
              stroke={s.color}
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
              pathLength={1}
              strokeDasharray={1}
              style={{
                strokeDashoffset: phase === "hidden" ? 1 : 0,
                opacity: phase === "hidden" ? 0 : 1,
                transition: phase === "drawn" ? "stroke-dashoffset 1.8s cubic-bezier(0.3, 0.6, 0.2, 1), opacity 0.2s" : undefined,
              }}
            />
          ))}

          {/* Crosshair */}
          {active !== null ? (
            <g>
              <line x1={x(active)} x2={x(active)} y1={m.t} y2={m.t + ih} stroke="#94A3B8" />
              {SERIES.map((s) => (
                <circle key={s.key} cx={x(active)} cy={y(months[active][s.key])} r={4.5} fill={s.color} stroke="#fff" strokeWidth={2} />
              ))}
            </g>
          ) : null}
        </svg>

        {d ? (
          <div
            role="status"
            aria-live="polite"
            className="pointer-events-none absolute w-44 rounded-xl border border-line bg-white px-3 py-2.5 text-xs shadow-[0_8px_24px_rgba(15,23,42,0.12)]"
            style={tipStyle}
          >
            <p className="font-medium text-slate-500">
              {monthLabel(d.month)}, month {d.month}
            </p>
            <dl className="mt-1.5 space-y-1">
              {SERIES.map((s) => (
                <div key={s.key} className="flex items-center gap-2">
                  <span className="h-0.5 w-3 shrink-0 rounded-full" style={{ background: s.color }} aria-hidden />
                  <dt className="sr-only">{s.label}</dt>
                  <dd className="font-semibold tabular-nums text-ink">{rm(d[s.key])}</dd>
                  <span className="truncate text-slate-500" aria-hidden>
                    {s.key === "revenue" ? "revenue" : "costs"}
                  </span>
                </div>
              ))}
              <div className="flex justify-between gap-2 border-t border-line pt-1">
                <dt className="text-slate-500">EBITDA</dt>
                <dd className="font-semibold tabular-nums text-ink">{rm(d.ebitda)}</dd>
              </div>
            </dl>
          </div>
        ) : null}
      </div>
    </div>
  );
}
