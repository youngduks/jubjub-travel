// 형님 자주 가는 8개 도시 — dogfooding default profile
// 일본 weight ★★★★ (4/8), 동남아 ★★ (3/8), 국내 ★ (1/8)

export type City = {
  slug: string;
  name_ko: string;
  name_en: string;
  country_ko: string;
  country_code: string; // ISO 3166-1 alpha-2
  flag: string;
  iata: string; // 도착 공항 IATA
  category: "domestic" | "japan" | "vietnam" | "thailand";
  /** 형님 본능 — 평월 평균 KRW (대략, 인천 출발 economy 왕복) */
  baseline_krw: number;
  /** Skyscanner 검색 URL 생성용 도시 키 */
  skyscanner_dest: string;
  emoji: string;
  vibe: string;
};

export const ORIGIN_IATA = "ICN"; // 인천 default
export const ORIGIN_DOMESTIC_IATA = "GMP"; // 김포 (제주행)

export const CITIES: City[] = [
  // 🇰🇷 국내
  {
    slug: "jeju",
    name_ko: "제주",
    name_en: "Jeju",
    country_ko: "한국",
    country_code: "KR",
    flag: "🇰🇷",
    iata: "CJU",
    category: "domestic",
    baseline_krw: 120000,
    skyscanner_dest: "CJU",
    emoji: "🏝️",
    vibe: "주말 도피",
  },
  // 🇯🇵 일본 (4)
  {
    slug: "tokyo",
    name_ko: "도쿄",
    name_en: "Tokyo",
    country_ko: "일본",
    country_code: "JP",
    flag: "🇯🇵",
    iata: "NRT",
    category: "japan",
    baseline_krw: 380000,
    skyscanner_dest: "TYOA", // Tokyo any
    emoji: "🗼",
    vibe: "도시 트립",
  },
  {
    slug: "osaka",
    name_ko: "오사카",
    name_en: "Osaka",
    country_ko: "일본",
    country_code: "JP",
    flag: "🇯🇵",
    iata: "KIX",
    category: "japan",
    baseline_krw: 320000,
    skyscanner_dest: "OSAA",
    emoji: "🍜",
    vibe: "먹방 트립",
  },
  {
    slug: "fukuoka",
    name_ko: "후쿠오카",
    name_en: "Fukuoka",
    country_ko: "일본",
    country_code: "JP",
    flag: "🇯🇵",
    iata: "FUK",
    category: "japan",
    baseline_krw: 280000,
    skyscanner_dest: "FUK",
    emoji: "🍡",
    vibe: "가까운 일본",
  },
  {
    slug: "okinawa",
    name_ko: "오키나와",
    name_en: "Okinawa",
    country_ko: "일본",
    country_code: "JP",
    flag: "🇯🇵",
    iata: "OKA",
    category: "japan",
    baseline_krw: 420000,
    skyscanner_dest: "OKA",
    emoji: "🌊",
    vibe: "일본 휴양",
  },
  // 🇻🇳 베트남 (2)
  {
    slug: "danang",
    name_ko: "다낭",
    name_en: "Da Nang",
    country_ko: "베트남",
    country_code: "VN",
    flag: "🇻🇳",
    iata: "DAD",
    category: "vietnam",
    baseline_krw: 480000,
    skyscanner_dest: "DAD",
    emoji: "🏖️",
    vibe: "가성비 휴양",
  },
  {
    slug: "phuquoc",
    name_ko: "푸꾸옥",
    name_en: "Phu Quoc",
    country_ko: "베트남",
    country_code: "VN",
    flag: "🇻🇳",
    iata: "PQC",
    category: "vietnam",
    baseline_krw: 580000,
    skyscanner_dest: "PQC",
    emoji: "🌴",
    vibe: "리조트 휴양",
  },
  // 🇹🇭 태국 (1)
  {
    slug: "bangkok",
    name_ko: "방콕",
    name_en: "Bangkok",
    country_ko: "태국",
    country_code: "TH",
    flag: "🇹🇭",
    iata: "BKK",
    category: "thailand",
    baseline_krw: 520000,
    skyscanner_dest: "BKKT",
    emoji: "🛕",
    vibe: "동남아 mainstream",
  },
];

export function getCityBySlug(slug: string): City | undefined {
  return CITIES.find((c) => c.slug === slug);
}

export const CATEGORY_LABELS: Record<City["category"], { ko: string; emoji: string }> = {
  domestic: { ko: "국내", emoji: "🇰🇷" },
  japan: { ko: "일본", emoji: "🇯🇵" },
  vietnam: { ko: "베트남", emoji: "🇻🇳" },
  thailand: { ko: "태국", emoji: "🇹🇭" },
};
