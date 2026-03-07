import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: "#e5ecf5",
        surface: "#d4dce8",
        ink: "#1a1a1a",
        mute: "#5a6376",
        border: "#b8c5d8",
        accent: {
          DEFAULT: "#0021A5",
          hover: "#001a85",
          mute: "#dae2f0",
        },
        orange: {
          DEFAULT: "#FA4616",
          hover: "#e03d12",
          mute: "#fef0eb",
        },
        positive: "#0d6b4c",
        negative: "#b91c1c",
        neutral: "#525252",
      },
      fontFamily: {
        display: ["var(--font-serif)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      animation: {
        "slide-up": "slide-up 0.3s ease-out",
      },
      keyframes: {
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
