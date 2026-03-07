"use client";

import { ADVISORS, ADVISOR_IDS } from "@/lib/advisors";
import clsx from "clsx";

const accentBorder: Record<string, string> = {
  buffett: "border-gold",
  lynch: "border-mint",
  dalio: "border-teal",
  graham: "border-amber-600",
  wood: "border-coral",
};

export function AdvisorsSection() {
  return (
    <section id="advisors" className="glass rounded-2xl p-8 border border-slate-700/50 scroll-mt-6">
      <h2 className="text-lg font-semibold text-white mb-2">Meet the advisors</h2>
      <p className="text-sm text-slate-500 mb-6">
        Each agent responds in the style and philosophy of a legendary investor.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {ADVISOR_IDS.map((id) => {
          const a = ADVISORS[id];
          return (
            <div
              key={a.id}
              className={clsx(
                "rounded-xl border-l-4 bg-slate-800/50 p-4",
                accentBorder[a.id] || "border-slate-600"
              )}
            >
              <div className="text-2xl mb-2">{a.avatar}</div>
              <h3 className="font-semibold text-slate-200 text-sm">{a.name}</h3>
              <p className="text-xs text-slate-500 mt-0.5">{a.title}</p>
              <p className="text-xs text-slate-400 mt-2">{a.tagline}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
