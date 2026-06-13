"use client";

import { useId, useState, type ReactNode } from "react";

type MatchDateGroupProps = {
  children: ReactNode;
  date: string;
  defaultOpen: boolean;
  matchCount: number;
};

export function MatchDateGroup({ children, date, defaultOpen, matchCount }: MatchDateGroupProps) {
  const [open, setOpen] = useState(defaultOpen);
  const contentId = useId();
  const matchLabel = matchCount === 1 ? "match" : "matches";

  return (
    <section className={`match-date-group ${open ? "is-open" : ""}`}>
      <button
        className="match-date-toggle"
        type="button"
        aria-expanded={open}
        aria-controls={contentId}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="match-date-heading">
          <h2>{date}</h2>
          <span>{matchCount} {matchLabel}</span>
        </span>
        <span className="match-date-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" focusable="false">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </span>
      </button>
      <div className="match-date-panel" id={contentId} aria-hidden={!open}>
        <div className="match-date-panel-inner">{children}</div>
      </div>
    </section>
  );
}
