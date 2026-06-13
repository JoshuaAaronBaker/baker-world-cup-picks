"use client";

import { useEffect, useState } from "react";
import { LOCK_BUFFER_MINUTES } from "@/lib/matches";

type MatchTimingProps = {
  kickoffAt: string;
  locked: boolean;
};

function formatLocalTime(kickoffAt: Date) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(kickoffAt);
}

function getCountdown(kickoffAt: Date, locked: boolean) {
  if (locked) return "Locked";

  const lockAt = kickoffAt.getTime() - LOCK_BUFFER_MINUTES * 60 * 1000;
  const minutesUntilLock = Math.ceil((lockAt - Date.now()) / (1000 * 60));

  if (minutesUntilLock <= 0) return "Locked";
  if (minutesUntilLock > 24 * 60) return null;

  const hours = Math.floor(minutesUntilLock / 60);
  const minutes = minutesUntilLock % 60;

  return hours > 0 ? `Locks in ${hours}h ${minutes}m` : `Locks in ${minutes}m`;
}

export function MatchTiming({ kickoffAt, locked }: MatchTimingProps) {
  const [label, setLabel] = useState(() => formatLocalTime(new Date(kickoffAt)));
  const [countdown, setCountdown] = useState<string | null>(null);

  useEffect(() => {
    const kickoffDate = new Date(kickoffAt);
    const update = () => {
      setLabel(formatLocalTime(kickoffDate));
      setCountdown(getCountdown(kickoffDate, locked));
    };

    update();
    const interval = window.setInterval(update, 30_000);

    return () => window.clearInterval(interval);
  }, [kickoffAt, locked]);

  return (
    <span>
      {label}
      {countdown ? <span className="lock-countdown"> · {countdown}</span> : null}
    </span>
  );
}
