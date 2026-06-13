type Score = {
  homeScore: number;
  awayScore: number;
};

type KnockoutAdvancer = {
  actualAdvancingTeamId?: string | null;
  predictedAdvancingTeamId?: string | null;
};

export type ScorePredictionInput = Score &
  KnockoutAdvancer & {
    actualHomeScore: number;
    actualAwayScore: number;
    isKnockout: boolean;
  };

export type ScorePredictionResult = {
  pointsAwarded: number;
  exactScore: boolean;
  correctResult: boolean;
};

function resultSide(score: Score) {
  if (score.homeScore > score.awayScore) return "home";
  if (score.awayScore > score.homeScore) return "away";
  return "draw";
}

export function scorePrediction(input: ScorePredictionInput): ScorePredictionResult {
  const exactScore =
    input.homeScore === input.actualHomeScore && input.awayScore === input.actualAwayScore;

  const predictedSide = resultSide(input);
  const actualSide = resultSide({
    homeScore: input.actualHomeScore,
    awayScore: input.actualAwayScore,
  });

  const correctAdvancer =
    input.isKnockout &&
    actualSide === "draw" &&
    Boolean(input.actualAdvancingTeamId) &&
    input.actualAdvancingTeamId === input.predictedAdvancingTeamId;

  const correctResult = actualSide === "draw" ? predictedSide === "draw" : predictedSide === actualSide;
  const scoredCorrectResult = input.isKnockout && actualSide === "draw" ? correctAdvancer : correctResult;

  return {
    pointsAwarded: exactScore ? 3 : scoredCorrectResult ? 1 : 0,
    exactScore,
    correctResult: scoredCorrectResult,
  };
}
