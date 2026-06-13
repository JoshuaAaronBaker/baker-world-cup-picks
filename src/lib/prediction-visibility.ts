import { type MatchStatus } from "@prisma/client";
import { isMatchLocked } from "@/lib/matches";

type VisibilityMatch = {
  kickoffAt: Date;
  status: MatchStatus;
  predictionsReopened: boolean;
};

export function canViewPrediction(input: {
  viewerUserId?: string | null;
  predictionUserId: string;
  match: VisibilityMatch;
  now?: Date;
}) {
  if (!input.viewerUserId) {
    return false;
  }

  if (input.viewerUserId === input.predictionUserId) {
    return true;
  }

  return isMatchLocked(input.match, input.now);
}

export function canViewPredictionBreakdown(input: {
  viewerUserId?: string | null;
  match: VisibilityMatch;
  now?: Date;
}) {
  return Boolean(input.viewerUserId) && isMatchLocked(input.match, input.now);
}
