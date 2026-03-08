"use client";

import { getAdvisorById, getAdvisorBorderClass, type CustomAdvisor } from "@/lib/advisors";
import clsx from "clsx";

interface AdvisorAvatarProps {
  advisorId: string;
  customAdvisors?: CustomAdvisor[];
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
  customAdvisors = [],
  size = "md",
  showName = false,
  isSpeaking = false,
  className,
}: AdvisorAvatarProps) {
  const advisor = getAdvisorById(advisorId, customAdvisors);
  if (!advisor) return null;

  return (
    <div className={clsx("flex flex-col items-center gap-1", className)}>
      <div
        className={clsx(
          "rounded-full border-2 bg-surface flex items-center justify-center shrink-0 transition-all duration-300",
          sizeClasses[size],
          getAdvisorBorderClass(advisorId),
          isSpeaking &&
            "ring-2 ring-offset-2 ring-offset-paper ring-accent shadow-md"
        )}
      >
        {advisor.avatar}
      </div>
      {showName && (
        <span className="text-xs font-medium text-mute max-w-[80px] truncate text-center">
          {advisor.name.split(" ").pop()}
        </span>
      )}
    </div>
  );
}
