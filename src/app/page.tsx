import Link from "next/link";

const leaderboard = [
  { rank: 1, username: "Baker", points: 12 },
  { rank: 2, username: "maria_10", points: 9 },
  { rank: 3, username: "sam-j", points: 7 },
  { rank: 4, username: "alex_92", points: 4 },
];

const matches = [
  {
    flagA: "🇺🇸",
    home: "United States",
    flagB: "🇨🇦",
    away: "Canada",
    date: "Jun 12",
    time: "5:00 PM PDT",
    state: "Locks in 3h 12m",
  },
  {
    flagA: "🇲🇽",
    home: "Mexico",
    flagB: "🇧🇷",
    away: "Brazil",
    date: "Jun 13",
    time: "6:30 PM PDT",
    state: "Predicted",
  },
  {
    flagA: "🇫🇷",
    home: "France",
    flagB: "🇯🇵",
    away: "Japan",
    date: "Jun 14",
    time: "2:00 PM PDT",
    state: "Open",
  },
];

export default function Home() {
  return (
    <main className="app-shell">
      <nav className="topbar" aria-label="Primary navigation">
        <Link href="/" className="brand">
          <span className="brand-mark">B</span>
          <span>Baker&apos;s World Cup Picks</span>
        </Link>
        <div className="nav-actions">
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
            {leaderboard.map((player) => (
              <li key={player.username}>
                <span className="rank">{player.rank}</span>
                <span className="username">{player.username}</span>
                <strong>{player.points} pts</strong>
              </li>
            ))}
          </ol>
        </section>
      </section>

      <section className="game-grid" aria-label="Game preview">
        <div className="section-heading">
          <p className="eyebrow">Prediction desk</p>
          <h2>Upcoming matches</h2>
        </div>
        <div className="match-list">
          {matches.map((match) => (
            <article className="match-row" key={`${match.home}-${match.away}`}>
              <div>
                <p className="match-time">
                  {match.date} · {match.time}
                </p>
                <div className="teams">
                  <span>
                    {match.flagA} {match.home}
                  </span>
                  <span className="versus">vs</span>
                  <span>
                    {match.flagB} {match.away}
                  </span>
                </div>
              </div>
              <div className="score-pick" aria-label="Example score prediction">
                <span>2</span>
                <span>1</span>
              </div>
              <span className="status-pill">{match.state}</span>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
