import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getLeaderboard } from "@/lib/leaderboard";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const [leaderboard, currentUser] = await Promise.all([getLeaderboard(), getCurrentUser()]);

  return (
    <main className="app-shell">
      <nav className="topbar" aria-label="Primary navigation">
        <Link href="/" className="brand">
          <span className="brand-mark">B</span>
          <span>Baker&apos;s World Cup Picks</span>
        </Link>
      </nav>
      <section className="game-grid">
        <div className="section-heading">
          <p className="eyebrow">Public leaderboard</p>
          <h1>Rankings</h1>
        </div>
        <ol className="leaderboard-list leaderboard-page-list">
          {leaderboard.length ? (
            leaderboard.map((player) => (
              <li key={player.username}>
                <span className="rank">{player.rank}</span>
                {currentUser ? (
                  <Link className="username username-link" href={`/users/${player.username}`}>
                    {player.username}
                  </Link>
                ) : (
                  <span className="username">{player.username}</span>
                )}
                <strong>{player.points} pts</strong>
              </li>
            ))
          ) : (
            <li>No players yet.</li>
          )}
        </ol>
      </section>
    </main>
  );
}
