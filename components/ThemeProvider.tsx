"use client";

import { createContext, useContext, useLayoutEffect, useState } from "react";

export type ThemeId = "uf" | "ucf" | "fsu" | "fau" | "usf";

const THEME_STORAGE_KEY = "portfolio-pilot-theme";
const CUSTOM_BG_KEY = "portfolio-pilot-custom-bg";
const CUSTOM_BOX_KEY = "portfolio-pilot-custom-box";

const themes: { id: ThemeId; name: string; description: string }[] = [
  { id: "uf", name: "UF", description: "University of Florida — Orange & Blue" },
  { id: "ucf", name: "UCF", description: "University of Central Florida — Black & Gold" },
  { id: "fsu", name: "FSU", description: "Florida State — Garnet & Gold" },
  { id: "fau", name: "FAU", description: "Florida Atlantic — Blue & Red" },
  { id: "usf", name: "USF", description: "University of South Florida — Green & Gold" },
];

type ThemeContextType = {
  theme: ThemeId;
  setTheme: (theme: ThemeId) => void;
  themes: typeof themes;
  customBackground: string | null;
  customBoxColor: string | null;
  setCustomBackground: (value: string | null) => void;
  setCustomBoxColor: (value: string | null) => void;
  clearCustomColors: () => void;
};

const ThemeContext = createContext<ThemeContextType | null>(null);

function parseHex(s: string | null): string | null {
  if (!s || typeof s !== "string") return null;
  const trimmed = s.trim();
  if (/^#[0-9A-Fa-f]{6}$/.test(trimmed)) return trimmed;
  if (/^[0-9A-Fa-f]{6}$/.test(trimmed)) return "#" + trimmed;
  return null;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>("uf");
  const [mounted, setMounted] = useState(false);
  const [customBackground, setCustomBackgroundState] = useState<string | null>(null);
  const [customBoxColor, setCustomBoxColorState] = useState<string | null>(null);

  useLayoutEffect(() => {
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY) as ThemeId | null;
    const initialTheme = storedTheme && ["uf", "ucf", "fsu", "fau", "usf"].includes(storedTheme) ? storedTheme : "uf";
    setThemeState(initialTheme);
    const bg = localStorage.getItem(CUSTOM_BG_KEY);
    const box = localStorage.getItem(CUSTOM_BOX_KEY);
    setCustomBackgroundState(parseHex(bg));
    setCustomBoxColorState(parseHex(box));
    setMounted(true);
  }, []);

  const setTheme = (t: ThemeId) => {
    setThemeState(t);
    localStorage.setItem(THEME_STORAGE_KEY, t);
  };

  const setCustomBackground = (value: string | null) => {
    const hex = parseHex(value);
    setCustomBackgroundState(hex);
    if (hex) localStorage.setItem(CUSTOM_BG_KEY, hex);
    else localStorage.removeItem(CUSTOM_BG_KEY);
  };

  const setCustomBoxColor = (value: string | null) => {
    const hex = parseHex(value);
    setCustomBoxColorState(hex);
    if (hex) localStorage.setItem(CUSTOM_BOX_KEY, hex);
    else localStorage.removeItem(CUSTOM_BOX_KEY);
  };

  const clearCustomColors = () => {
    setCustomBackgroundState(null);
    setCustomBoxColorState(null);
    localStorage.removeItem(CUSTOM_BG_KEY);
    localStorage.removeItem(CUSTOM_BOX_KEY);
  };

  const customStyle: React.CSSProperties = mounted
    ? {
        ...(customBackground && { ["--paper" as string]: customBackground }),
        ...(customBoxColor && { ["--surface" as string]: customBoxColor }),
      }
    : {};

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        themes,
        customBackground,
        customBoxColor,
        setCustomBackground,
        setCustomBoxColor,
        clearCustomColors,
      }}
    >
      <div
        data-theme={theme}
        className="min-h-screen bg-paper text-ink"
        style={
          mounted
            ? { ...customStyle, ...(customBackground && { background: customBackground }) }
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
