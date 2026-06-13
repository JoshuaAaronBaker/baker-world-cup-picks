import { MatchPhase, MatchStatus, PrismaClient } from "@prisma/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getPublicTodaysMatches } from "@/lib/public-matches";

const prisma = new PrismaClient();
const testSlugPrefix = "public-matches-test-";

beforeEach(async () => {
  await cleanupPublicMatchesTestData();
});

afterEach(async () => {
  await cleanupPublicMatchesTestData();
});

async function cleanupPublicMatchesTestData() {
  await prisma.match.deleteMany({ where: { tournament: { slug: { startsWith: testSlugPrefix } } } });
  await prisma.team.deleteMany({ where: { tournament: { slug: { startsWith: testSlugPrefix } } } });
  await prisma.tournament.deleteMany({ where: { slug: { startsWith: testSlugPrefix } } });
}

async function createPublicMatch(status: MatchStatus, kickoffAt = new Date()) {
  const tournament = await prisma.tournament.create({
    data: {
      name: "Public Matches Test",
      slug: `${testSlugPrefix}${crypto.randomUUID()}`,
      year: 2026,
      active: true,
    },
  });
  const home = await prisma.team.create({
    data: { tournamentId: tournament.id, name: "Home", countryCode: `H${crypto.randomUUID()}`, flagEmoji: "🏠" },
  });
  const away = await prisma.team.create({
    data: { tournamentId: tournament.id, name: "Away", countryCode: `A${crypto.randomUUID()}`, flagEmoji: "✈️" },
  });

  return prisma.match.create({
    data: {
      tournamentId: tournament.id,
      providerId: `public-test-${status.toLowerCase()}-${crypto.randomUUID()}`,
      phase: MatchPhase.GROUP_STAGE,
      status,
      kickoffAt,
      homeTeamId: home.id,
      awayTeamId: away.id,
      homeScore: status === MatchStatus.FINAL ? 2 : null,
      awayScore: status === MatchStatus.FINAL ? 1 : null,
    },
  });
}

describe("public today's matches", () => {
  it("shows scheduled, locked, and final matches to anonymous visitors", async () => {
    await createPublicMatch(MatchStatus.SCHEDULED);
    await createPublicMatch(MatchStatus.LOCKED);
    await createPublicMatch(MatchStatus.FINAL);
    await createPublicMatch(MatchStatus.CANCELLED);
    await createPublicMatch(MatchStatus.ABANDONED);

    const matches = await getPublicTodaysMatches(20);
    const testMatches = matches.filter((match) => match.providerId?.startsWith("public-test-"));

    expect(testMatches.map((match) => match.status)).toEqual([
      MatchStatus.SCHEDULED,
      MatchStatus.LOCKED,
      MatchStatus.FINAL,
    ]);
  });
});
