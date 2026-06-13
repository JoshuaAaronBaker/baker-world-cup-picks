"use client";

import type { ReactNode } from "react";
import { useState } from "react";

type MobileSiteNavProps = {
  brand: ReactNode;
  actions: ReactNode;
};

export function MobileSiteNav({ brand, actions }: MobileSiteNavProps) {
  const [open, setOpen] = useState(false);

  return (
    <nav className={`topbar ${open ? "menu-open" : ""}`} aria-label="Primary navigation">
      {brand}
      <button
        className="menu-toggle"
        type="button"
        aria-label={open ? "Close navigation menu" : "Open navigation menu"}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span aria-hidden="true" />
        <span aria-hidden="true" />
        <span aria-hidden="true" />
      </button>
      <div className="nav-actions">{actions}</div>
    </nav>
  );
}
