// 실제 시장 데이터 baseline + 줍줍 시그널 (Sky-Scrapper API)
// MVP — Server-side fetch + trimmed mean + 30/90일 window 분석
// Quota 절감: 7일 cache + 키 2개 round-robin + seed final fallback

import type { City } from "./cities";
import { ORIGIN_IATA, ORIGIN_DOMESTIC_IATA } from "./cities";
import { BASELINE_SEED, SEED_REFRESHED_AT } from "./baseline_seed";

const RAPIDAPI_HOST = "sky-scrapper.p.rapidapi.com";
const REVALIDATE_SECONDS = 60 * 60 * 24 * 7; // 7일 — quota 보호
const ROUND_TRIP_FACTOR = 1.95;

type ApiDay = { day: string; group: "low" | "medium" | "high"; price: number };

export type Signal = "hot" | "ok" | "expensive" | "unknown";

export type Baseline = {
  baseline: number; // 평월 (왕복 환산, trimmed mean)
  min: number; // 365일 절대 최저 (왕복 환산)
  max: number;
  samples: number;
  // 줍줍 시그널
  next30dMin: number; // 다음 30일 최저 (왕복 환산)
  next30dMinDate: string | null; // YYYY-MM-DD
  next30dLowDays: number; // 다음 30일 중 "low" 그룹 일자 수
  next90dMin: number;
  next90dMinDate: string | null;
  next90dLowDays: number;
  signal: Signal; // 평월 대비 next30dMin 시그널
  refreshed: string;
  source: "skyscanner-rapidapi" | "seed" | "fallback";
};

function trimmedMean(values: number[], trimPct = 0.1): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const trimN = Math.floor(sorted.length * trimPct);
  const trimmed = sorted.slice(trimN, sorted.length - trimN);
  const sum = trimmed.reduce((acc, v) => acc + v, 0);
  return Math.round(sum / trimmed.length);
}

function computeSignal(baseline: number, next30dMin: number): Signal {
  if (baseline === 0 || next30dMin === 0) return "unknown";
  const ratio = next30dMin / baseline;
  if (ratio <= 0.7) return "hot";
  if (ratio >= 1.1) return "expensive";
  return "ok";
}

function analyzeWindow(
  days: ApiDay[],
  windowDays: number
): { min: number; minDate: string | null; lowDays: number } {
  const slice = days.slice(0, windowDays);
  if (slice.length === 0) return { min: 0, minDate: null, lowDays: 0 };
  const sorted = [...slice].sort((a, b) => a.price - b.price);
  const minDay = sorted[0];
  const lowDays = slice.filter((d) => d.group === "low").length;
  return {
    min: Math.round(minDay.price * ROUND_TRIP_FACTOR),
    minDate: minDay.day,
    lowDays,
  };
}

function seedBaseline(city: City): Baseline {
  const s = BASELINE_SEED[city.slug];
  if (s) {
    return {
      baseline: s.baseline,
      min: s.min,
      max: s.baseline,
      samples: s.samples,
      next30dMin: 0,
      next30dMinDate: null,
      next30dLowDays: 0,
      next90dMin: 0,
      next90dMinDate: null,
      next90dLowDays: 0,
      signal: "unknown",
      refreshed: SEED_REFRESHED_AT,
      source: "seed",
    };
  }
  return {
    baseline: 0,
    min: 0,
    max: 0,
    samples: 0,
    next30dMin: 0,
    next30dMinDate: null,
    next30dLowDays: 0,
    next90dMin: 0,
    next90dMinDate: null,
    next90dLowDays: 0,
    signal: "unknown",
    refreshed: new Date().toISOString(),
    source: "fallback",
  };
}

async function tryFetch(
  key: string,
  origin: string,
  dest: string
): Promise<{ ok: boolean; status: number; days: ApiDay[] }> {
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
    next: { revalidate: REVALIDATE_SECONDS },
  });
  if (!res.ok) return { ok: false, status: res.status, days: [] };
  const json = await res.json();
  const days: ApiDay[] = json?.data?.flights?.days ?? [];
  return { ok: true, status: 200, days };
}

export async function fetchBaseline(city: City): Promise<Baseline> {
  const keys = [process.env.RAPIDAPI_KEY, process.env.RAPIDAPI_KEY_2].filter(
    (k): k is string => !!k
  );
  if (keys.length === 0) return seedBaseline(city);

  const origin = city.category === "domestic" ? ORIGIN_DOMESTIC_IATA : ORIGIN_IATA;
  const dest = city.skyscanner_dest;

  for (const key of keys) {
    try {
      const result = await tryFetch(key, origin, dest);
      if (!result.ok) continue;
      const validDays = result.days.filter((d) => d.price > 0);
      if (validDays.length === 0) continue;

      const prices = validDays.map((d) => d.price);
      const oneway = trimmedMean(prices, 0.1);
      const baseline = Math.round(oneway * ROUND_TRIP_FACTOR);

      const w30 = analyzeWindow(validDays, 30);
      const w90 = analyzeWindow(validDays, 90);
      const signal = computeSignal(baseline, w30.min);

      return {
        baseline,
        min: Math.round(Math.min(...prices) * ROUND_TRIP_FACTOR),
        max: Math.round(Math.max(...prices) * ROUND_TRIP_FACTOR),
        samples: prices.length,
        next30dMin: w30.min,
        next30dMinDate: w30.minDate,
        next30dLowDays: w30.lowDays,
        next90dMin: w90.min,
        next90dMinDate: w90.minDate,
        next90dLowDays: w90.lowDays,
        signal,
        refreshed: new Date().toISOString(),
        source: "skyscanner-rapidapi",
      };
    } catch {
      continue;
    }
  }

  return seedBaseline(city);
}

export async function fetchAllBaselines(
  cities: City[]
): Promise<Record<string, Baseline>> {
  const results = await Promise.all(
    cities.map(async (c) => [c.slug, await fetchBaseline(c)] as const)
  );
  return Object.fromEntries(results);
}
