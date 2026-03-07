"use client";

export function MetricsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="glass rounded-xl p-4 animate-pulse">
          <div className="w-8 h-8 rounded-lg bg-slate-700 mb-3" />
          <div className="h-3 w-24 bg-slate-700 rounded mb-2" />
          <div className="h-6 w-16 bg-slate-700 rounded mb-1" />
          <div className="h-3 w-32 bg-slate-700/80 rounded" />
        </div>
      ))}
    </div>
  );
}

export function DiscussionSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex gap-3 pl-3 border-l-4 border-slate-700 rounded-r-lg py-2">
          <div className="w-10 h-10 rounded-full bg-slate-700 shrink-0 animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-32 bg-slate-700 rounded animate-pulse" />
            <div className="h-3 w-full bg-slate-700/80 rounded animate-pulse" />
            <div className="h-3 w-4/5 bg-slate-700/60 rounded animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SidebarSkeleton() {
  return (
    <div className="space-y-6">
      <div className="glass rounded-2xl p-6 animate-pulse">
        <div className="h-3 w-28 bg-slate-700 rounded mb-4" />
        <div className="h-2 w-full bg-slate-700 rounded mb-2" />
        <div className="h-2 w-3/4 bg-slate-700/80 rounded" />
      </div>
      <div className="glass rounded-2xl p-6 animate-pulse">
        <div className="h-3 w-36 bg-slate-700 rounded mb-4" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-4 w-full bg-slate-700/80 rounded" />
          ))}
        </div>
      </div>
      <div className="glass rounded-2xl p-6 animate-pulse">
        <div className="h-3 w-40 bg-slate-700 rounded mb-4" />
        <div className="h-[180px] w-full bg-slate-700/60 rounded" />
      </div>
    </div>
  );
}
