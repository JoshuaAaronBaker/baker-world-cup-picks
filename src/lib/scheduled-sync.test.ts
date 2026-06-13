import { MatchPhase, MatchStatus, PrismaClient } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { runNightlyScoreSync } from "@/lib/scheduled-sync";

const prisma = new PrismaClient();
const testSlugPrefix = "scheduled-sync-test-";

beforeEach(async () => {
  await prisma.prediction.deleteMany({ where: { match: { tournament: { slug: { startsWith: testSlugPrefix } } } } });
  await prisma.match.deleteMany({ where: { tournament: { slug: { startsWith: testSlugPrefix } } } });
  await prisma.team.deleteMany({ where: { tournament: { slug: { startsWith: testSlugPrefix } } } });
  await prisma.tournament.deleteMany({ where: { slug: { startsWith: testSlugPrefix } } });
});

async function createScheduledMatch(kickoffAt: Date) {
  const tournament = await prisma.tournament.create({
    data: {
      name: "Scheduled Sync Test",
      slug: `${testSlugPrefix}${crypto.randomUUID()}`,
      year: 2026,
      active: true,
    },
  });
  const home = await prisma.team.create({
    data: { tournamentId: tournament.id, name: "Home", countryCode: "HOM", flagEmoji: "" },
  });
  const away = await prisma.team.create({
    data: { tournamentId: tournament.id, name: "Away", countryCode: "AWY", flagEmoji: "" },
  });
  const match = await prisma.match.create({
    data: {
      tournamentId: tournament.id,
      providerId: `scheduled-${crypto.randomUUID()}`,
      phase: MatchPhase.GROUP_STAGE,
      status: MatchStatus.SCHEDULED,
      kickoffAt,
      homeTeamId: home.id,
      awayTeamId: away.id,
    },
  });

  return { tournament, home, away, match };
}

describe("nightly scheduled sync", () => {
  it("runs on active match days in Pacific time", async () => {
    await createScheduledMatch(new Date("2026-06-12T19:00:00.000Z"));
    const syncRunner = vi.fn().mockResolvedValue({ matchesImported: 1 });

    const result = await runNightlyScoreSync({
      now: new Date("2026-06-13T06:30:00.000Z"),
      syncRunner,
    });

    expect(syncRunner).toHaveBeenCalledOnce();
    expect(result).toEqual({ status: "synced", result: { matchesImported: 1 } });
  });

  it("skips when the Pacific day has no active matches", async () => {
    await createScheduledMatch(new Date("2026-06-12T19:00:00.000Z"));
    const syncRunner = vi.fn().mockResolvedValue({ matchesImported: 1 });

    const result = await runNightlyScoreSync({
      now: new Date("2026-08-01T06:30:00.000Z"),
      syncRunner,
    });

    expect(syncRunner).not.toHaveBeenCalled();
    expect(result).toEqual({ status: "skipped", reason: "not-a-match-day" });
  });
});
