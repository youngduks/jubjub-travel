"use client";

import { useEffect, useState } from "react";
import type { City } from "@/lib/cities";
import type { Baseline, Pair, Signal } from "@/lib/baseline";
import { skyscannerUrl } from "@/lib/skyscanner";

type Props = {
  city: City;
  baseline?: Baseline;
  onClose: () => void;
};

function fmtDate(iso: string): string {
  const d = new Date(iso);
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const dow = ["일", "월", "화", "수", "목", "금", "토"][d.getDay()];
  return `${m}/${day}(${dow})`;
}

function nightsBetween(depart: string, returnDate: string): number {
  const a = new Date(depart);
  const b = new Date(returnDate);
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

function signalEmoji(s: Signal): string {
  return s === "hot" ? "🔥" : s === "expensive" ? "⚠️" : "👀";
}

function signalColor(s: Signal): string {
  return s === "hot"
    ? "text-accent-green"
    : s === "expensive"
    ? "text-red-400"
    : "text-text-muted";
}

export default function CityModal({ city, baseline, onClose }: Props) {
  const [nights, setNights] = useState<number>(4);
  const [windowType, setWindowType] = useState<"30" | "90">("30");

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const hasLive = baseline?.source === "skyscanner-rapidapi";
  const pairs: Pair[] =
    windowType === "30"
      ? baseline?.pairs30?.[nights] ?? []
      : baseline?.pairs90?.[nights] ?? [];

  const baselineWan = baseline?.baseline
    ? (baseline.baseline / 10000).toFixed(0)
    : null;

  function goPair(p: Pair) {
    const url = skyscannerUrl(city, {
      depart: new Date(p.depart),
      return_: new Date(p.returnDate),
    });
    if (typeof window !== "undefined") {
      window.open(url, "_blank", "noopener");
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-bg w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* header */}
        <div className="sticky top-0 bg-bg border-b border-line px-5 py-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-2xl">{city.emoji}</span>
              <span className="text-lg font-bold">{city.name_ko}</span>
              {baseline && baseline.signal !== "unknown" && (
                <span
                  className={`text-xs font-semibold ${signalColor(baseline.signal)}`}
                >
                  {signalEmoji(baseline.signal)}{" "}
                  {baseline.next30dMin > 0 && baseline.baseline > 0
                    ? `${Math.round((1 - baseline.next30dMin / baseline.baseline) * 100)}% 싸다`
                    : ""}
                </span>
              )}
            </div>
            <div className="text-[11px] text-text-dim mt-1 leading-relaxed">
              {baselineWan ? `평월 ₩${baselineWan}만 (왕복)` : "평월 -"}
              <br />
              주요: {city.carriers.join(" / ")}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-text-dim hover:text-text text-xl px-2 shrink-0"
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        {/* 토글 */}
        <div className="px-5 py-3 border-b border-line space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-text-dim w-12">박 수:</span>
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
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-text-dim w-12">윈도우:</span>
            {(["30", "90"] as const).map((w) => (
              <button
                key={w}
                onClick={() => setWindowType(w)}
                className={`px-2.5 py-1 rounded-md text-xs border transition ${
                  windowType === w
                    ? "bg-accent-blue/20 border-accent-blue text-accent-blue"
                    : "bg-bg-card border-line text-text-dim hover:text-text"
                }`}
              >
                다음 {w}일
              </button>
            ))}
          </div>
        </div>

        {/* 페어 리스트 */}
        <div className="px-3 py-3">
          {!hasLive ? (
            <div className="text-center text-text-dim py-10 text-sm px-5">
              💎 줍줍 리스트는 라이브 데이터에서만 표시됨
              <br />
              <span className="text-[11px] text-text-dim/70">
                {baseline?.source === "seed"
                  ? "현재 seed snapshot (다음 fetch 시 자동 복귀)"
                  : "데이터 없음"}
              </span>
            </div>
          ) : pairs.length === 0 ? (
            <div className="text-center text-text-dim py-10 text-sm">
              {nights}박 페어 없음
            </div>
          ) : (
            <div className="space-y-1.5">
              <div className="text-[11px] text-text-dim mb-2 px-2 uppercase tracking-wider">
                💎 {nights}박 줍줍 (top {pairs.length})
              </div>
              {pairs.map((p, i) => (
                <button
                  key={`${p.depart}-${p.returnDate}`}
                  onClick={() => goPair(p)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl border transition flex items-center justify-between gap-3 ${
                    i === 0
                      ? "bg-accent-green/10 border-accent-green/40 hover:bg-accent-green/20"
                      : "bg-bg-card border-line hover:border-accent-blue/40"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">
                      {i === 0 && <span className="mr-1">⭐</span>}
                      {fmtDate(p.depart)} → {fmtDate(p.returnDate)}
                    </div>
                    <div className="text-[11px] text-text-dim mt-0.5">
                      {nightsBetween(p.depart, p.returnDate)}박 · ₩
                      {(p.total / 10000).toFixed(0)}만
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className={`text-sm font-semibold ${signalColor(p.signal)}`}
                    >
                      {signalEmoji(p.signal)}{" "}
                      {p.pct > 0 ? `-${p.pct}%` : `+${-p.pct}%`}
                    </span>
                    <span className="text-text-dim">→</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* footer */}
        <div className="px-5 py-3 border-t border-line text-[11px] text-text-dim leading-relaxed">
          가격 = (출발일 편도 + 귀국일 편도) × 0.97 indicative.
          <br />
          실 가격 · 항공편 · 시간대는 클릭 후 Skyscanner에서 확인.
        </div>
      </div>
    </div>
  );
}
