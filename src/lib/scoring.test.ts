import { describe, expect, it } from "vitest";
import { scorePrediction } from "@/lib/scoring";

describe("scorePrediction", () => {
  it("awards 3 points for an exact score", () => {
    expect(
      scorePrediction({
        homeScore: 2,
        awayScore: 1,
        actualHomeScore: 2,
        actualAwayScore: 1,
        isKnockout: false,
      }),
    ).toEqual({
      pointsAwarded: 3,
      exactScore: true,
      correctResult: true,
    });
  });

  it("awards 1 point for the correct winner with a different score", () => {
    expect(
      scorePrediction({
        homeScore: 1,
        awayScore: 0,
        actualHomeScore: 2,
        actualAwayScore: 1,
        isKnockout: false,
      }),
    ).toMatchObject({
      pointsAwarded: 1,
      exactScore: false,
      correctResult: true,
    });
  });

  it("awards 0 points for the wrong result", () => {
    expect(
      scorePrediction({
        homeScore: 0,
        awayScore: 1,
        actualHomeScore: 2,
        actualAwayScore: 1,
        isKnockout: false,
      }),
    ).toMatchObject({
      pointsAwarded: 0,
      exactScore: false,
      correctResult: false,
    });
  });

  it("uses the advancing team for knockout matches drawn after extra time", () => {
    expect(
      scorePrediction({
        homeScore: 1,
        awayScore: 1,
        actualHomeScore: 2,
        actualAwayScore: 2,
        isKnockout: true,
        predictedAdvancingTeamId: "team-a",
        actualAdvancingTeamId: "team-a",
      }),
    ).toMatchObject({
      pointsAwarded: 1,
      exactScore: false,
      correctResult: true,
    });
  });

  it("does not award a knockout draw result without the correct advancer", () => {
    expect(
      scorePrediction({
        homeScore: 1,
        awayScore: 1,
        actualHomeScore: 2,
        actualAwayScore: 2,
        isKnockout: true,
        predictedAdvancingTeamId: "team-b",
        actualAdvancingTeamId: "team-a",
      }),
    ).toMatchObject({
      pointsAwarded: 0,
      exactScore: false,
      correctResult: false,
    });
  });
});
