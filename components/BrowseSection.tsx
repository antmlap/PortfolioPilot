"use client";

import clsx from "clsx";
import { LucideIcon } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";

interface BrowseSectionProps {
  title: string;
  icon: LucideIcon;
  children: React.ReactNode;
  className?: string;
}

export function BrowseSection({ title, icon: Icon, children, className }: BrowseSectionProps) {
  const { customBoxColor } = useTheme();
  const boxStyle = customBoxColor ? { backgroundColor: customBoxColor } : undefined;
  return (
    <section
      className={clsx(
        "rounded-lg border-2 border-orange overflow-hidden",
        !customBoxColor && "bg-orange-mute",
        className
      )}
      style={boxStyle}
      aria-labelledby={`browse-${title.replace(/\s+/g, "-").toLowerCase()}`}
    >
      <h2
        id={`browse-${title.replace(/\s+/g, "-").toLowerCase()}`}
        className={clsx(
          "flex items-center gap-1.5 px-3 py-2 border-b border-orange/30 text-xs font-medium text-mute uppercase tracking-wider",
          !customBoxColor && "bg-orange-mute"
        )}
        style={boxStyle}
      >
        <Icon className="w-3.5 h-3.5 text-orange shrink-0" aria-hidden />
        {title}
      </h2>
      <div className="px-1 py-0.5">{children}</div>
    </section>
  );
}
