import { savePrediction } from "@/app/predictions/actions";
import {
  formatMatchTime,
  formatPhase,
  getMatchStatusLabel,
  isMatchLocked,
  isMatchPredictable,
  SCORE_MAX,
  SCORE_MIN,
  type MatchWithPrediction,
} from "@/lib/matches";

type PredictionFormProps = {
  match: MatchWithPrediction;
};

function teamName(match: MatchWithPrediction, side: "home" | "away") {
  const team = side === "home" ? match.homeTeam : match.awayTeam;
  const placeholder = side === "home" ? match.homePlaceholder : match.awayPlaceholder;

  if (team) {
    return `${team.flagEmoji} ${team.name}`;
  }

  return placeholder ?? "Team pending";
}

export function PredictionForm({ match }: PredictionFormProps) {
  const prediction = match.predictions[0];
  const locked = isMatchLocked(match);
  const predictable = isMatchPredictable(match);
  const disabled = locked || !predictable;
  const status = getMatchStatusLabel(match);

  return (
    <form className="prediction-row" action={savePrediction}>
      <input type="hidden" name="matchId" value={match.id} />
      <div>
        <p className="match-time">
          {formatPhase(match.phase)} · {formatMatchTime(match.kickoffAt)}
        </p>
        <div className="teams">
          <span>{teamName(match, "home")}</span>
          <span className="versus">vs</span>
          <span>{teamName(match, "away")}</span>
        </div>
        {match.status === "FINAL" && match.homeScore !== null && match.awayScore !== null ? (
          <p className="result-line">
            Final: {match.homeScore}-{match.awayScore}
          </p>
        ) : null}
      </div>
      <div className="score-inputs" aria-label="Score prediction">
        <input
          aria-label={`${teamName(match, "home")} score`}
          name="homeScore"
          type="number"
          min={SCORE_MIN}
          max={SCORE_MAX}
          defaultValue={prediction?.homeScore ?? ""}
          disabled={disabled}
        />
        <input
          aria-label={`${teamName(match, "away")} score`}
          name="awayScore"
          type="number"
          min={SCORE_MIN}
          max={SCORE_MAX}
          defaultValue={prediction?.awayScore ?? ""}
          disabled={disabled}
        />
      </div>
      <div className="prediction-actions">
        <span className="status-pill">{prediction ? status : status}</span>
        <button className="button small" type="submit" disabled={disabled}>
          {prediction ? "Update" : "Save"}
        </button>
      </div>
    </form>
  );
}
