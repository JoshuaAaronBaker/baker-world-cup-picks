import Link from "next/link";
import { teamName } from "@/lib/display";
import { formatPublicMatchTime, type getPublicTodaysMatches } from "@/lib/public-matches";

type PublicMatch = Awaited<ReturnType<typeof getPublicTodaysMatches>>[number];

type PublicMatchListProps = {
  matches: PublicMatch[];
};

export function PublicMatchList({ matches }: PublicMatchListProps) {
  return (
    <div className="match-list">
      {matches.map((match) => (
        <Link className="match-row public-match-link" href="/signup" key={match.id}>
          <div>
            <p className="match-time">{formatPublicMatchTime(match.kickoffAt)}</p>
            <div className="teams">
              <span>{teamName(match, "home")}</span>
              <span className="versus">vs</span>
              <span>{teamName(match, "away")}</span>
            </div>
          </div>
          <div className="score-pick" aria-label="Score">
            <span>{match.homeScore ?? "-"}</span>
            <span>{match.awayScore ?? "-"}</span>
          </div>
          <span className={`status-pill status-${match.status.toLowerCase()}`}>
            {match.status.toLowerCase()}
          </span>
        </Link>
      ))}
      {matches.length === 0 ? <p>No matches today.</p> : null}
    </div>
  );
}
