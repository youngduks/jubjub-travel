// 형님 자주 가는 8개 도시 — 형님이 직접 지정
// 제주 / 도쿄·오사카·후쿠오카·오키나와 / 다낭·푸꾸옥 / 방콕

export type City = {
  slug: string;
  name_ko: string;
  name_en: string;
  country_ko: string;
  country_code: string; // ISO 3166-1 alpha-2
  flag: string;
  iata: string; // 도착 공항 IATA
  category: "domestic" | "japan" | "vietnam" | "thailand";
  /** Skyscanner 검색 URL 생성용 도시 키 */
  skyscanner_dest: string;
  emoji: string;
  vibe: string;
  /** 한국 출발 주요 항공사 — 한국 retail 일반 지식 (실 항공편은 Skyscanner) */
  carriers: string[];
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
    skyscanner_dest: "CJU",
    emoji: "🏝️",
    vibe: "주말 도피",
    carriers: ["대한", "아시아나", "제주", "티웨이", "진에어"],
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
    skyscanner_dest: "TYOA",
    emoji: "🗼",
    vibe: "도시 트립",
    carriers: ["대한", "아시아나", "JAL", "ANA", "제주", "피치"],
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
    skyscanner_dest: "OSAA",
    emoji: "🍜",
    vibe: "먹방 트립",
    carriers: ["대한", "아시아나", "제주", "티웨이", "피치"],
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
    skyscanner_dest: "FUK",
    emoji: "🍡",
    vibe: "가까운 일본",
    carriers: ["대한", "아시아나", "제주", "티웨이", "진에어"],
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
    skyscanner_dest: "OKA",
    emoji: "🌊",
    vibe: "일본 휴양",
    carriers: ["대한", "아시아나", "제주", "피치"],
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
    skyscanner_dest: "DAD",
    emoji: "🏖️",
    vibe: "가성비 휴양",
    carriers: ["대한", "비엣젯", "베트남", "제주", "티웨이"],
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
    skyscanner_dest: "PQC",
    emoji: "🌴",
    vibe: "리조트 휴양",
    carriers: ["대한", "비엣젯", "진에어"],
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
    skyscanner_dest: "BKKT",
    emoji: "🛕",
    vibe: "동남아 mainstream",
    carriers: ["대한", "아시아나", "타이항공", "진에어", "제주"],
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
