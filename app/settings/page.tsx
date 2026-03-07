"use client";

import Link from "next/link";
import { useTheme, type ThemeId } from "@/components/ThemeProvider";

function ThemeCard({
  id,
  name,
  description,
  selected,
  onSelect,
}: {
  id: ThemeId;
  name: string;
  description: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full text-left rounded-lg border-2 p-4 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper ${
        selected
          ? "border-orange bg-orange-mute"
          : "border-border bg-surface hover:border-orange/50"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-semibold text-ink">{name}</p>
          <p className="text-sm text-mute mt-0.5">{description}</p>
        </div>
        <div
          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
            selected ? "border-orange bg-orange" : "border-border"
          }`}
        >
          {selected && (
            <span className="text-[10px] text-white font-bold">✓</span>
          )}
        </div>
      </div>
    </button>
  );
}

export default function SettingsPage() {
  const { theme, setTheme, themes } = useTheme();

  return (
    <div className="min-h-screen bg-paper">
      <header
        className="border-b border-border bg-paper/95 backdrop-blur-sm sticky top-0 z-10"
        role="banner"
      >
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-3 font-display text-xl font-semibold text-ink tracking-tight hover:opacity-80 transition-opacity"
            >
              <img
                src="/logo.png"
                alt=""
                className="h-9 w-auto object-contain [mix-blend-mode:darken]"
                width={36}
                height={36}
              />
              Portfolio Pilot
            </Link>
            <Link
              href="/"
              className="text-sm font-medium text-mute hover:text-accent transition-colors"
            >
              ← Back
            </Link>
          </div>
        </div>
      </header>

      <main
        id="main"
        className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8"
      >
        <div>
          <h1 className="text-2xl font-display font-semibold text-ink">
            Settings
          </h1>
          <p className="text-mute mt-1">Customize your experience</p>
        </div>

        <section className="space-y-4">
          <h2 className="text-sm font-medium text-mute uppercase tracking-wider">
            Theme
          </h2>
          <div className="space-y-3">
            {themes.map((t) => (
              <ThemeCard
                key={t.id}
                id={t.id}
                name={t.name}
                description={t.description}
                selected={theme === t.id}
                onSelect={() => setTheme(t.id)}
              />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
