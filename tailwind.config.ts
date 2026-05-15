import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0a0a0c",
        "bg-card": "#15151a",
        "bg-hover": "#1f1f26",
        text: "#f5f5f7",
        "text-muted": "#a8a8b3",
        "text-dim": "#6e6e7a",
        line: "#2a2a32",
        "accent-blue": "#3b82f6",
        "accent-green": "#10b981",
        "accent-pink": "#ec4899",
        "accent-yellow": "#fbbf24",
        "accent-purple": "#a855f7",
      },
      fontFamily: {
        sans: ["-apple-system", "BlinkMacSystemFont", "Pretendard", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
