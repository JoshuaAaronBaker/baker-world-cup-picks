import { AuditAction, MatchPhase, MatchStatus, PrismaClient, UserRole } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  mapFootballDataStage,
  mapFootballDataStatus,
  syncFootballDataPayload,
  syncFootballDataWorldCup,
  type FootballDataMatchesPayload,
} from "@/lib/providers/football-data";

const prisma = new PrismaClient();
const testSlugPrefix = "football-data-test-";

const payload: FootballDataMatchesPayload = {
  matches: [
    {
      id: 101,
      utcDate: "2026-06-12T19:00:00Z",
      status: "FINISHED",
      matchday: 1,
      stage: "GROUP_STAGE",
      homeTeam: { id: 1, name: "Mexico", tla: "MEX" },
      awayTeam: { id: 2, name: "South Africa", tla: "RSA" },
      score: { winner: "HOME_TEAM", fullTime: { home: 2, away: 1 } },
    },
    {
      id: 102,
      utcDate: "2026-07-05T22:00:00Z",
      status: "TIMED",
      matchday: null,
      stage: "LAST_32",
      homeTeam: { id: null, name: null },
      awayTeam: { id: null, name: null },
      score: { winner: null, fullTime: { home: null, away: null } },
    },
  ],
};

beforeEach(async () => {
  await prisma.auditLog.deleteMany({
    where: {
      OR: [
        { targetId: { startsWith: "sync-test-" } },
        { actor: { username: { startsWith: "sync_admin_" } } },
      ],
    },
  });
  await prisma.match.deleteMany({ where: { tournament: { slug: { startsWith: testSlugPrefix } } } });
  await prisma.team.deleteMany({ where: { tournament: { slug: { startsWith: testSlugPrefix } } } });
  await prisma.tournament.deleteMany({ where: { slug: { startsWith: testSlugPrefix } } });
  await prisma.syncRun.deleteMany({ where: { provider: "football-data" } });
  await prisma.user.deleteMany({ where: { username: { startsWith: "sync_admin_" } } });
});

describe("football-data provider", () => {
  it("maps provider stages and statuses into internal enums", () => {
    expect(mapFootballDataStage("LAST_32")).toBe(MatchPhase.ROUND_OF_32);
    expect(mapFootballDataStage("LAST_16")).toBe(MatchPhase.ROUND_OF_16);
    expect(mapFootballDataStage("QUARTER_FINALS")).toBe(MatchPhase.QUARTER_FINAL);
    expect(mapFootballDataStatus("FINISHED")).toBe(MatchStatus.FINAL);
    expect(mapFootballDataStatus("IN_PLAY")).toBe(MatchStatus.LOCKED);
    expect(mapFootballDataStatus("POSTPONED")).toBe(MatchStatus.POSTPONED);
    expect(mapFootballDataStatus("CANCELLED")).toBe(MatchStatus.CANCELLED);
    expect(mapFootballDataStatus("SUSPENDED")).toBe(MatchStatus.ABANDONED);
  });

  it("imports fixtures, final results, teams, and latest raw payloads", async () => {
    const result = await syncFootballDataPayload(payload, {
      tournamentSlug: `${testSlugPrefix}${crypto.randomUUID()}`,
      tournamentName: "Provider Test Cup",
      active: false,
    });

    const mexico = await prisma.team.findFirstOrThrow({ where: { providerId: "1" } });
    const finalMatch = await prisma.match.findUniqueOrThrow({ where: { providerId: "101" } });
    const timedMatch = await prisma.match.findUniqueOrThrow({ where: { providerId: "102" } });

    expect(result.teamsImported).toBe(2);
    expect(result.matchesImported).toBe(2);
    expect(mexico.name).toBe("Mexico");
    expect(finalMatch.status).toBe(MatchStatus.FINAL);
    expect(finalMatch.homeScore).toBe(2);
    expect(finalMatch.awayScore).toBe(1);
    expect(finalMatch.latestProviderPayload).toMatchObject({ id: 101, status: "FINISHED" });
    expect(timedMatch.phase).toBe(MatchPhase.ROUND_OF_32);
    expect(timedMatch.homePlaceholder).toBe("Home TBD");
  });

  it("scores predictions after a final score sync", async () => {
    const tournamentSlug = `${testSlugPrefix}${crypto.randomUUID()}`;
    const firstPayload: FootballDataMatchesPayload = {
      matches: [
        {
          ...payload.matches[0],
          status: "TIMED",
          score: { winner: null, fullTime: { home: null, away: null } },
        },
      ],
    };
    await syncFootballDataPayload(firstPayload, {
      tournamentSlug,
      tournamentName: "Provider Test Cup",
      active: false,
    });
    const match = await prisma.match.findUniqueOrThrow({ where: { providerId: "101" } });
    const user = await prisma.user.create({
      data: {
        username: `sync_admin_${crypto.randomUUID()}`,
        normalizedUsername: `sync_admin_${crypto.randomUUID()}`,
        passwordHash: "hash",
      },
    });

    await prisma.prediction.create({
      data: {
        userId: user.id,
        matchId: match.id,
        homeScore: 2,
        awayScore: 1,
      },
    });

    await syncFootballDataPayload(payload, {
      tournamentSlug,
      tournamentName: "Provider Test Cup",
      active: false,
    });

    const prediction = await prisma.prediction.findFirstOrThrow({ where: { userId: user.id } });

    expect(prediction.pointsAwarded).toBe(3);
    expect(prediction.exactScore).toBe(true);
  });

  it("preserves manual overrides during provider sync", async () => {
    const tournamentSlug = `${testSlugPrefix}${crypto.randomUUID()}`;
    const firstImport = await syncFootballDataPayload(payload, {
      tournamentSlug,
      tournamentName: "Provider Test Cup",
      active: false,
    });
    const match = await prisma.match.findUniqueOrThrow({ where: { providerId: "101" } });
    const overriddenKickoff = new Date("2026-06-13T19:00:00Z");

    await prisma.match.update({
      where: { id: match.id },
      data: {
        kickoffAt: overriddenKickoff,
        homeScore: 4,
        manualOverrides: { kickoffAt: true, homeScore: true },
      },
    });

    await syncFootballDataPayload(
      {
        matches: [
          {
            ...payload.matches[0],
            utcDate: "2026-06-14T19:00:00Z",
            score: { winner: "AWAY_TEAM", fullTime: { home: 0, away: 3 } },
          },
        ],
      },
      {
        tournamentSlug,
        tournamentName: "Provider Test Cup",
        active: false,
      },
    );

    const updatedMatch = await prisma.match.findUniqueOrThrow({ where: { providerId: "101" } });

    expect(firstImport.tournamentId).toBeTruthy();
    expect(updatedMatch.kickoffAt).toEqual(overriddenKickoff);
    expect(updatedMatch.homeScore).toBe(4);
    expect(updatedMatch.awayScore).toBe(3);
  });

  it("records failed sync runs and audit logs when the provider request fails", async () => {
    const admin = await prisma.user.create({
      data: {
        username: `sync_admin_${crypto.randomUUID()}`,
        normalizedUsername: `sync_admin_${crypto.randomUUID()}`,
        passwordHash: "hash",
        role: UserRole.ADMIN,
      },
    });
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      status: 429,
    } as Response);

    await expect(syncFootballDataWorldCup({ actorId: admin.id })).rejects.toThrow(
      "football-data request failed with 429.",
    );

    const syncRun = await prisma.syncRun.findFirstOrThrow({ where: { provider: "football-data" } });
    const audit = await prisma.auditLog.findFirstOrThrow({
      where: { action: AuditAction.SYNC_FAILED, actorId: admin.id },
    });

    expect(syncRun.status).toBe("FAILED");
    expect(syncRun.message).toBe("football-data request failed with 429.");
    expect(audit.metadata).toMatchObject({ message: "football-data request failed with 429." });

    fetchSpy.mockRestore();
  });
});
