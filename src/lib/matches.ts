import type { Match, Prediction, Team } from "@prisma/client";
import { MatchPhase, MatchStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const SCORE_MIN = 0;
export const SCORE_MAX = 20;
export const LOCK_BUFFER_MINUTES = 5;

export type MatchWithPrediction = Match & {
  homeTeam: Team | null;
  awayTeam: Team | null;
  predictions: Prediction[];
};

export function getLockDeadline(match: Pick<Match, "kickoffAt">) {
  return new Date(match.kickoffAt.getTime() - LOCK_BUFFER_MINUTES * 60 * 1000);
}

export function isMatchLocked(match: Pick<Match, "kickoffAt" | "status" | "predictionsReopened">) {
  if (match.status === MatchStatus.FINAL || match.status === MatchStatus.CANCELLED) {
    return true;
  }

  if (match.predictionsReopened) {
    return false;
  }

  return Date.now() >= getLockDeadline(match).getTime() || match.status === MatchStatus.LOCKED;
}

export function isMatchPredictable(match: Pick<MatchWithPrediction, "homeTeam" | "awayTeam">) {
  return Boolean(match.homeTeam && match.awayTeam);
}

export function formatPhase(phase: MatchPhase) {
  const labels: Record<MatchPhase, string> = {
    GROUP_STAGE: "Group stage",
    ROUND_OF_32: "Round of 32",
    ROUND_OF_16: "Round of 16",
    QUARTER_FINAL: "Quarter-final",
    SEMI_FINAL: "Semi-final",
    THIRD_PLACE: "Third place",
    FINAL: "Final",
  };

  return labels[phase];
}

export function formatMatchTime(kickoffAt: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(kickoffAt);
}

export function getMatchStatusLabel(match: MatchWithPrediction) {
  if (!isMatchPredictable(match)) return "Teams pending";
  if (match.status === MatchStatus.FINAL) return "Final";
  if (isMatchLocked(match)) return "Locked";
  return "Open";
}

export async function getPredictionMatches(userId: string) {
  return prisma.match.findMany({
    where: {
      tournament: { active: true },
      status: { notIn: [MatchStatus.CANCELLED, MatchStatus.ABANDONED] },
    },
    include: {
      homeTeam: true,
      awayTeam: true,
      predictions: {
        where: { userId },
      },
    },
    orderBy: { kickoffAt: "asc" },
  });
}

export function validateScoreValue(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || value.trim() === "") {
    return null;
  }

  const number = Number(value);

  if (!Number.isInteger(number) || number < SCORE_MIN || number > SCORE_MAX) {
    return null;
  }

  return number;
}
