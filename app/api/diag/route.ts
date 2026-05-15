// 임시 진단 endpoint — production 환경에서 env var + RapidAPI 호출 + fetchBaseline 검증
// 진단 후 제거 예정

import { NextResponse } from "next/server";
import { fetchBaseline } from "@/lib/baseline";
import { CITIES } from "@/lib/cities";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const key = process.env.RAPIDAPI_KEY;
  const host = process.env.RAPIDAPI_HOST;

  const env = {
    has_RAPIDAPI_KEY: !!key,
    RAPIDAPI_KEY_length: key ? key.length : 0,
    RAPIDAPI_KEY_prefix: key ? key.slice(0, 6) : null,
    has_RAPIDAPI_HOST: !!host,
    RAPIDAPI_HOST_value: host || null,
    NODE_ENV: process.env.NODE_ENV || null,
    VERCEL_ENV: process.env.VERCEL_ENV || null,
  };

  // direct RapidAPI fetch test
  let directFetch: Record<string, unknown> = { ran: false, reason: "no key" };
  if (key) {
    try {
      const url = new URL(
        "https://sky-scrapper.p.rapidapi.com/api/v1/flights/getPriceCalendar"
      );
      url.searchParams.set("originSkyId", "ICN");
      url.searchParams.set("destinationSkyId", "TYOA");
      url.searchParams.set("fromDate", new Date().toISOString().slice(0, 10));
      url.searchParams.set("currency", "KRW");
      const res = await fetch(url.toString(), {
        headers: {
          "X-RapidAPI-Key": key,
          "X-RapidAPI-Host": "sky-scrapper.p.rapidapi.com",
        },
        cache: "no-store",
      });
      directFetch = { ran: true, status: res.status, ok: res.ok };
      if (res.ok) {
        const json = await res.json();
        const days = json?.data?.flights?.days ?? [];
        directFetch.days_count = days.length;
        directFetch.first_price = days[0]?.price ?? null;
      } else {
        directFetch.body_snippet = (await res.text()).slice(0, 200);
      }
    } catch (e) {
      directFetch = { ran: true, error: (e as Error).message };
    }
  }

  // fetchBaseline test (tokyo)
  let baselineCall: Record<string, unknown> = { ran: false };
  const tokyo = CITIES.find((c) => c.slug === "tokyo");
  if (tokyo) {
    try {
      const result = await fetchBaseline(tokyo);
      baselineCall = {
        ran: true,
        source: result.source,
        baseline: result.baseline,
        samples: result.samples,
        min: result.min,
      };
    } catch (e) {
      baselineCall = { ran: true, error: (e as Error).message };
    }
  }

  return NextResponse.json({ env, directFetch, baselineCall });
}
