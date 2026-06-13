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

export const PHASE_FILTERS = [
  { label: "All", value: "all" },
  { label: "Group Stage", value: MatchPhase.GROUP_STAGE },
  { label: "Round of 32", value: MatchPhase.ROUND_OF_32 },
  { label: "Round of 16", value: MatchPhase.ROUND_OF_16 },
  { label: "Quarter-finals", value: MatchPhase.QUARTER_FINAL },
  { label: "Semi-finals", value: MatchPhase.SEMI_FINAL },
  { label: "Final", value: MatchPhase.FINAL },
] as const;

export function getLockDeadline(match: Pick<Match, "kickoffAt">) {
  return new Date(match.kickoffAt.getTime() - LOCK_BUFFER_MINUTES * 60 * 1000);
}

export function isMatchLocked(
  match: Pick<Match, "kickoffAt" | "status" | "predictionsReopened">,
  now = new Date(),
) {
  if (match.status === MatchStatus.FINAL || match.status === MatchStatus.CANCELLED) {
    return true;
  }

  if (match.predictionsReopened) {
    return false;
  }

  return now.getTime() >= getLockDeadline(match).getTime() || match.status === MatchStatus.LOCKED;
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

export function formatMatchDate(kickoffAt: Date) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(kickoffAt);
}

export function getLockCountdownLabel(
  match: Pick<Match, "kickoffAt" | "status" | "predictionsReopened">,
  now = new Date(),
) {
  if (isMatchLocked(match, now)) {
    return "Locked";
  }

  const lockAt = getLockDeadline(match).getTime();
  const millisecondsUntilLock = lockAt - now.getTime();
  const hoursUntilLock = millisecondsUntilLock / (1000 * 60 * 60);

  if (hoursUntilLock > 24) {
    return null;
  }

  const totalMinutes = Math.max(1, Math.ceil(millisecondsUntilLock / (1000 * 60)));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) {
    return `Locks in ${hours}h ${minutes}m`;
  }

  return `Locks in ${minutes}m`;
}

export function getMatchStatusLabel(match: MatchWithPrediction) {
  if (!isMatchPredictable(match)) return "Teams pending";
  if (match.status === MatchStatus.FINAL) return "Final";
  if (isMatchLocked(match)) return "Locked";
  return "Open";
}

export async function getPredictionMatches(userId: string, phase?: MatchPhase) {
  return prisma.match.findMany({
    where: {
      tournament: { active: true },
      status: { notIn: [MatchStatus.CANCELLED, MatchStatus.ABANDONED] },
      ...(phase ? { phase } : {}),
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

export function parsePhaseFilter(value?: string | string[]) {
  if (!value || Array.isArray(value) || value === "all") {
    return undefined;
  }

  return Object.values(MatchPhase).find((phase) => phase === value);
}

export function getPredictionProgress(matches: MatchWithPrediction[]) {
  const availableMatches = matches.filter(isMatchPredictable);
  const predictedMatches = availableMatches.filter((match) => match.predictions.length > 0);

  return {
    available: availableMatches.length,
    predicted: predictedMatches.length,
  };
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
