import Link from "next/link";

export default function LeaderboardPage() {
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
        <p>Live leaderboard data lands after auth and scoring are wired in.</p>
      </section>
    </main>
  );
}
