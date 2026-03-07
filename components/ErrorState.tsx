"use client";

import { AlertCircle, RefreshCw } from "lucide-react";

interface ErrorStateProps {
  message?: string;
  onRetry: () => void;
}

export function ErrorState({
  message = "Something went wrong.",
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center">
      <div className="inline-flex w-12 h-12 rounded-full bg-red-100 text-negative items-center justify-center mb-4">
        <AlertCircle className="w-6 h-6" />
      </div>
      <p className="text-ink mb-4">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-surface border border-border hover:border-mute text-ink text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
        aria-label="Retry loading"
      >
        <RefreshCw className="w-4 h-4" aria-hidden />
        Try again
      </button>
    </div>
  );
}
