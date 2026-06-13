import { MatchStatus } from "@prisma/client";
import { formatAppDateTime, getAppTodayRange } from "@/lib/datetime";
import { prisma } from "@/lib/prisma";

export async function getPublicTodaysMatches(limit = 6) {
  const { start, end } = getAppTodayRange();

  return prisma.match.findMany({
    where: {
      tournament: { active: true },
      status: { notIn: [MatchStatus.CANCELLED, MatchStatus.ABANDONED] },
      kickoffAt: {
        gte: start,
        lt: end,
      },
    },
    include: { homeTeam: true, awayTeam: true },
    orderBy: { kickoffAt: "asc" },
    take: limit,
  });
}

export function formatPublicMatchTime(kickoffAt: Date) {
  return formatAppDateTime(kickoffAt);
}
