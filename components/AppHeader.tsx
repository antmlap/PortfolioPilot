"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

interface AppHeaderProps {
  rightSlot?: React.ReactNode;
  className?: string;
}

export function AppHeader({ rightSlot, className }: AppHeaderProps) {
  const pathname = usePathname();
  const isPortfolio = pathname === "/portfolio";
  const isBrowse = pathname === "/browse";

  return (
    <header
      className={clsx(
        "border-b border-border bg-paper/95 backdrop-blur-sm sticky top-0 z-10",
        className
      )}
      role="banner"
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <a
            href="/"
            className="flex items-center gap-3 hover:opacity-80 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper rounded"
            aria-label="Gator Analyst home"
          >
            <img
              src="/logo.png"
              alt=""
              className="h-9 w-9 rounded-full object-cover [mix-blend-mode:darken]"
              width={36}
              height={36}
            />
            <span className="font-display text-xl font-semibold text-ink tracking-tight">
              Gator Analyst
            </span>
            <span className="text-mute text-sm hidden sm:inline">
              Stock discussion
            </span>
          </a>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className={clsx(
                "text-sm font-medium transition-colors whitespace-nowrap",
                !isPortfolio && !isBrowse ? "text-accent" : "text-mute hover:text-accent"
              )}
              aria-current={!isPortfolio && !isBrowse ? "page" : undefined}
            >
              Analyze
            </Link>
            <Link
              href="/browse"
              className={clsx(
                "text-sm font-medium transition-colors whitespace-nowrap",
                isBrowse ? "text-accent hover:text-accent-hover" : "text-mute hover:text-accent"
              )}
              aria-current={isBrowse ? "page" : undefined}
            >
              Browse
            </Link>
            <Link
              href="/portfolio"
              className={clsx(
                "text-sm font-medium transition-colors whitespace-nowrap",
                isPortfolio ? "text-accent" : "text-mute hover:text-accent"
              )}
              aria-current={isPortfolio ? "page" : undefined}
            >
              My Portfolio
            </Link>
            <Link
              href="/settings"
              className="text-sm font-medium text-mute hover:text-accent transition-colors whitespace-nowrap"
            >
              Settings
            </Link>
            <Link
              href="/login"
              className="text-sm font-medium text-mute hover:text-accent transition-colors whitespace-nowrap"
            >
              Log in
            </Link>
            {rightSlot != null && <div className="flex items-center">{rightSlot}</div>}
          </div>
        </div>
      </div>
    </header>
  );
}
