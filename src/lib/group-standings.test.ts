import { MatchStatus, type Team } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { calculateGroupStandings } from "@/lib/group-standings";

function team(id: string, name: string, countryCode: string): Team {
  return {
    countryCode,
    createdAt: new Date(),
    flagEmoji: "🏁",
    id,
    name,
    providerId: id,
    tournamentId: "tournament",
    updatedAt: new Date(),
  };
}

describe("calculateGroupStandings", () => {
  it("builds group tables from final group-stage matches", () => {
    const usa = team("usa", "United States", "USA");
    const aus = team("aus", "Australia", "AUS");
    const tur = team("tur", "Türkiye", "TUR");
    const par = team("par", "Paraguay", "PAR");

    const standings = calculateGroupStandings([
      {
        awayScore: 1,
        awayTeam: par,
        homeScore: 4,
        homeTeam: usa,
        latestProviderPayload: { group: "GROUP_D" },
        status: MatchStatus.FINAL,
      },
      {
        awayScore: 0,
        awayTeam: tur,
        homeScore: 2,
        homeTeam: aus,
        latestProviderPayload: { group: "GROUP_D" },
        status: MatchStatus.FINAL,
      },
    ]);

    expect(standings).toEqual([
      {
        group: "GROUP_D",
        label: "Group D",
        rows: [
          expect.objectContaining({
            draws: 0,
            goalDifference: 3,
            goalsAgainst: 1,
            goalsFor: 4,
            losses: 0,
            played: 1,
            points: 3,
            position: 1,
            team: expect.objectContaining({ name: "United States" }),
            wins: 1,
          }),
          expect.objectContaining({
            goalDifference: 2,
            position: 2,
            team: expect.objectContaining({ name: "Australia" }),
          }),
          expect.objectContaining({
            goalDifference: -2,
            points: 0,
            position: 3,
            team: expect.objectContaining({ name: "Türkiye" }),
          }),
          expect.objectContaining({
            goalDifference: -3,
            points: 0,
            position: 4,
            team: expect.objectContaining({ name: "Paraguay" }),
          }),
        ],
      },
    ]);
  });

  it("uses display flag overrides for subdivision teams", () => {
    const england = team("eng", "England", "ENG");
    const croatia = team("cro", "Croatia", "CRO");

    england.flagEmoji = "🏴";

    const standings = calculateGroupStandings([
      {
        awayScore: null,
        awayTeam: croatia,
        homeScore: null,
        homeTeam: england,
        latestProviderPayload: { group: "GROUP_L" },
        status: MatchStatus.SCHEDULED,
      },
    ]);

    expect(standings[0].rows.find((row) => row.team.countryCode === "ENG")?.team.flagEmoji).toBe(
      "\u{1F3F4}\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F}",
    );
  });

  it("uses the latest provider score for active matches without awarding prediction points", () => {
    const ivoryCoast = team("civ", "Ivory Coast", "CIV");
    const ecuador = team("ecu", "Ecuador", "ECU");

    const standings = calculateGroupStandings([
      {
        awayScore: null,
        awayTeam: ecuador,
        homeScore: null,
        homeTeam: ivoryCoast,
        latestProviderPayload: {
          group: "GROUP_G",
          score: { fullTime: { away: 0, home: 1 } },
          status: "IN_PLAY",
        },
        status: MatchStatus.LOCKED,
      },
    ]);

    expect(standings[0].rows).toEqual([
      expect.objectContaining({
        goalsAgainst: 0,
        goalsFor: 1,
        played: 1,
        points: 3,
        team: expect.objectContaining({ name: "Ivory Coast" }),
        wins: 1,
      }),
      expect.objectContaining({
        goalsAgainst: 1,
        goalsFor: 0,
        losses: 1,
        played: 1,
        points: 0,
        team: expect.objectContaining({ name: "Ecuador" }),
      }),
    ]);
  });
});
