"use client";

import { createContext, useContext, useLayoutEffect, useState } from "react";

export type ThemeId = "uf" | "ucf" | "fsu";

const THEME_STORAGE_KEY = "portfolio-pilot-theme";

const themes: { id: ThemeId; name: string; description: string }[] = [
  { id: "uf", name: "UF", description: "University of Florida — Orange & Blue" },
  { id: "ucf", name: "UCF", description: "University of Central Florida — Black & Gold" },
  { id: "fsu", name: "FSU", description: "Florida State — Garnet & Gold" },
];

type ThemeContextType = {
  theme: ThemeId;
  setTheme: (theme: ThemeId) => void;
  themes: typeof themes;
};

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>("uf");
  const [mounted, setMounted] = useState(false);

  useLayoutEffect(() => {
    const stored = localStorage.getItem(THEME_STORAGE_KEY) as ThemeId | null;
    const initial: ThemeId = stored && ["uf", "ucf", "fsu"].includes(stored) ? stored : "uf";
    setThemeState(initial);
    setMounted(true);
  }, []);

  const setTheme = (t: ThemeId) => {
    setThemeState(t);
    localStorage.setItem(THEME_STORAGE_KEY, t);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes }}>
      <div
        data-theme={theme}
        className="min-h-screen bg-paper text-ink"
        style={
          mounted
            ? undefined
            : { background: "var(--paper)", color: "var(--ink)" }
        }
      >
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
