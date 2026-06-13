import { MatchStatus, PredictionStatus, type MatchPhase } from "@prisma/client";
import { isKnockoutPhase } from "@/lib/matches";
import { prisma } from "@/lib/prisma";
import { scorePrediction } from "@/lib/scoring";

type ScorableMatch = {
  id: string;
  phase: MatchPhase;
  status: MatchStatus;
  homeScore: number | null;
  awayScore: number | null;
  advancingTeamId: string | null;
};

export function isScorableMatch(match: ScorableMatch) {
  return (
    match.status === MatchStatus.FINAL &&
    match.homeScore !== null &&
    match.awayScore !== null
  );
}

export async function recalculateMatchScores(matchId: string) {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      predictions: true,
    },
  });

  if (!match) {
    throw new Error("Match not found.");
  }

  if (!isScorableMatch(match)) {
    await prisma.prediction.updateMany({
      where: { matchId },
      data: {
        pointsAwarded: null,
        exactScore: false,
        correctResult: false,
        status: PredictionStatus.VALID,
      },
    });
    return { scored: 0, cleared: match.predictions.length };
  }

  const actualHomeScore = match.homeScore;
  const actualAwayScore = match.awayScore;

  if (actualHomeScore === null || actualAwayScore === null) {
    throw new Error("Scorable match is missing a final score.");
  }

  await Promise.all(
    match.predictions.map((prediction) => {
      const result = scorePrediction({
        homeScore: prediction.homeScore,
        awayScore: prediction.awayScore,
        actualHomeScore,
        actualAwayScore,
        isKnockout: isKnockoutPhase(match.phase),
        predictedAdvancingTeamId: prediction.predictedAdvancingTeamId,
        actualAdvancingTeamId: match.advancingTeamId,
      });

      return prisma.prediction.update({
        where: { id: prediction.id },
        data: {
          ...result,
          status: PredictionStatus.SCORED,
        },
      });
    }),
  );

  return { scored: match.predictions.length, cleared: 0 };
}

export async function recalculateAllScores() {
  const matches = await prisma.match.findMany({
    where: {
      status: {
        in: [MatchStatus.FINAL, MatchStatus.CANCELLED, MatchStatus.ABANDONED],
      },
    },
    select: { id: true },
  });

  const results = await Promise.all(matches.map((match) => recalculateMatchScores(match.id)));

  return results.reduce(
    (total, result) => ({
      scored: total.scored + result.scored,
      cleared: total.cleared + result.cleared,
    }),
    { scored: 0, cleared: 0 },
  );
}

export async function finalizeMatchAndScore(input: {
  matchId: string;
  homeScore: number;
  awayScore: number;
  advancingTeamId?: string | null;
}) {
  const match = await prisma.match.update({
    where: { id: input.matchId },
    data: {
      status: MatchStatus.FINAL,
      homeScore: input.homeScore,
      awayScore: input.awayScore,
      advancingTeamId: input.advancingTeamId ?? null,
    },
    select: { id: true },
  });

  return recalculateMatchScores(match.id);
}
