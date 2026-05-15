// Skyscanner 검색 deeplink generator
// MVP — API 없이 deeplink만으로 시작. 클릭 시 Skyscanner KR로 redirect.
//
// URL 패턴: https://www.skyscanner.co.kr/transport/flights/{origin}/{dest}/{depart}/{return}/
//   - origin/dest: IATA code 또는 city code
//   - depart/return: YYMMDD 형식
//   - 왕복 default, 편도는 return 생략

import type { City } from "./cities";
import { ORIGIN_IATA, ORIGIN_DOMESTIC_IATA } from "./cities";

export type DateRange = {
  depart: Date;
  return_?: Date;
};

function yymmdd(d: Date): string {
  const yy = String(d.getFullYear()).slice(2);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yy}${mm}${dd}`;
}

export function skyscannerUrl(city: City, range?: DateRange): string {
  const origin = city.category === "domestic" ? ORIGIN_DOMESTIC_IATA : ORIGIN_IATA;
  const dest = city.skyscanner_dest;
  const base = `https://www.skyscanner.co.kr/transport/flights/${origin}/${dest}`;
  if (!range) {
    // 일정 미정 → "anywhere" 검색 (Cheapest Month view)
    return `${base}/`;
  }
  const depart = yymmdd(range.depart);
  if (range.return_) {
    const return_ = yymmdd(range.return_);
    return `${base}/${depart}/${return_}/`;
  }
  return `${base}/${depart}/`;
}

// 대략 일정 preset
export type DatePreset =
  | "anytime"
  | "this_weekend"
  | "next_month"
  | "in_3_months"
  | "in_6_months";

export const DATE_PRESETS: { id: DatePreset; label: string; emoji: string }[] = [
  { id: "anytime", label: "아무 때나", emoji: "🤷" },
  { id: "this_weekend", label: "이번 주말", emoji: "🔥" },
  { id: "next_month", label: "다음 달", emoji: "📅" },
  { id: "in_3_months", label: "3개월 내", emoji: "🗓️" },
  { id: "in_6_months", label: "6개월 내", emoji: "🎯" },
];

export function presetToDateRange(preset: DatePreset, nights: number = 4): DateRange | undefined {
  const now = new Date();
  if (preset === "anytime") return undefined;

  const depart = new Date(now);
  if (preset === "this_weekend") {
    // 다음 금요일
    const day = now.getDay();
    const daysToFri = (5 - day + 7) % 7 || 7;
    depart.setDate(now.getDate() + daysToFri);
  } else if (preset === "next_month") {
    depart.setMonth(now.getMonth() + 1);
    depart.setDate(15);
  } else if (preset === "in_3_months") {
    depart.setMonth(now.getMonth() + 2);
    depart.setDate(15);
  } else if (preset === "in_6_months") {
    depart.setMonth(now.getMonth() + 5);
    depart.setDate(15);
  }
  const return_ = new Date(depart);
  return_.setDate(depart.getDate() + nights);
  return { depart, return_ };
}
