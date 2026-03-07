"use client";

import { ADVISORS, type AdvisorId } from "@/lib/advisors";
import clsx from "clsx";

interface AdvisorAvatarProps {
  advisorId: AdvisorId;
  size?: "sm" | "md" | "lg";
  showName?: boolean;
  isSpeaking?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: "w-10 h-10 text-lg",
  md: "w-14 h-14 text-2xl",
  lg: "w-20 h-20 text-3xl",
};

export function AdvisorAvatar({
  advisorId,
  size = "md",
  showName = false,
  isSpeaking = false,
  className,
}: AdvisorAvatarProps) {
  const advisor = ADVISORS[advisorId];
  if (!advisor) return null;

  const borderColor =
    advisorId === "buffett"
      ? "border-gold"
      : advisorId === "lynch"
        ? "border-mint"
        : advisorId === "dalio"
          ? "border-teal"
          : advisorId === "graham"
            ? "border-amber-600"
            : "border-coral";

  return (
    <div className={clsx("flex flex-col items-center gap-1", className)}>
      <div
        className={clsx(
          "rounded-full border-2 bg-slate-800 flex items-center justify-center shrink-0 transition-all duration-300",
          sizeClasses[size],
          borderColor,
          isSpeaking && "ring-2 ring-offset-2 ring-offset-void ring-teal shadow-lg shadow-teal/20"
        )}
      >
        {advisor.avatar}
      </div>
      {showName && (
        <span className="text-xs font-medium text-slate-400 max-w-[80px] truncate text-center">
          {advisor.name.split(" ").pop()}
        </span>
      )}
    </div>
  );
}
