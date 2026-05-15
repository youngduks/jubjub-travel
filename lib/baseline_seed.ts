// 2026-05-15 Sky-Scrapper fetch snapshot — final fallback when both API keys hit quota.
// 다음 달 1일 quota 리셋되면 live fetch 결과로 자동 대체됨.

export type SeedEntry = { baseline: number; min: number; samples: number };

export const BASELINE_SEED: Record<string, SeedEntry> = {
  jeju:    { baseline: 160000, min:  70000, samples: 360 },
  tokyo:   { baseline: 510000, min:  80000, samples: 360 },
  osaka:   { baseline: 360000, min: 160000, samples: 360 },
  fukuoka: { baseline: 350000, min: 170000, samples: 360 },
  okinawa: { baseline: 580000, min: 260000, samples: 360 },
  danang:  { baseline: 520000, min: 300000, samples: 360 },
  phuquoc: { baseline: 600000, min: 290000, samples: 360 },
  bangkok: { baseline: 440000, min: 300000, samples: 360 },
};

export const SEED_REFRESHED_AT = "2026-05-15T00:00:00.000Z";
