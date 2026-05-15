// Server Component — Sky-Scrapper baseline 실제 fetch
// 24h ISR cache (next: { revalidate: 86400 })

import { CITIES } from "@/lib/cities";
import { fetchAllBaselines } from "@/lib/baseline";
import HomeClient from "@/components/HomeClient";

// page-level revalidation (Vercel ISR)
export const revalidate = 86400; // 24h

export default async function HomePage() {
  const baselines = await fetchAllBaselines(CITIES);
  return <HomeClient cities={CITIES} baselines={baselines} />;
}
