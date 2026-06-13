import { MatchPhase, MatchStatus, PrismaClient } from "@prisma/client";
import { beforeEach, describe, expect, it } from "vitest";
import { getLeaderboard } from "@/lib/leaderboard";
import { finalizeMatchAndScore, recalculateMatchScores } from "@/lib/score-matches";

const prisma = new PrismaClient();

async function createUser(username: string) {
  return prisma.user.create({
    data: {
      username,
      normalizedUsername: username.toLowerCase(),
      passwordHash: "test-hash",
    },
  });
}

async function createTournament() {
  return prisma.tournament.create({
    data: {
      name: "Test Tournament",
      slug: `test-${crypto.randomUUID()}`,
      year: 2026,
      active: false,
    },
  });
}

async function createTeam(tournamentId: string, name: string, countryCode: string) {
  return prisma.team.create({
    data: {
      tournamentId,
      name,
      countryCode,
      flagEmoji: "🏁",
    },
  });
}

beforeEach(async () => {
  await prisma.auditLog.deleteMany();
  await prisma.prediction.deleteMany();
  await prisma.match.deleteMany();
  await prisma.team.deleteMany();
  await prisma.tournament.deleteMany();
  await prisma.user.deleteMany();
});

describe("match scoring persistence", () => {
  it("stores awarded points when a group-stage match is finalized", async () => {
    const tournament = await createTournament();
    const home = await createTeam(tournament.id, "Home", "HM");
    const away = await createTeam(tournament.id, "Away", "AW");
    const [exactUser, resultUser, wrongUser] = await Promise.all([
      createUser("exact_user"),
      createUser("result_user"),
      createUser("wrong_user"),
    ]);
    const match = await prisma.match.create({
      data: {
        tournamentId: tournament.id,
        phase: MatchPhase.GROUP_STAGE,
        kickoffAt: new Date("2026-06-12T20:00:00.000Z"),
        homeTeamId: home.id,
        awayTeamId: away.id,
      },
    });

    await prisma.prediction.createMany({
      data: [
        { userId: exactUser.id, matchId: match.id, homeScore: 2, awayScore: 1 },
        { userId: resultUser.id, matchId: match.id, homeScore: 1, awayScore: 0 },
        { userId: wrongUser.id, matchId: match.id, homeScore: 0, awayScore: 1 },
      ],
    });

    await finalizeMatchAndScore({ matchId: match.id, homeScore: 2, awayScore: 1 });

    const predictions = await prisma.prediction.findMany({
      orderBy: { user: { username: "asc" } },
      select: {
        pointsAwarded: true,
        exactScore: true,
        correctResult: true,
        status: true,
        user: { select: { username: true } },
      },
    });

    expect(predictions).toEqual([
      {
        pointsAwarded: 3,
        exactScore: true,
        correctResult: true,
        status: "SCORED",
        user: { username: "exact_user" },
      },
      {
        pointsAwarded: 1,
        exactScore: false,
        correctResult: true,
        status: "SCORED",
        user: { username: "result_user" },
      },
      {
        pointsAwarded: 0,
        exactScore: false,
        correctResult: false,
        status: "SCORED",
        user: { username: "wrong_user" },
      },
    ]);
  });

  it("uses advancing team logic for tied knockout matches", async () => {
    const tournament = await createTournament();
    const home = await createTeam(tournament.id, "Home", "HM");
    const away = await createTeam(tournament.id, "Away", "AW");
    const [rightUser, wrongUser] = await Promise.all([
      createUser("right_advancer"),
      createUser("wrong_advancer"),
    ]);
    const match = await prisma.match.create({
      data: {
        tournamentId: tournament.id,
        phase: MatchPhase.ROUND_OF_16,
        kickoffAt: new Date("2026-07-01T20:00:00.000Z"),
        homeTeamId: home.id,
        awayTeamId: away.id,
      },
    });

    await prisma.prediction.createMany({
      data: [
        {
          userId: rightUser.id,
          matchId: match.id,
          homeScore: 1,
          awayScore: 1,
          predictedAdvancingTeamId: home.id,
        },
        {
          userId: wrongUser.id,
          matchId: match.id,
          homeScore: 1,
          awayScore: 1,
          predictedAdvancingTeamId: away.id,
        },
      ],
    });

    await finalizeMatchAndScore({
      matchId: match.id,
      homeScore: 2,
      awayScore: 2,
      advancingTeamId: home.id,
    });

    const leaderboard = await getLeaderboard();

    expect(leaderboard.map((row) => [row.username, row.points])).toEqual([
      ["right_advancer", 1],
      ["wrong_advancer", 0],
    ]);
  });

  it("clears awarded points when a final match is changed to cancelled", async () => {
    const tournament = await createTournament();
    const home = await createTeam(tournament.id, "Home", "HM");
    const away = await createTeam(tournament.id, "Away", "AW");
    const user = await createUser("cancelled_user");
    const match = await prisma.match.create({
      data: {
        tournamentId: tournament.id,
        phase: MatchPhase.GROUP_STAGE,
        status: MatchStatus.FINAL,
        kickoffAt: new Date("2026-06-12T20:00:00.000Z"),
        homeTeamId: home.id,
        awayTeamId: away.id,
        homeScore: 2,
        awayScore: 1,
      },
    });
    await prisma.prediction.create({
      data: {
        userId: user.id,
        matchId: match.id,
        homeScore: 2,
        awayScore: 1,
        pointsAwarded: 3,
        exactScore: true,
        correctResult: true,
        status: "SCORED",
      },
    });

    await prisma.match.update({
      where: { id: match.id },
      data: { status: MatchStatus.CANCELLED },
    });
    await recalculateMatchScores(match.id);

    const prediction = await prisma.prediction.findFirstOrThrow();
    expect(prediction.pointsAwarded).toBeNull();
    expect(prediction.exactScore).toBe(false);
    expect(prediction.correctResult).toBe(false);
    expect(prediction.status).toBe("VALID");
  });

  it("updates leaderboard rankings after recalculation", async () => {
    const tournament = await createTournament();
    const home = await createTeam(tournament.id, "Home", "HM");
    const away = await createTeam(tournament.id, "Away", "AW");
    const [firstUser, tiedUser, lowerUser] = await Promise.all([
      createUser("first_user"),
      createUser("tied_user"),
      createUser("lower_user"),
    ]);
    const match = await prisma.match.create({
      data: {
        tournamentId: tournament.id,
        phase: MatchPhase.GROUP_STAGE,
        kickoffAt: new Date("2026-06-12T20:00:00.000Z"),
        homeTeamId: home.id,
        awayTeamId: away.id,
      },
    });
    await prisma.prediction.createMany({
      data: [
        { userId: firstUser.id, matchId: match.id, homeScore: 2, awayScore: 0 },
        { userId: tiedUser.id, matchId: match.id, homeScore: 2, awayScore: 0 },
        { userId: lowerUser.id, matchId: match.id, homeScore: 1, awayScore: 0 },
      ],
    });

    await finalizeMatchAndScore({ matchId: match.id, homeScore: 2, awayScore: 0 });

    const initialLeaderboard = await getLeaderboard();
    const tiedLeaders = initialLeaderboard
      .filter((row) => row.rank === 1)
      .map((row) => row.username)
      .sort();

    expect(tiedLeaders).toEqual(["first_user", "tied_user"]);
    expect(initialLeaderboard.find((row) => row.username === "lower_user")).toMatchObject({
      rank: 3,
      points: 1,
      exactScores: 0,
      correctResults: 1,
    });

    await finalizeMatchAndScore({ matchId: match.id, homeScore: 1, awayScore: 0 });

    const recalculatedLeaderboard = await getLeaderboard();
    expect(recalculatedLeaderboard.find((row) => row.username === "lower_user")).toMatchObject({
      rank: 1,
      points: 3,
    });
    expect(
      recalculatedLeaderboard
        .filter((row) => row.rank === 2)
        .map((row) => [row.username, row.points])
        .sort(),
    ).toEqual([
      ["first_user", 1],
      ["tied_user", 1],
    ]);
  });
});
