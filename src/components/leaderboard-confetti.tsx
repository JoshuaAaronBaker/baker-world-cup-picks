"use client";

import { useEffect, useRef } from "react";

const confettiColors = ["#f7b928", "#ef4743", "#11965d", "#246bfe", "#ffffff"];

export function LeaderboardConfetti() {
  const anchorRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) return;

    const card = anchorRef.current?.closest(".sole-first");
    const rect = card?.getBoundingClientRect();

    if (!rect) return;

    const origin = {
      x: (rect.left + rect.width / 2) / window.innerWidth,
      y: Math.max(rect.top + 6, 0) / window.innerHeight,
    };

    let cancelled = false;
    const timers: number[] = [];

    async function celebrate() {
      const { default: confetti } = await import("canvas-confetti");

      if (cancelled) return;

      confetti({
        angle: 90,
        colors: confettiColors,
        decay: 0.9,
        gravity: 0.75,
        origin,
        particleCount: 42,
        scalar: 0.72,
        spread: 58,
        startVelocity: 24,
        ticks: 140,
      });

      timers.push(
        window.setTimeout(() => {
          confetti({
            angle: 68,
            colors: confettiColors,
            decay: 0.9,
            gravity: 0.8,
            origin: { ...origin, x: Math.max(origin.x - 0.08, 0.05) },
            particleCount: 24,
            scalar: 0.62,
            spread: 48,
            startVelocity: 20,
            ticks: 120,
          });
        }, 180),
        window.setTimeout(() => {
          confetti({
            angle: 112,
            colors: confettiColors,
            decay: 0.9,
            gravity: 0.8,
            origin: { ...origin, x: Math.min(origin.x + 0.08, 0.95) },
            particleCount: 24,
            scalar: 0.62,
            spread: 48,
            startVelocity: 20,
            ticks: 120,
          });
        }, 320),
      );
    }

    void celebrate();

    return () => {
      cancelled = true;
      for (const timer of timers) window.clearTimeout(timer);
    };
  }, []);

  return <span ref={anchorRef} aria-hidden="true" className="leaderboard-confetti-anchor" />;
}
