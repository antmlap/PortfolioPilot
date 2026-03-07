"use client";

import { ADVISORS, type AdvisorId } from "@/lib/advisors";
import type { DiscussionMessage } from "@/lib/discussion";
import { AdvisorAvatar } from "./AdvisorAvatar";
import clsx from "clsx";
import { ThumbsUp, ThumbsDown } from "lucide-react";

interface DiscussionThreadProps {
  messages: DiscussionMessage[];
  className?: string;
}

const advisorBorderColors: Record<AdvisorId, string> = {
  buffett: "border-l-gold",
  lynch: "border-l-mint",
  dalio: "border-l-teal",
  graham: "border-l-amber-600",
  wood: "border-l-coral",
};

export function DiscussionThread({ messages, className }: DiscussionThreadProps) {
  return (
    <div className={clsx("space-y-4 scrollbar-thin overflow-y-auto", className)}>
      {messages.map((msg, i) => {
        const advisor = ADVISORS[msg.advisorId];
        if (!advisor) return null;
        return (
          <div
            key={msg.id}
            className={clsx(
              "flex gap-3 pl-3 border-l-4 rounded-r-lg py-2 pr-2 bg-slate-900/50 animate-slide-up",
              advisorBorderColors[msg.advisorId]
            )}
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <AdvisorAvatar advisorId={msg.advisorId} size="sm" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-sm text-slate-200">{advisor.name}</span>
                <span className="text-xs text-slate-500">{advisor.title}</span>
                {msg.isPro !== undefined && (
                  <span
                    className={clsx(
                      "inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded",
                      msg.isPro ? "bg-emerald-500/20 text-mint" : "bg-red-500/20 text-coral"
                    )}
                  >
                    {msg.isPro ? <ThumbsUp className="w-3 h-3" /> : <ThumbsDown className="w-3 h-3" />}
                    {msg.isPro ? "Pro" : "Con"}
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-400 mt-1 leading-relaxed">{msg.content}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
