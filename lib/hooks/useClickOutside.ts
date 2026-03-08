"use client";

import { type RefObject, useEffect } from "react";

/**
 * Run a callback when the user clicks outside the given element.
 */
export function useClickOutside(
  ref: RefObject<HTMLElement | null>,
  onOutside: () => void
): void {
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onOutside();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [ref, onOutside]);
}
