"use client";

import { useEffect, useState } from "react";

type LocalMatchTimeProps = {
  fallback: string;
  kickoffAt: string;
};

export function formatLocalMatchTime(kickoffAt: Date) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(kickoffAt);
}

export function LocalMatchTime({ fallback, kickoffAt }: LocalMatchTimeProps) {
  const [label, setLabel] = useState(fallback);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setLabel(formatLocalMatchTime(new Date(kickoffAt)));
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [kickoffAt]);

  return <>{label}</>;
}
