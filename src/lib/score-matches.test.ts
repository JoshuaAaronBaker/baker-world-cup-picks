import { MatchPhase, MatchStatus, PrismaClient } from "@prisma/client";
import { beforeEach, describe, expect, it } from "vitest";
import { rankLeaderboardUsers } from "@/lib/leaderboard";
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
  const testTournaments = await prisma.tournament.findMany({
    where: { slug: { startsWith: "test-" } },
    select: { id: true },
  });
  const testUsers = await prisma.user.findMany({
    where: {
      normalizedUsername: {
        in: [
          "exact_user",
          "result_user",
          "wrong_user",
          "right_advancer",
          "wrong_advancer",
          "cancelled_user",
          "first_user",
          "tied_user",
          "lower_user",
        ],
      },
    },
    select: { id: true },
  });
  const tournamentIds = testTournaments.map((tournament) => tournament.id);
  const userIds = testUsers.map((user) => user.id);

  await prisma.prediction.deleteMany({
    where: {
      OR: [{ userId: { in: userIds } }, { match: { tournamentId: { in: tournamentIds } } }],
    },
  });
  await prisma.match.deleteMany({ where: { tournamentId: { in: tournamentIds } } });
  await prisma.team.deleteMany({ where: { tournamentId: { in: tournamentIds } } });
  await prisma.tournament.deleteMany({ where: { id: { in: tournamentIds } } });
  await prisma.user.deleteMany({ where: { id: { in: userIds } } });
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
      where: { matchId: match.id },
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

    const predictions = await prisma.prediction.findMany({
      where: { matchId: match.id },
      include: { user: true },
      orderBy: { user: { username: "asc" } },
    });

    expect(predictions.map((prediction) => [prediction.user.username, prediction.pointsAwarded])).toEqual([
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

    const prediction = await prisma.prediction.findFirstOrThrow({
      where: { matchId: match.id },
    });
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

    const usersAfterInitialScore = await prisma.user.findMany({
      where: { id: { in: [firstUser.id, tiedUser.id, lowerUser.id] } },
      include: { predictions: true },
    });
    const initialLeaderboard = rankLeaderboardUsers(usersAfterInitialScore);
    const tiedLeaders = initialLeaderboard
      .filter((row) => row.rank === 1)
      .map((row) => row.username)
      .sort();

    expect(tiedLeaders).toEqual(["first_user", "tied_user"]);
    expect(initialLeaderboard.find((row) => row.username === "lower_user")).toMatchObject({
      rank: 2,
      points: 1,
      exactScores: 0,
      correctResults: 1,
    });

    await finalizeMatchAndScore({ matchId: match.id, homeScore: 1, awayScore: 0 });

    const usersAfterRecalculation = await prisma.user.findMany({
      where: { id: { in: [firstUser.id, tiedUser.id, lowerUser.id] } },
      include: { predictions: true },
    });
    const recalculatedLeaderboard = rankLeaderboardUsers(usersAfterRecalculation);
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
