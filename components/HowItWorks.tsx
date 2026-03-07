"use client";

import { Search, MessageSquare, BarChart3, CheckCircle } from "lucide-react";

const STEPS = [
  {
    icon: Search,
    title: "Enter a symbol",
    description: "Type any US ticker or pick one of the popular stocks.",
  },
  {
    icon: BarChart3,
    title: "See sentiment & history",
    description: "Current news sentiment and how often the stock outperformed it.",
  },
  {
    icon: MessageSquare,
    title: "Read the debate",
    description: "Five legendary investors weigh in with pros and cons.",
  },
  {
    icon: CheckCircle,
    title: "Make your call",
    description: "Compare viewpoints and metrics in one place.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="glass rounded-2xl p-8 border border-slate-700/50 scroll-mt-6">
      <h2 className="text-lg font-semibold text-white mb-6">How it works</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {STEPS.map((step, i) => (
          <div key={step.title} className="flex gap-4">
            <div className="shrink-0 w-10 h-10 rounded-xl bg-teal/10 text-teal flex items-center justify-center">
              <step.icon className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-mono text-slate-500">Step {i + 1}</span>
              <h3 className="font-semibold text-slate-200 mt-0.5">{step.title}</h3>
              <p className="text-sm text-slate-500 mt-1">{step.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
