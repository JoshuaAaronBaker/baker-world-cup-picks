import Link from "next/link";
import { teamCode, teamName } from "@/lib/display";
import { formatPublicMatchTime, type getPublicTodaysMatches } from "@/lib/public-matches";

type PublicMatch = Awaited<ReturnType<typeof getPublicTodaysMatches>>[number];

type PublicMatchListProps = {
  matches: PublicMatch[];
};

export function PublicMatchList({ matches }: PublicMatchListProps) {
  return (
    <div className="match-list">
      {matches.map((match) => (
        <Link className="match-row public-match-link" href="/signup?next=/predictions" key={match.id}>
          <div>
            <p className="match-time">{formatPublicMatchTime(match.kickoffAt)}</p>
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
          <div className="public-pick-preview" aria-label="Try a score prediction">
            <span>{teamCode(match, "home")}</span>
            <div className="score-pick" aria-label="Score">
              <span>{match.homeScore ?? "-"}</span>
              <span>{match.awayScore ?? "-"}</span>
            </div>
            <span>{teamCode(match, "away")}</span>
          </div>
          <div className="public-match-action">
            <span className={`status-pill status-${match.status.toLowerCase()}`}>
              {match.status.toLowerCase()}
            </span>
            <span className="ghost-button small">Make pick</span>
          </div>
        </Link>
      ))}
      {matches.length === 0 ? (
        <p className="empty-state">No matches today. Check back after the next slate is loaded.</p>
      ) : null}
    </div>
  );
}
