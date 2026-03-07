"use client";

import { getAdvisorById, type CustomAdvisor } from "@/lib/advisors";
import type { DiscussionMessage } from "@/lib/discussion";
import { AdvisorAvatar } from "./AdvisorAvatar";
import clsx from "clsx";
import { ThumbsUp, ThumbsDown } from "lucide-react";

const advisorBorderColors: Record<string, string> = {
  buffett: "border-l-orange",
  lynch: "border-l-emerald-500",
  dalio: "border-l-accent",
  graham: "border-l-amber-600",
  wood: "border-l-rose-500",
};

function getBorderColor(advisorId: string): string {
  return advisorBorderColors[advisorId] ?? "border-l-violet-500";
}

interface DiscussionThreadProps {
  messages: DiscussionMessage[];
  customAdvisors?: CustomAdvisor[];
  className?: string;
}

export function DiscussionThread({ messages, customAdvisors = [], className }: DiscussionThreadProps) {
  return (
    <div
      className={clsx(
        "space-y-4 scrollbar-thin overflow-y-auto",
        className
      )}
    >
      {messages.map((msg, i) => {
        const advisor = getAdvisorById(msg.advisorId, customAdvisors);
        if (!advisor) return null;
        return (
          <div
            key={msg.id}
            className={clsx(
              "flex gap-3 pl-3 border-l-4 rounded-r-md py-2 pr-2 bg-paper/50 animate-slide-up",
              getBorderColor(msg.advisorId)
            )}
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <AdvisorAvatar advisorId={msg.advisorId} customAdvisors={customAdvisors} size="sm" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-sm text-ink">
                  {advisor.name}
                </span>
                <span className="text-xs text-mute">{advisor.title}</span>
                {msg.isPro !== undefined && (
                  <span
                    className={clsx(
                      "inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded font-medium",
                      msg.isPro
                        ? "bg-green-50 text-positive"
                        : "bg-red-50 text-negative"
                    )}
                  >
                    {msg.isPro ? (
                      <ThumbsUp className="w-3 h-3" />
                    ) : (
                      <ThumbsDown className="w-3 h-3" />
                    )}
                    {msg.isPro ? "Pro" : "Con"}
                  </span>
                )}
              </div>
              <p className="text-sm text-mute mt-1 leading-relaxed">
                {msg.content}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
