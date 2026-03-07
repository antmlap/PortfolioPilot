"use client";

import { AlertCircle, RefreshCw } from "lucide-react";

interface ErrorStateProps {
  message?: string;
  onRetry: () => void;
}

export function ErrorState({ message = "Something went wrong.", onRetry }: ErrorStateProps) {
  return (
    <div className="glass rounded-2xl p-8 border border-coral/30 text-center">
      <div className="inline-flex w-12 h-12 rounded-full bg-coral/10 text-coral items-center justify-center mb-4">
        <AlertCircle className="w-6 h-6" />
      </div>
      <p className="text-slate-300 mb-4">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-medium transition-colors"
      >
        <RefreshCw className="w-4 h-4" />
        Try again
      </button>
    </div>
  );
}
