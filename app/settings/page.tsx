"use client";

import { useTheme, type ThemeId } from "@/components/ThemeProvider";
import { AppHeader } from "@/components/AppHeader";

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
  const {
    theme,
    setTheme,
    themes,
    customBackground,
    customBoxColor,
    setCustomBackground,
    setCustomBoxColor,
    clearCustomColors,
    userName,
    setUserName,
  } = useTheme();

  return (
    <div className="min-h-screen bg-paper">
      <AppHeader />

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
            Your name
          </h2>
          <p className="text-mute text-sm">
            Advisors will address you by name and tailor their discussion to you.
          </p>
          <input
            type="text"
            value={userName ?? ""}
            onChange={(e) => setUserName(e.target.value || null)}
            placeholder="e.g. Alex"
            maxLength={50}
            className="w-full max-w-xs px-3 py-2 rounded-md bg-surface border border-border text-ink placeholder:text-mute focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
            aria-label="Your name"
          />
        </section>

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

        <section className="space-y-4">
          <h2 className="text-sm font-medium text-mute uppercase tracking-wider">
            Customize
          </h2>
          <p className="text-mute text-sm">
            Override the theme with your own colors. Cards and panels use the box color.
          </p>
          <div className="rounded-lg border-2 border-border bg-surface p-4 space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-sm font-medium text-ink">
                <input
                  type="color"
                  value={customBackground ?? "#e8f0fa"}
                  onChange={(e) => setCustomBackground(e.target.value)}
                  className="w-10 h-10 rounded-md border-2 border-border cursor-pointer bg-paper"
                  title="Background color"
                />
                Background
              </label>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-sm font-medium text-ink">
                <input
                  type="color"
                  value={customBoxColor ?? "#d4e4f4"}
                  onChange={(e) => setCustomBoxColor(e.target.value)}
                  className="w-10 h-10 rounded-md border-2 border-border cursor-pointer bg-paper"
                  title="Box / card color"
                />
                Boxes (cards & panels)
              </label>
            </div>
            {(customBackground || customBoxColor) && (
              <button
                type="button"
                onClick={clearCustomColors}
                className="text-sm font-medium text-mute hover:text-accent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 rounded"
              >
                Reset to theme default
              </button>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
