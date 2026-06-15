import Link from "next/link";
import { MatchStatus } from "@prisma/client";
import { LocalMatchTime } from "@/components/local-match-time";
import { teamCode, teamName } from "@/lib/display";
import { formatPublicMatchTime, type getPublicTodaysMatches } from "@/lib/public-matches";

type PublicMatch = Awaited<ReturnType<typeof getPublicTodaysMatches>>[number];

type PublicMatchListProps = {
  matches: PublicMatch[];
};

export function PublicMatchList({ matches }: PublicMatchListProps) {
  return (
    <div className="match-list">
      {matches.map((match) => {
        const canPick = match.status === MatchStatus.SCHEDULED;
        const content = (
          <>
          <div>
            <p className="match-time">
              <LocalMatchTime
                fallback={formatPublicMatchTime(match.kickoffAt)}
                kickoffAt={match.kickoffAt.toISOString()}
              />
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
          <div className="public-pick-preview" aria-label="Try a score prediction">
            <span>{teamCode(match, "home")}</span>
            <div className="score-pick" aria-label="Score">
              <span>{match.homeScore ?? "-"}</span>
              <span className="score-separator" aria-hidden="true">
                -
              </span>
              <span>{match.awayScore ?? "-"}</span>
            </div>
            <span>{teamCode(match, "away")}</span>
          </div>
          <div className="public-match-action">
            <span className={`status-pill status-${match.status.toLowerCase()}`}>
              {match.status.toLowerCase()}
            </span>
            {canPick ? <span className="ghost-button small">Make pick</span> : null}
          </div>
          </>
        );

        return canPick ? (
          <Link className="match-row public-match-link" href="/signup?next=/predictions" key={match.id}>
            {content}
          </Link>
        ) : (
          <article className="match-row" key={match.id}>
            {content}
          </article>
        );
      })}
      {matches.length === 0 ? (
        <p className="empty-state">No matches today. Check back after the next slate is loaded.</p>
      ) : null}
    </div>
  );
}
