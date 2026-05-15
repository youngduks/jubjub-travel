// Server Component — Sky-Scrapper baseline 실제 fetch
// 7일 ISR cache — quota 보호 (월 빌드 1~4회만 fetch trigger)

import { CITIES } from "@/lib/cities";
import { fetchAllBaselines } from "@/lib/baseline";
import HomeClient from "@/components/HomeClient";

export const revalidate = 604800; // 7일

export default async function HomePage() {
  const baselines = await fetchAllBaselines(CITIES);
  return <HomeClient cities={CITIES} baselines={baselines} />;
}
