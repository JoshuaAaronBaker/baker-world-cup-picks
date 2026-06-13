import { savePrediction } from "@/app/predictions/actions";
import { MatchTiming } from "@/components/match-timing";
import { plainTeamName, teamName } from "@/lib/display";
import {
  formatPhase,
  getMatchStatusLabel,
  isMatchLocked,
  isMatchPredictable,
  isKnockoutPhase,
  SCORE_MAX,
  SCORE_MIN,
  type MatchWithPrediction,
} from "@/lib/matches";

type PredictionFormProps = {
  match: MatchWithPrediction;
};

export function PredictionForm({ match }: PredictionFormProps) {
  const prediction = match.predictions[0];
  const locked = isMatchLocked(match);
  const predictable = isMatchPredictable(match);
  const disabled = locked || !predictable;
  const status = getMatchStatusLabel(match);
  const knockout = isKnockoutPhase(match.phase);
  const canViewBreakdown = locked;

  return (
    <form className="prediction-row" action={savePrediction}>
      <input type="hidden" name="matchId" value={match.id} />
      <div>
        <p className="match-time">
          {formatPhase(match.phase)} ·{" "}
          <MatchTiming kickoffAt={match.kickoffAt.toISOString()} locked={locked} />
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
      {knockout && match.homeTeam && match.awayTeam ? (
        <label className="advancer-select">
          Advances if draw
          <select
            name="predictedAdvancingTeamId"
            defaultValue={prediction?.predictedAdvancingTeamId ?? ""}
            disabled={disabled}
          >
            <option value="">Pick team</option>
            <option value={match.homeTeam.id}>{plainTeamName(match, "home")}</option>
            <option value={match.awayTeam.id}>{plainTeamName(match, "away")}</option>
          </select>
        </label>
      ) : null}
      <div className="prediction-actions">
        <span className="status-pill">{status}</span>
        {canViewBreakdown ? (
          <a className="ghost-button small" href={`/matches/${match.id}`}>
            Picks
          </a>
        ) : null}
        <button className="button small" type="submit" disabled={disabled}>
          {prediction ? "Update" : "Save"}
        </button>
      </div>
    </form>
  );
}
