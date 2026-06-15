import { MatchStatus } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import { groupMatchesForPredictions } from "@/app/predictions/page";

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

vi.mock("@/components/site-nav", () => ({
  SiteNav: () => null,
}));

vi.mock("@/lib/auth", () => ({
  requireUser: vi.fn(),
}));

vi.mock("@/lib/leaderboard", () => ({
  formatLeaderboardPlacement: vi.fn(),
  getLeaderboard: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    prediction: {
      aggregate: vi.fn(),
    },
  },
}));

function match(id: string, kickoffAt: string, status: MatchStatus = MatchStatus.FINAL) {
  return {
    id,
    kickoffAt: new Date(kickoffAt),
    status,
    predictionsReopened: false,
  };
}

describe("groupMatchesForPredictions", () => {
  it("collapses locked past matches into one completed group and keeps current/upcoming dates separate", () => {
    const groups = groupMatchesForPredictions([
      match("past-1", "2026-06-12T19:00:00.000Z"),
      match("past-2", "2026-06-13T19:00:00.000Z"),
      match("today", "2026-06-14T19:00:00.000Z", MatchStatus.SCHEDULED),
      match("future", "2026-06-15T19:00:00.000Z", MatchStatus.SCHEDULED),
    ], new Date("2026-06-14T16:00:00.000Z"));

    expect(groups).toMatchObject([
      {
        defaultOpen: false,
        label: "Completed matches",
        matches: [{ id: "past-1" }, { id: "past-2" }],
      },
      {
        defaultOpen: true,
        label: "Sun, Jun 14",
        matches: [{ id: "today" }],
      },
      {
        defaultOpen: true,
        label: "Mon, Jun 15",
        matches: [{ id: "future" }],
      },
    ]);
  });
});
