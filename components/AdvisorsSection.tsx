"use client";

import { ADVISORS, ADVISOR_IDS, type AdvisorId, type CustomAdvisor } from "@/lib/advisors";

const accentBorder: Record<string, string> = {
  buffett: "border-l-orange",
  lynch: "border-l-emerald-500",
  dalio: "border-l-accent",
  graham: "border-l-amber-600",
  wood: "border-l-rose-500",
};

function getAccentBorder(id: string): string {
  return accentBorder[id] ?? "border-l-violet-500";
}

interface AdvisorsSectionProps {
  /** When provided, only these built-in advisors are shown. */
  selectedIds?: AdvisorId[];
  /** When provided, these custom advisors are shown after built-in. */
  customAdvisors?: CustomAdvisor[];
}

export function AdvisorsSection({
  selectedIds,
  customAdvisors = [],
}: AdvisorsSectionProps = {}) {
  const builtInIds = selectedIds ?? ADVISOR_IDS;
  const displayList = [
    ...builtInIds.map((id) => ADVISORS[id]),
    ...customAdvisors,
  ].filter(Boolean);

  return (
    <section
      id="advisors"
      className="rounded-lg border-2 border-orange bg-orange-mute p-8 scroll-mt-6"
    >
      <h2 className="font-display text-lg font-semibold text-ink mb-2">
        Meet the advisors
      </h2>
      <p className="text-sm text-mute mb-6">
        Each agent responds in the style and philosophy of a legendary
        investor.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {displayList.map((a) => (
          <div
            key={a.id}
            className={`rounded-lg border-l-4 bg-paper/50 p-4 border-border ${getAccentBorder(a.id)}`}
          >
            <div className="text-2xl mb-2">{a.avatar}</div>
            <h3 className="font-medium text-ink text-sm">{a.name}</h3>
            <p className="text-xs text-mute mt-0.5">{a.title}</p>
            <p className="text-xs text-mute mt-2">{a.tagline}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
