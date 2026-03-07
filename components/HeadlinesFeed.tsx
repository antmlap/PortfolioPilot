"use client";

interface Headline {
  text: string;
  score: number;
  date: string;
}

interface HeadlinesFeedProps {
  headlines: Headline[];
  className?: string;
}

function formatDateLabel(dateStr: string): string {
  const today = new Date().toISOString().slice(0, 10);
  if (dateStr === today) return "Today";
  try {
    const [y, m, d] = dateStr.split("-");
    const month = new Date(2000, parseInt(m, 10) - 1, 1).toLocaleString("en-US", { month: "short" });
    return `${month}-${d}-${y?.slice(-2) ?? ""}`;
  } catch {
    return dateStr;
  }
}

export function HeadlinesFeed({ headlines, className }: HeadlinesFeedProps) {
  return (
    <div className={className}>
      <h3 className="text-xs font-medium text-mute uppercase tracking-wider mb-3">
        Recent news
      </h3>
      <ul className="space-y-0 max-h-[320px] overflow-y-auto scrollbar-thin">
        {headlines.map((h, i) => (
          <li
            key={i}
            className="flex gap-3 items-baseline text-sm py-2.5 px-2 -mx-2 rounded-md border-b border-border last:border-0 hover:bg-orange-mute/50 transition-colors"
          >
            <span className="text-mute font-mono text-xs shrink-0 w-14">
              {formatDateLabel(h.date)}
            </span>
            <span className="flex-1 text-ink">{h.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
