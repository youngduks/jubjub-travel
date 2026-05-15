// 실제 시장 데이터 baseline 산출 (Sky-Scrapper API)
// MVP — Server-side fetch + trimmed mean → 객관 평월 가격
// Quota 절감: 7일 cache + 키 2개 round-robin + seed final fallback

import type { City } from "./cities";
import { ORIGIN_IATA, ORIGIN_DOMESTIC_IATA } from "./cities";
import { BASELINE_SEED, SEED_REFRESHED_AT } from "./baseline_seed";

const RAPIDAPI_HOST = "sky-scrapper.p.rapidapi.com";
const REVALIDATE_SECONDS = 60 * 60 * 24 * 7; // 7일 — quota 보호

type ApiDay = { day: string; group: "low" | "medium" | "high"; price: number };

export type Baseline = {
  baseline: number;
  min: number;
  max: number;
  samples: number;
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

function seedBaseline(city: City): Baseline {
  const s = BASELINE_SEED[city.slug];
  if (s) {
    return {
      baseline: s.baseline,
      min: s.min,
      max: s.baseline,
      samples: s.samples,
      refreshed: SEED_REFRESHED_AT,
      source: "seed",
    };
  }
  return {
    baseline: 0,
    min: 0,
    max: 0,
    samples: 0,
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

  // round-robin: 키 1 시도 → 429/실패면 키 2 시도 → 둘 다 실패면 seed
  for (const key of keys) {
    try {
      const result = await tryFetch(key, origin, dest);
      if (!result.ok || result.days.length === 0) continue;

      const prices = result.days.map((d) => d.price).filter((p) => p > 0);
      if (prices.length === 0) continue;

      const roundTripFactor = 1.95;
      const oneway = trimmedMean(prices, 0.1);
      return {
        baseline: Math.round(oneway * roundTripFactor),
        min: Math.round(Math.min(...prices) * roundTripFactor),
        max: Math.round(Math.max(...prices) * roundTripFactor),
        samples: prices.length,
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
