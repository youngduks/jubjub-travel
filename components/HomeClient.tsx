"use client";

import { useMemo, useState } from "react";
import { CATEGORY_LABELS, type City } from "@/lib/cities";
import type { Baseline } from "@/lib/baseline";
import CityModal from "./CityModal";

type Props = {
  cities: City[];
  baselines: Record<string, Baseline>;
};

function formatDateShort(iso: string): string {
  // "2026-06-03" → "6/3"
  const m = iso.match(/^\d{4}-(\d{2})-(\d{2})/);
  if (!m) return iso;
  return `${parseInt(m[1], 10)}/${parseInt(m[2], 10)}`;
}

export default function HomeClient({ cities, baselines }: Props) {
  const [modalCity, setModalCity] = useState<City | null>(null);

  const grouped = useMemo(() => {
    const groups: Record<string, City[]> = {};
    for (const c of cities) {
      (groups[c.category] ??= []).push(c);
    }
    return groups;
  }, [cities]);

  const lastRefreshed = useMemo(() => {
    const ts = Object.values(baselines)
      .map((b) => new Date(b.refreshed).getTime())
      .filter((n) => n > 0);
    if (ts.length === 0) return null;
    return new Date(Math.max(...ts));
  }, [baselines]);

  const isSeedSnapshot = useMemo(
    () => Object.values(baselines).some((b) => b.source === "seed"),
    [baselines]
  );

  return (
    <main className="max-w-3xl mx-auto px-5 py-8">
      <header className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">✈️</span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">줍줍여행사</h1>
        </div>
        <p className="text-sm text-text-muted">
          평소보다 싼 항공권 줍줍 — 카드 클릭 = 가장 싼 날짜로 검색
        </p>
        {lastRefreshed && (
          <p className="text-[11px] text-text-dim mt-1">
            {isSeedSnapshot
              ? "데이터: 2026-05-15 snapshot (다음 갱신 6월 1일)"
              : `평월 = Skyscanner 1년 trimmed mean · ${lastRefreshed.toLocaleString("ko-KR")} 갱신`}
          </p>
        )}
      </header>

      <section className="mb-6">
        <p className="text-[11px] text-text-dim">
          💡 카드 클릭 → 도시별 줍줍 리스트 (박 수별 top 10 + 항공사)
        </p>
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
                  const hasBase =
                    !!b &&
                    (b.source === "skyscanner-rapidapi" || b.source === "seed") &&
                    b.baseline > 0;
                  const hasSignal =
                    !!b &&
                    b.source === "skyscanner-rapidapi" &&
                    b.next30dMinDate !== null &&
                    b.signal !== "unknown" &&
                    b.next30dMin > 0;

                  const baselineWan = hasBase && b ? (b.baseline / 10000).toFixed(0) : null;
                  const next30Wan =
                    hasSignal && b ? (b.next30dMin / 10000).toFixed(0) : null;
                  const pct =
                    hasSignal && b
                      ? Math.round((1 - b.next30dMin / b.baseline) * 100)
                      : null;

                  const sig = b?.signal;
                  const sigEmoji =
                    sig === "hot" ? "🔥" : sig === "expensive" ? "⚠️" : "👀";
                  const sigColor =
                    sig === "hot"
                      ? "text-accent-green"
                      : sig === "expensive"
                      ? "text-red-400"
                      : "text-text-muted";

                  return (
                    <button
                      key={city.slug}
                      onClick={() => setModalCity(city)}
                      className="text-left p-3 rounded-xl bg-bg-card hover:bg-bg-hover border border-line hover:border-accent-blue/40 transition"
                    >
                      <div className="flex items-start justify-between mb-1">
                        <div className="text-xl">{city.emoji}</div>
                        {hasSignal && pct !== null && (
                          <div className={`text-[11px] font-semibold ${sigColor}`}>
                            {sigEmoji} {pct > 0 ? `-${pct}%` : `+${-pct}%`}
                          </div>
                        )}
                      </div>
                      <div className="text-sm font-semibold text-text">{city.name_ko}</div>
                      <div className="text-[11px] text-text-dim leading-tight mt-0.5">
                        {hasSignal && b ? (
                          <>
                            <div className="text-accent-green font-medium">
                              💎 {formatDateShort(b.next30dMinDate!)} ₩{next30Wan}만
                            </div>
                            <div className="text-text-dim/80">
                              평월 ₩{baselineWan}만 · 90일 줍줍 {b.next90dLowDays}일
                            </div>
                          </>
                        ) : hasBase ? (
                          <>
                            <div>평월 ₩{baselineWan}만</div>
                            <div className="text-text-dim/70">{city.vibe}</div>
                          </>
                        ) : (
                          <div className="text-text-dim/60">가격 로딩 중…</div>
                        )}
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
          <strong>🔥 줍줍 시그널</strong>: 다음 30일 최저가 vs 1년 평월 — -30%↓ 🔥 / -30~+10% 👀 / +10%↑ ⚠️
        </p>
        <p className="mt-1">
          평월 = Skyscanner 1년 일일 최저가의 trimmed mean × 1.95 (왕복 환산). 실 가격은 카드 클릭 후 Skyscanner에서 확인.
        </p>
        <p className="mt-1">© 2026 줍줍여행사 · 본인 도구 · No ads · No signup</p>
      </footer>

      {modalCity && (
        <CityModal
          city={modalCity}
          baseline={baselines[modalCity.slug]}
          onClose={() => setModalCity(null)}
        />
      )}
    </main>
  );
}
