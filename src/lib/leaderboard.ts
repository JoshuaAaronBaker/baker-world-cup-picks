import { prisma } from "@/lib/prisma";

export type LeaderboardRow = {
  rank: number;
  username: string;
  points: number;
  exactScores: number;
  correctResults: number;
};

export async function getLeaderboard(limit?: number): Promise<LeaderboardRow[]> {
  const users = await prisma.user.findMany({
    where: { hideFromLeaderboard: false },
    select: {
      username: true,
      createdAt: true,
      predictions: {
        where: {
          pointsAwarded: { not: null },
        },
        select: {
          pointsAwarded: true,
          exactScore: true,
          correctResult: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const sortedUsers = users
    .map((user) => {
      const points = user.predictions.reduce(
        (total, prediction) => total + (prediction.pointsAwarded ?? 0),
        0,
      );
      const exactScores = user.predictions.filter((prediction) => prediction.exactScore).length;
      const correctResults = user.predictions.filter(
        (prediction) => prediction.correctResult,
      ).length;

      return {
        username: user.username,
        points,
        exactScores,
        correctResults,
        createdAt: user.createdAt,
      };
    })
    .sort((left, right) => {
      if (right.points !== left.points) return right.points - left.points;
      if (right.exactScores !== left.exactScores) return right.exactScores - left.exactScores;
      if (right.correctResults !== left.correctResults) {
        return right.correctResults - left.correctResults;
      }
      return left.createdAt.getTime() - right.createdAt.getTime();
    });

  const ranked = sortedUsers.map((user, index, allUsers) => {
    const previous = allUsers[index - 1];
    const tiedWithPrevious =
      previous &&
      previous.points === user.points &&
      previous.exactScores === user.exactScores &&
      previous.correctResults === user.correctResults;

    return {
      rank: tiedWithPrevious ? 0 : index + 1,
      username: user.username,
      points: user.points,
      exactScores: user.exactScores,
      correctResults: user.correctResults,
    };
  });

  for (let index = 0; index < ranked.length; index += 1) {
    if (ranked[index].rank === 0) {
      ranked[index].rank = ranked[index - 1].rank;
    }
  }

  return typeof limit === "number" ? ranked.slice(0, limit) : ranked;
}
