import { MatchStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

function getLocalTodayRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(start);
  end.setDate(start.getDate() + 1);

  return { start, end };
}

export async function getPublicTodaysMatches(limit = 6) {
  const { start, end } = getLocalTodayRange();

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
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(kickoffAt);
}
