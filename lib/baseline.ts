// 실제 시장 데이터 baseline + 줍줍 시그널 + 박 수별 top 10 페어 (Sky-Scrapper API)
// Quota 절감: 7일 cache + 키 2개 round-robin + seed final fallback

import type { City } from "./cities";
import { ORIGIN_IATA, ORIGIN_DOMESTIC_IATA } from "./cities";
import { BASELINE_SEED, SEED_REFRESHED_AT } from "./baseline_seed";

const RAPIDAPI_HOST = "sky-scrapper.p.rapidapi.com";
const REVALIDATE_SECONDS = 60 * 60 * 24 * 7; // 7일
const ROUND_TRIP_FACTOR = 1.95; // 편도 → 왕복 indicator (baseline 용)
const PAIR_DISCOUNT = 0.97; // 동시 예약 할인 factor
const NIGHT_OPTIONS = [2, 3, 4, 5, 7] as const;
const TOP_N = 10;

type ApiDay = { day: string; group: "low" | "medium" | "high"; price: number };

export type Signal = "hot" | "ok" | "expensive" | "unknown";

export type Pair = {
  depart: string; // YYYY-MM-DD
  returnDate: string; // YYYY-MM-DD
  total: number; // KRW 왕복 indicative
  pct: number; // baseline 대비 (양수 = 싸다, 음수 = 비싸다)
  signal: Signal;
};

export type Baseline = {
  baseline: number; // 평월 (왕복 환산)
  min: number;
  max: number;
  samples: number;
  // 호환 — 4박 기준 가장 싼 페어
  next30dMin: number;
  next30dMinDate: string | null;
  next30dLowDays: number;
  next90dMin: number;
  next90dMinDate: string | null;
  next90dLowDays: number;
  signal: Signal;
  // 신규 — 박 수별 top 10 페어
  pairs30: Record<number, Pair[]>;
  pairs90: Record<number, Pair[]>;
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

export function computeSignal(baseline: number, price: number): Signal {
  if (baseline === 0 || price === 0) return "unknown";
  const ratio = price / baseline;
  if (ratio <= 0.7) return "hot";
  if (ratio >= 1.1) return "expensive";
  return "ok";
}

function buildPairs(
  days: ApiDay[],
  windowDays: number,
  baseline: number
): Record<number, Pair[]> {
  const slice = days.slice(0, windowDays);
  const out: Record<number, Pair[]> = {};
  for (const n of NIGHT_OPTIONS) {
    const pairs: Pair[] = [];
    for (let i = 0; i + n < slice.length; i++) {
      const a = slice[i];
      const b = slice[i + n];
      if (a.price <= 0 || b.price <= 0) continue;
      const total = Math.round((a.price + b.price) * PAIR_DISCOUNT);
      pairs.push({
        depart: a.day,
        returnDate: b.day,
        total,
        pct: baseline > 0 ? Math.round((1 - total / baseline) * 100) : 0,
        signal: computeSignal(baseline, total),
      });
    }
    pairs.sort((a, b) => a.total - b.total);
    out[n] = pairs.slice(0, TOP_N);
  }
  return out;
}

function countLowDays(days: ApiDay[], windowDays: number): number {
  return days.slice(0, windowDays).filter((d) => d.group === "low").length;
}

function emptyPairsByNights(): Record<number, Pair[]> {
  const out: Record<number, Pair[]> = {};
  for (const n of NIGHT_OPTIONS) out[n] = [];
  return out;
}

function seedBaseline(city: City): Baseline {
  const s = BASELINE_SEED[city.slug];
  const base = s?.baseline ?? 0;
  return {
    baseline: base,
    min: s?.min ?? 0,
    max: base,
    samples: s?.samples ?? 0,
    next30dMin: 0,
    next30dMinDate: null,
    next30dLowDays: 0,
    next90dMin: 0,
    next90dMinDate: null,
    next90dLowDays: 0,
    signal: "unknown",
    pairs30: emptyPairsByNights(),
    pairs90: emptyPairsByNights(),
    refreshed: s ? SEED_REFRESHED_AT : new Date().toISOString(),
    source: s ? "seed" : "fallback",
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

      const pairs30 = buildPairs(validDays, 30, baseline);
      const pairs90 = buildPairs(validDays, 90, baseline);
      const best30 = pairs30[4]?.[0]; // 4박 default top
      const best90 = pairs90[4]?.[0];

      return {
        baseline,
        min: Math.round(Math.min(...prices) * ROUND_TRIP_FACTOR),
        max: Math.round(Math.max(...prices) * ROUND_TRIP_FACTOR),
        samples: prices.length,
        next30dMin: best30?.total ?? 0,
        next30dMinDate: best30?.depart ?? null,
        next30dLowDays: countLowDays(validDays, 30),
        next90dMin: best90?.total ?? 0,
        next90dMinDate: best90?.depart ?? null,
        next90dLowDays: countLowDays(validDays, 90),
        signal: best30 ? computeSignal(baseline, best30.total) : "unknown",
        pairs30,
        pairs90,
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
