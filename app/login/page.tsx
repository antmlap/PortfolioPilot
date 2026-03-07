"use client";

import { useState } from "react";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Does nothing — login doesn't work
  };

  return (
    <div className="min-h-screen bg-paper flex flex-col items-center justify-center px-4">
      <div className="rounded-lg border-2 border-border bg-surface p-8 w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <img
              src="/logo.png"
              alt=""
              className="h-10 w-10 rounded-full object-cover [mix-blend-mode:darken]"
              width={40}
              height={40}
            />
            <h1 className="text-2xl font-display font-semibold text-ink tracking-tight">
              Gator Analyst
            </h1>
          </div>
          <p className="text-sm text-mute mt-1">Sign in to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-ink mb-2"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-3 rounded-md bg-paper border border-border text-ink placeholder:text-mute focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
              autoComplete="off"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-ink mb-2"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-md bg-paper border border-border text-ink placeholder:text-mute focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
              autoComplete="off"
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 rounded-md bg-border text-mute text-sm font-medium cursor-not-allowed"
            disabled
          >
            Sign in (disabled)
          </button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-surface text-mute">or skip login</span>
          </div>
        </div>

        <Link
          href="/"
          className="flex items-center justify-center gap-2 w-full py-3 rounded-md bg-accent text-white font-semibold hover:bg-accent-hover transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
        >
          Go to Gator Analyst
        </Link>
        <p className="text-center">
          <Link href="/settings" className="text-sm text-mute hover:text-accent transition-colors">
            Settings
          </Link>
        </p>
      </div>
    </div>
  );
}
