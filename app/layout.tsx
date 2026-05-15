import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "줍줍여행사 — 평소보다 싼 항공권 줍줍",
  description: "제주·도쿄·오사카·후쿠오카·오키나와·다낭·푸꾸옥·방콕 평월 대비 싼 항공권을 3 click 안에 찾기.",
  applicationName: "줍줍여행사",
  themeColor: "#0a0a0c",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
  openGraph: {
    type: "website",
    siteName: "줍줍여행사",
    title: "줍줍여행사 — 평소보다 싼 항공권",
    description: "도시 클릭 + 일정 클릭 = 끝. 평월 대비 싼 항공권 줍줍.",
    locale: "ko_KR",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-bg text-text font-sans">{children}</body>
    </html>
  );
}
