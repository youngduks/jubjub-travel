"use client";

import { useMemo, useState } from "react";
import { CATEGORY_LABELS, type City } from "@/lib/cities";
import { computeSignal, type Baseline, type Signal } from "@/lib/baseline";
import CityModal from "./CityModal";

type Props = {
  cities: City[];
  baselines: Record<string, Baseline>;
};

function formatDateShort(iso: string): string {
  const m = iso.match(/^\d{4}-(\d{2})-(\d{2})/);
  if (!m) return iso;
  return `${parseInt(m[1], 10)}/${parseInt(m[2], 10)}`;
}

function sigLabel(s: Signal): string {
  return s === "hot" ? "싸다" : s === "expensive" ? "비쌈" : s === "ok" ? "보통" : "";
}

function sigEmoji(s: Signal): string {
  return s === "hot" ? "🔥" : s === "expensive" ? "⚠️" : "👀";
}

function sigColor(s: Signal): string {
  return s === "hot"
    ? "text-accent-green"
    : s === "expensive"
    ? "text-red-400"
    : "text-text-muted";
}

const NIGHTS_OPTIONS = [2, 3, 4, 5, 7];

export default function HomeClient({ cities, baselines }: Props) {
  const [modalCity, setModalCity] = useState<City | null>(null);
  const [nights, setNights] = useState<number>(4);

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
      <header className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">✈️</span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">줍줍여행사</h1>
        </div>
        <p className="text-sm text-text-muted">
          평소보다 싼 항공권 줍줍 — 박 수 선택 + 카드 클릭하면 상세
        </p>
        {lastRefreshed && (
          <p className="text-[11px] text-text-dim mt-1">
            {isSeedSnapshot
              ? "데이터: 2026-05-15 snapshot (다음 갱신 6월 1일)"
              : `평월 = Skyscanner 1년 trimmed mean · ${lastRefreshed.toLocaleString("ko-KR")} 갱신`}
          </p>
        )}
      </header>

      <section className="mb-6 sticky top-0 bg-bg z-10 -mx-5 px-5 py-3 border-b border-line">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-text-dim mr-1">박 수</span>
          {NIGHTS_OPTIONS.map((n) => (
            <button
              key={n}
              onClick={() => setNights(n)}
              className={`px-2.5 py-1 rounded-md text-xs border transition ${
                nights === n
                  ? "bg-accent-purple/20 border-accent-purple text-accent-purple font-semibold"
                  : "bg-bg-card border-line text-text-dim hover:text-text"
              }`}
            >
              {n}박
            </button>
          ))}
        </div>
        <p className="text-[11px] text-text-dim mt-1.5">
          박 수 바꾸면 카드 가격·시그널이 즉시 변동 · 카드 클릭 = 상세 리스트
        </p>
      </section>

      <section>
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

                  // 박 수에 따라 카드 시그널 즉시 재계산
                  const bestPair = b?.pairs30?.[nights]?.[0];
                  const next30Min = bestPair?.total ?? 0;
                  const next30Date = bestPair?.depart ?? null;
                  const next90LowDays = b?.next90dLowDays ?? 0;

                  const hasSignal =
                    !!b &&
                    b.source === "skyscanner-rapidapi" &&
                    next30Min > 0 &&
                    next30Date !== null;

                  const sig: Signal = hasSignal
                    ? computeSignal(b!.baseline, next30Min)
                    : "unknown";

                  const baselineWan = hasBase && b ? (b.baseline / 10000).toFixed(0) : null;
                  const next30Wan = hasSignal ? (next30Min / 10000).toFixed(0) : null;
                  const pct = hasSignal
                    ? Math.round((1 - next30Min / b!.baseline) * 100)
                    : null;

                  return (
                    <button
                      key={city.slug}
                      onClick={() => setModalCity(city)}
                      className="text-left p-3 rounded-xl bg-bg-card hover:bg-bg-hover border border-line hover:border-accent-blue/40 transition min-h-[110px] flex flex-col"
                    >
                      <div className="flex items-start justify-between mb-1">
                        <div className="text-xl">{city.emoji}</div>
                        {hasSignal && pct !== null && (
                          <div className={`text-[11px] font-semibold ${sigColor(sig)}`}>
                            {sigEmoji(sig)} {pct > 0 ? `${pct}% ${sigLabel(sig)}` : `+${-pct}% ${sigLabel(sig)}`}
                          </div>
                        )}
                      </div>
                      <div className="text-sm font-semibold text-text">{city.name_ko}</div>
                      <div className="text-[11px] text-text-dim leading-tight mt-0.5 flex-1">
                        {hasSignal && next30Date ? (
                          <>
                            <div className="text-accent-green font-medium">
                              💎 {formatDateShort(next30Date)} ₩{next30Wan}만
                              <span className="text-text-dim/60 font-normal"> ({nights}박)</span>
                            </div>
                            <div className="text-text-dim/80">
                              평월 ₩{baselineWan}만 · 90일 줍줍 {next90LowDays}일
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
          <strong>줍줍 시그널</strong>: 다음 30일 최저가 vs 1년 평월 — -30%↓ 🔥싸다 / -30~+10% 👀보통 / +10%↑ ⚠️비쌈
        </p>
        <p className="mt-1">
          가격 = 운임(Skyscanner 1년 일일 최저 페어 합산 × 0.97) + 노선별 평균 세금/유류할증.
          실 가격은 항공사 promo · 환율 · 출발 시간대에 따라 ±10% 변동 — 카드 클릭 → Skyscanner에서 확인.
        </p>
        <p className="mt-1">© 2026 줍줍여행사 · 본인 도구 · No ads · No signup</p>
      </footer>

      {modalCity && (
        <CityModal
          city={modalCity}
          baseline={baselines[modalCity.slug]}
          initialNights={nights}
          onClose={() => setModalCity(null)}
        />
      )}
    </main>
  );
}
