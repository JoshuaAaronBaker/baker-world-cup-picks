import { describe, expect, it } from "vitest";
import { formatSyncStatus } from "@/lib/sync-status";

describe("sync status", () => {
  it("shows a neutral public label before any successful sync", () => {
    expect(formatSyncStatus(null)).toEqual({
      lastSuccessfulSyncAt: null,
      label: "Scores update nightly after match days.",
    });
  });

  it("shows only successful sync freshness details publicly", () => {
    const finishedAt = new Date("2026-06-13T06:30:00.000Z");
    const status = formatSyncStatus({ finishedAt });

    expect(status.lastSuccessfulSyncAt).toEqual(finishedAt);
    expect(status.label).toContain("Scores last updated");
    expect(status.label).not.toContain("FAILED");
    expect(status.label).not.toContain("error");
  });
});
