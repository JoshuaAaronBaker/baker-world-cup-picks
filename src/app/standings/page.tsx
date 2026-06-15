import { SiteNav } from "@/components/site-nav";
import { getGroupStandings } from "@/lib/group-standings";

export const dynamic = "force-dynamic";

export default async function StandingsPage() {
  const standings = await getGroupStandings();

  return (
    <main className="app-shell">
      <SiteNav />
      <section className="game-grid centered-page">
        <div className="section-heading">
          <p className="eyebrow">World Cup groups</p>
          <h1>Group standings</h1>
          <p className="form-note">Tables update from the synced match results.</p>
        </div>
        <div className="standings-grid">
          {standings.map((group) => (
            <section className="standings-card" key={group.group} aria-labelledby={`standings-${group.group}`}>
              <header className="standings-header">
                <h2 id={`standings-${group.group}`}>{group.label}</h2>
              </header>
              <div className="standings-table" role="table" aria-label={group.label}>
                <div className="standings-row standings-head" role="row">
                  <span role="columnheader">#</span>
                  <span role="columnheader">Team</span>
                  <span role="columnheader">MP</span>
                  <span role="columnheader">W-D-L</span>
                  <span role="columnheader">GF</span>
                  <span role="columnheader">GA</span>
                  <span role="columnheader">GD</span>
                  <span role="columnheader">PTS</span>
                </div>
                {group.rows.map((row) => (
                  <div className="standings-row" role="row" key={row.team.countryCode}>
                    <span className="standings-position" role="cell">{row.position}</span>
                    <span className="standings-team" role="cell">
                      <span className="standings-flag" aria-hidden="true">{row.team.flagEmoji}</span>
                      <strong>{row.team.name}</strong>
                    </span>
                    <span role="cell">{row.played}</span>
                    <span role="cell">{row.wins}-{row.draws}-{row.losses}</span>
                    <span role="cell">{row.goalsFor}</span>
                    <span role="cell">{row.goalsAgainst}</span>
                    <span role="cell">{row.goalDifference}</span>
                    <strong role="cell">{row.points}</strong>
                  </div>
                ))}
              </div>
            </section>
          ))}
          {standings.length === 0 ? <p>No group standings are available yet.</p> : null}
        </div>
      </section>
    </main>
  );
}
