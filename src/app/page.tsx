import Link from "next/link";
import { PublicMatchList } from "@/components/public-match-list";
import { getLeaderboard } from "@/lib/leaderboard";
import { getPublicTodaysMatches } from "@/lib/public-matches";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [leaderboard, matches] = await Promise.all([getLeaderboard(4), getPublicTodaysMatches(3)]);

  return (
    <main className="app-shell">
      <nav className="topbar" aria-label="Primary navigation">
        <Link href="/" className="brand">
          <span className="brand-mark">B</span>
          <span>Baker&apos;s World Cup Picks</span>
        </Link>
        <div className="nav-actions">
          <Link href="/leaderboard">Leaderboard</Link>
          <Link href="/login">Log in</Link>
          <Link href="/signup" className="button small">
            Sign up
          </Link>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">2026 World Cup prediction game</p>
          <h1>Pick the scores. Watch the table move.</h1>
          <p>
            Predict each match before it locks, get 3 points for an exact score
            and 1 for the right result, then see who sits top after nightly
            updates.
          </p>
          <div className="hero-actions">
            <Link href="/signup" className="button">
              Join the picks
            </Link>
            <Link href="/leaderboard" className="ghost-button">
              View leaderboard
            </Link>
          </div>
        </div>

        <section className="leaderboard-panel" aria-labelledby="leaderboard-title">
          <div className="panel-heading">
            <p className="eyebrow">Public leaderboard</p>
            <h2 id="leaderboard-title">Rankings</h2>
          </div>
          <ol className="leaderboard-list">
            {leaderboard.length ? leaderboard.map((player) => (
              <li className={player.rank <= 3 ? `top-rank rank-${player.rank}` : ""} key={player.username}>
                <span className="rank">{player.rank}</span>
                <span className="username">
                  {player.username}
                  <small>
                    {player.exactScores} exact · {player.correctResults} results
                  </small>
                </span>
                <strong>{player.points} pts</strong>
              </li>
            )) : <li>No picks yet. Be the first on the table.</li>}
          </ol>
        </section>
      </section>

      <section className="game-grid" aria-label="Game preview">
        <div className="section-heading">
          <p className="eyebrow">Prediction desk</p>
          <h2>Today&apos;s matches</h2>
        </div>
        <PublicMatchList matches={matches} />
      </section>
    </main>
  );
}
