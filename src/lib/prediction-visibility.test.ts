import { MatchStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { canViewPrediction, canViewPredictionBreakdown } from "@/lib/prediction-visibility";

const unlockedMatch = {
  kickoffAt: new Date("2026-06-12T20:00:00.000Z"),
  status: MatchStatus.SCHEDULED,
  predictionsReopened: false,
};

const lockedMatch = {
  kickoffAt: new Date("2026-06-12T20:00:00.000Z"),
  status: MatchStatus.LOCKED,
  predictionsReopened: false,
};

describe("prediction visibility", () => {
  it("allows users to see their own future predictions", () => {
    expect(
      canViewPrediction({
        viewerUserId: "user-a",
        predictionUserId: "user-a",
        match: unlockedMatch,
        now: new Date("2026-06-12T18:00:00.000Z"),
      }),
    ).toBe(true);
  });

  it("hides future predictions from other logged-in users", () => {
    expect(
      canViewPrediction({
        viewerUserId: "user-b",
        predictionUserId: "user-a",
        match: unlockedMatch,
        now: new Date("2026-06-12T18:00:00.000Z"),
      }),
    ).toBe(false);
  });

  it("shows locked predictions to other logged-in users", () => {
    expect(
      canViewPrediction({
        viewerUserId: "user-b",
        predictionUserId: "user-a",
        match: lockedMatch,
        now: new Date("2026-06-12T18:00:00.000Z"),
      }),
    ).toBe(true);
  });

  it("blocks anonymous users from prediction breakdowns", () => {
    expect(
      canViewPredictionBreakdown({
        viewerUserId: null,
        match: lockedMatch,
      }),
    ).toBe(false);
  });

  it("allows logged-in users to view locked prediction breakdowns", () => {
    expect(
      canViewPredictionBreakdown({
        viewerUserId: "user-a",
        match: lockedMatch,
      }),
    ).toBe(true);
  });
});
