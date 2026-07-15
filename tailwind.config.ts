import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0D0D0D",
        card: "#181818",
        foreground: "#F7F5F2",
        gold: {
          DEFAULT: "#D8B55B",
          light: "#E8CD8A",
          dark: "#B8923F",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "serif"],
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },
      boxShadow: {
        soft: "0 8px 40px -12px rgba(0, 0, 0, 0.5)",
        "soft-lg": "0 20px 60px -15px rgba(0, 0, 0, 0.6)",
        gold: "0 8px 30px -8px rgba(216, 181, 91, 0.35)",
      },
      backgroundImage: {
        "gold-gradient": "linear-gradient(135deg, #E8CD8A 0%, #D8B55B 50%, #B8923F 100%)",
        "radial-fade": "radial-gradient(circle at 50% 0%, rgba(216,181,91,0.08), transparent 60%)",
      },
      animation: {
        "fade-up": "fadeUp 0.8s ease forwards",
        shimmer: "shimmer 2.5s linear infinite",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
