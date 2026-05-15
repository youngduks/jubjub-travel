// 실제 시장 데이터 baseline 산출 (Sky-Scrapper API)
// MVP — Server-side fetch + trimmed mean → 객관 평월 가격

import type { City } from "./cities";
import { ORIGIN_IATA, ORIGIN_DOMESTIC_IATA } from "./cities";

const RAPIDAPI_HOST = "sky-scrapper.p.rapidapi.com";

type ApiDay = { day: string; group: "low" | "medium" | "high"; price: number };

export type Baseline = {
  baseline: number; // KRW, trimmed mean
  min: number;
  max: number;
  samples: number;
  refreshed: string; // ISO
  source: "skyscanner-rapidapi" | "fallback";
};

/**
 * trimmed mean — 상하 10% 제외 평균
 * "high"/seasonality spike 제거 + "low" mistake fare 제거
 */
function trimmedMean(values: number[], trimPct = 0.1): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const trimN = Math.floor(sorted.length * trimPct);
  const trimmed = sorted.slice(trimN, sorted.length - trimN);
  const sum = trimmed.reduce((acc, v) => acc + v, 0);
  return Math.round(sum / trimmed.length);
}

export async function fetchBaseline(city: City): Promise<Baseline> {
  const key = process.env.RAPIDAPI_KEY;
  if (!key) {
    // fallback: cities.ts의 본능 baseline
    return {
      baseline: 0,
      min: 0,
      max: 0,
      samples: 0,
      refreshed: new Date().toISOString(),
      source: "fallback",
    };
  }

  const origin = city.category === "domestic" ? ORIGIN_DOMESTIC_IATA : ORIGIN_IATA;
  const dest = city.skyscanner_dest;

  // 오늘부터 fetch — API가 1년치 자동 반환
  const fromDate = new Date().toISOString().slice(0, 10);
  const url = new URL(`https://${RAPIDAPI_HOST}/api/v1/flights/getPriceCalendar`);
  url.searchParams.set("originSkyId", origin);
  url.searchParams.set("destinationSkyId", dest);
  url.searchParams.set("fromDate", fromDate);
  url.searchParams.set("currency", "KRW");

  const res = await fetch(url.toString(), {
    headers: {
      "X-RapidAPI-Key": key,
      "X-RapidAPI-Host": RAPIDAPI_HOST,
    },
    // Next.js ISR — 24h cache
    next: { revalidate: 86400 },
  });

  if (!res.ok) {
    return {
      baseline: 0,
      min: 0,
      max: 0,
      samples: 0,
      refreshed: new Date().toISOString(),
      source: "fallback",
    };
  }

  const json = await res.json();
  const days: ApiDay[] = json?.data?.flights?.days ?? [];
  const prices = days.map((d) => d.price).filter((p) => p > 0);

  if (prices.length === 0) {
    return {
      baseline: 0,
      min: 0,
      max: 0,
      samples: 0,
      refreshed: new Date().toISOString(),
      source: "fallback",
    };
  }

  // 편도 가격 → 왕복 환산 (API는 편도 기준)
  // 단순 ×2 + 동시 예약 할인 ~5% 감안
  const roundTripFactor = 1.95;
  const oneway = trimmedMean(prices, 0.1);
  const baseline = Math.round(oneway * roundTripFactor);
  const min = Math.round(Math.min(...prices) * roundTripFactor);
  const max = Math.round(Math.max(...prices) * roundTripFactor);

  return {
    baseline,
    min,
    max,
    samples: prices.length,
    refreshed: new Date().toISOString(),
    source: "skyscanner-rapidapi",
  };
}

export async function fetchAllBaselines(cities: City[]): Promise<Record<string, Baseline>> {
  // 병렬 fetch — RapidAPI Basic은 100 req/min OK
  const results = await Promise.all(
    cities.map(async (c) => [c.slug, await fetchBaseline(c)] as const)
  );
  return Object.fromEntries(results);
}
