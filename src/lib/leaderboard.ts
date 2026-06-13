import { UserRole } from "@prisma/client";
import { rankMedals } from "@/components/leaderboard-rank";
import { prisma } from "@/lib/prisma";

export type LeaderboardRow = {
  rank: number;
  username: string;
  points: number;
  exactScores: number;
  correctResults: number;
  scoredPicks: number;
  tied: boolean;
};

type LeaderboardUserInput = {
  username: string;
  createdAt: Date;
  predictions: Array<{
    pointsAwarded: number | null;
    exactScore: boolean;
    correctResult: boolean;
  }>;
};

export function rankLeaderboardUsers(users: LeaderboardUserInput[]): LeaderboardRow[] {
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
      const scoredPicks = user.predictions.length;

      return {
        username: user.username,
        points,
        exactScores,
        correctResults,
        scoredPicks,
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
      scoredPicks: user.scoredPicks,
      tied: false,
    };
  });

  for (let index = 0; index < ranked.length; index += 1) {
    if (ranked[index].rank === 0) {
      ranked[index].rank = ranked[index - 1].rank;
    }
  }

  const rankCounts = new Map<number, number>();

  for (const user of ranked) {
    rankCounts.set(user.rank, (rankCounts.get(user.rank) ?? 0) + 1);
  }

  return ranked.map((user) => ({
    ...user,
    tied: (rankCounts.get(user.rank) ?? 0) > 1,
  }));
}

export function formatLeaderboardPlacement(row?: Pick<LeaderboardRow, "rank" | "tied">) {
  if (!row) return null;

  const tens = row.rank % 100;
  const suffix =
    tens >= 11 && tens <= 13
      ? "th"
      : row.rank % 10 === 1
        ? "st"
        : row.rank % 10 === 2
          ? "nd"
          : row.rank % 10 === 3
            ? "rd"
            : "th";
  const placement = `${row.rank}${suffix}`;
  const medal = rankMedals[row.rank];
  const label = row.tied ? `Tied for ${placement}` : placement;

  return medal ? `${medal} ${label}` : label;
}

export async function getLeaderboard(limit?: number): Promise<LeaderboardRow[]> {
  const users = await prisma.user.findMany({
    where: { hideFromLeaderboard: false, role: UserRole.USER },
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

  const ranked = rankLeaderboardUsers(users);

  return typeof limit === "number" ? ranked.slice(0, limit) : ranked;
}
