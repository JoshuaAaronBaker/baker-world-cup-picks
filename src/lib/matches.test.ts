import { MatchStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";
import {
  getLockCountdownLabel,
  getPredictionProgress,
  isMatchLocked,
  validateScoreValue,
  type MatchWithPrediction,
} from "@/lib/matches";

function formValue(value: string) {
  return value as FormDataEntryValue;
}

function match(overrides: Partial<MatchWithPrediction>): MatchWithPrediction {
  return {
    id: "match-1",
    tournamentId: "tournament-1",
    providerId: null,
    phase: "GROUP_STAGE",
    status: MatchStatus.SCHEDULED,
    matchday: null,
    kickoffAt: new Date("2026-06-12T20:00:00.000Z"),
    homeTeamId: "home",
    homeTeam: {
      id: "home",
      tournamentId: "tournament-1",
      name: "Home",
      countryCode: "HM",
      flagEmoji: "🏠",
      providerId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    awayTeamId: "away",
    awayTeam: {
      id: "away",
      tournamentId: "tournament-1",
      name: "Away",
      countryCode: "AW",
      flagEmoji: "✈️",
      providerId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    homePlaceholder: null,
    awayPlaceholder: null,
    homeScore: null,
    awayScore: null,
    advancingTeamId: null,
    manualOverrides: null,
    latestProviderPayload: null,
    predictionsReopened: false,
    predictions: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe("match prediction helpers", () => {
  it("validates complete integer score values from 0 to 20", () => {
    expect(validateScoreValue(formValue("0"))).toBe(0);
    expect(validateScoreValue(formValue("20"))).toBe(20);
    expect(validateScoreValue(formValue(""))).toBeNull();
    expect(validateScoreValue(formValue("2.5"))).toBeNull();
    expect(validateScoreValue(formValue("-1"))).toBeNull();
    expect(validateScoreValue(formValue("21"))).toBeNull();
  });

  it("locks predictions 5 minutes before kickoff", () => {
    const baseMatch = match({});

    expect(isMatchLocked(baseMatch, new Date("2026-06-12T19:54:59.000Z"))).toBe(false);
    expect(isMatchLocked(baseMatch, new Date("2026-06-12T19:55:00.000Z"))).toBe(true);
  });

  it("shows countdown labels only within 24 hours", () => {
    const baseMatch = match({});

    expect(getLockCountdownLabel(baseMatch, new Date("2026-06-11T19:54:00.000Z"))).toBeNull();
    expect(getLockCountdownLabel(baseMatch, new Date("2026-06-12T18:54:00.000Z"))).toBe(
      "Locks in 1h 1m",
    );
    expect(getLockCountdownLabel(baseMatch, new Date("2026-06-12T19:55:00.000Z"))).toBe(
      "Locked",
    );
  });

  it("counts progress against predictable matches only", () => {
    const predictedMatch = match({
      id: "predicted",
      predictions: [
        {
          id: "prediction-1",
          userId: "user-1",
          matchId: "predicted",
          homeScore: 1,
          awayScore: 0,
          predictedAdvancingTeamId: null,
          status: "VALID",
          pointsAwarded: null,
          exactScore: false,
          correctResult: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    });
    const unpredictedMatch = match({ id: "unpredicted" });
    const placeholderMatch = match({
      id: "placeholder",
      homeTeam: null,
      awayTeam: null,
      homeTeamId: null,
      awayTeamId: null,
      homePlaceholder: "Winner Group A",
      awayPlaceholder: "Runner-up Group B",
    });

    expect(getPredictionProgress([predictedMatch, unpredictedMatch, placeholderMatch])).toEqual({
      predicted: 1,
      available: 2,
    });
  });
});
