import Link from "next/link";
import { LeaderboardRank } from "@/components/leaderboard-rank";
import { PublicMatchList } from "@/components/public-match-list";
import { SiteNav } from "@/components/site-nav";
import { getCurrentUser } from "@/lib/auth";
import { getLeaderboard } from "@/lib/leaderboard";
import { getPublicTodaysMatches } from "@/lib/public-matches";
import { getPublicSyncStatus } from "@/lib/sync-status";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const [leaderboard, currentUser, matches, syncStatus] = await Promise.all([
    getLeaderboard(),
    getCurrentUser(),
    getPublicTodaysMatches(6),
    getPublicSyncStatus(),
  ]);

  return (
    <main className="app-shell">
      <SiteNav />
      <section className="game-grid centered-page">
        <div className="section-heading">
          <p className="eyebrow">Public leaderboard</p>
          <h1>Rankings</h1>
          <p className="form-note">{syncStatus.label}</p>
          <p className="form-note">Scoring: 3 points for an exact score, 1 for the right result.</p>
        </div>
        <ol className="leaderboard-list leaderboard-page-list">
          {leaderboard.length ? (
            leaderboard.map((player) => (
              <li
                className={[
                  player.rank <= 3 ? `top-rank rank-${player.rank}` : "",
                  currentUser?.username === player.username ? "current-user-row" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                key={player.username}
              >
                <LeaderboardRank rank={player.rank} />
                {currentUser ? (
                  <Link className="username username-link" href={`/users/${player.username}`}>
                    {player.username}
                    <small>
                      {player.correctResults}/{player.scoredPicks} correct · {player.exactScores} exact
                    </small>
                  </Link>
                ) : (
                  <span className="username">
                    {player.username}
                    <small>
                      {player.correctResults}/{player.scoredPicks} correct · {player.exactScores} exact
                    </small>
                  </span>
                )}
                <div className="leaderboard-actions">
                  <strong>{player.points} pts</strong>
                  {currentUser ? (
                    <Link className="ghost-button small" href={`/users/${player.username}`}>
                      See picks
                    </Link>
                  ) : (
                    <Link className="ghost-button small" href="/signup?next=/leaderboard">
                      See picks
                    </Link>
                  )}
                </div>
              </li>
            ))
          ) : (
            <li>No players yet.</li>
          )}
        </ol>
        {!currentUser ? (
          <section className="public-upcoming" aria-label="Today's matches">
            <div className="section-heading">
              <p className="eyebrow">Today&apos;s matches</p>
              <h2>Make your picks</h2>
            </div>
            <PublicMatchList matches={matches} />
          </section>
        ) : null}
      </section>
    </main>
  );
}
