"use client";

import { useMemo, useState } from "react";
import { CATEGORY_LABELS, type City } from "@/lib/cities";
import type { Baseline } from "@/lib/baseline";
import {
  DATE_PRESETS,
  type DatePreset,
  presetToDateRange,
  skyscannerUrl,
} from "@/lib/skyscanner";

type Props = {
  cities: City[];
  baselines: Record<string, Baseline>;
};

export default function HomeClient({ cities, baselines }: Props) {
  const [preset, setPreset] = useState<DatePreset>("anytime");
  const [nights, setNights] = useState<number>(4);

  const grouped = useMemo(() => {
    const groups: Record<string, City[]> = {};
    for (const c of cities) {
      (groups[c.category] ??= []).push(c);
    }
    return groups;
  }, [cities]);

  function go(city: City) {
    const range = presetToDateRange(preset, nights);
    const url = skyscannerUrl(city, range);
    if (typeof window !== "undefined") {
      window.open(url, "_blank", "noopener");
    }
  }

  // 갱신 시각 가장 최근 baseline 1개 기준
  const lastRefreshed = useMemo(() => {
    const ts = Object.values(baselines)
      .map((b) => new Date(b.refreshed).getTime())
      .filter((n) => n > 0);
    if (ts.length === 0) return null;
    const latest = new Date(Math.max(...ts));
    return latest;
  }, [baselines]);

  return (
    <main className="max-w-3xl mx-auto px-5 py-8">
      <header className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">✈️</span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">줍줍여행사</h1>
        </div>
        <p className="text-sm text-text-muted">
          평소보다 싼 항공권 줍줍 — 도시 + 일정 클릭하면 끝
        </p>
        {lastRefreshed && (
          <p className="text-[11px] text-text-dim mt-1">
            평월 가격: Skyscanner 1년 분포 trimmed mean · {lastRefreshed.toLocaleString("ko-KR")} 갱신
          </p>
        )}
      </header>

      <section className="mb-8">
        <div className="text-xs text-text-dim mb-2 uppercase tracking-wider">1. 언제</div>
        <div className="flex flex-wrap gap-2">
          {DATE_PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => setPreset(p.id)}
              className={`px-3 py-2 rounded-full text-sm border transition ${
                preset === p.id
                  ? "bg-accent-blue border-accent-blue text-white"
                  : "bg-bg-card border-line text-text-muted hover:border-accent-blue/40 hover:text-text"
              }`}
            >
              <span className="mr-1">{p.emoji}</span>
              {p.label}
            </button>
          ))}
        </div>
        {preset !== "anytime" && (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs text-text-dim">며칠?</span>
            {[2, 3, 4, 5, 7].map((n) => (
              <button
                key={n}
                onClick={() => setNights(n)}
                className={`px-2.5 py-1 rounded-md text-xs border transition ${
                  nights === n
                    ? "bg-accent-purple/20 border-accent-purple text-accent-purple"
                    : "bg-bg-card border-line text-text-dim hover:text-text"
                }`}
              >
                {n}박
              </button>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="text-xs text-text-dim mb-2 uppercase tracking-wider">2. 어디로</div>
        {(Object.keys(grouped) as (keyof typeof grouped)[]).map((cat) => {
          const list = grouped[cat];
          const label = CATEGORY_LABELS[list[0].category];
          return (
            <div key={cat} className="mb-5">
              <div className="text-xs text-text-muted mb-2 font-semibold">
                <span className="mr-1">{label.emoji}</span>
                {label.ko} ({list.length})
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {list.map((city) => {
                  const b = baselines[city.slug];
                  const fromLive = b?.source === "skyscanner-rapidapi" && b.samples > 0;
                  const baselineKrw = b?.baseline || city.baseline_krw;
                  const baselineWan = (baselineKrw / 10000).toFixed(0);
                  const minWan = b?.min ? (b.min / 10000).toFixed(0) : null;

                  return (
                    <button
                      key={city.slug}
                      onClick={() => go(city)}
                      className="text-left p-3 rounded-xl bg-bg-card hover:bg-bg-hover border border-line hover:border-accent-blue/40 transition"
                    >
                      <div className="text-xl mb-1">{city.emoji}</div>
                      <div className="text-sm font-semibold text-text">{city.name_ko}</div>
                      <div className="text-[11px] text-text-dim leading-tight">
                        <div>
                          {fromLive ? "평월" : "~"}₩{baselineWan}만
                          {fromLive && minWan && (
                            <span className="text-accent-green ml-1">↓₩{minWan}만</span>
                          )}
                        </div>
                        <div>{city.vibe}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </section>

      <footer className="mt-10 pt-6 border-t border-line text-xs text-text-dim leading-6">
        <p>
          평월 가격 = Skyscanner 1년치 일일 최저가의 trimmed mean (상하 10% 제외) × 1.95 (왕복 환산).
          실 가격은 도시 클릭 시 Skyscanner에서 확인.
        </p>
        <p className="mt-1">© 2026 줍줍여행사 · 본인 도구 · No ads · No signup</p>
      </footer>
    </main>
  );
}
