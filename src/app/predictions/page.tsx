import Link from "next/link";
import { MatchPhase } from "@prisma/client";
import { PredictionForm } from "@/components/prediction-form";
import { SiteNav } from "@/components/site-nav";
import { requireUser } from "@/lib/auth";
import {
  formatMatchDate,
  getPredictionMatches,
  getPredictionProgress,
  PHASE_FILTERS,
  parsePhaseFilter,
} from "@/lib/matches";

export const dynamic = "force-dynamic";

type PredictionsPageProps = {
  searchParams?: Promise<{
    phase?: string;
  }>;
};

function groupMatchesByDate(matches: Awaited<ReturnType<typeof getPredictionMatches>>) {
  return matches.reduce<Record<string, typeof matches>>((groups, match) => {
    const key = formatMatchDate(match.kickoffAt);
    groups[key] = groups[key] ?? [];
    groups[key].push(match);
    return groups;
  }, {});
}

function phaseHref(phase: MatchPhase | "all") {
  return phase === "all" ? "/predictions" : `/predictions?phase=${phase}`;
}

export default async function PredictionsPage({ searchParams }: PredictionsPageProps) {
  const user = await requireUser();
  const params = await searchParams;
  const phase = parsePhaseFilter(params?.phase);
  const matches = await getPredictionMatches(user.id, phase);
  const progress = getPredictionProgress(matches);
  const groupedMatches = groupMatchesByDate(matches);
  const activePhase = phase ?? "all";

  return (
    <main className="app-shell">
      <SiteNav />
      <section className="game-grid">
        <div className="section-heading">
          <p className="eyebrow">Signed in as {user.username}</p>
          <h1>My predictions</h1>
        </div>
        <p className="progress-note">
          Predicted {progress.predicted} of {progress.available} available matches.
        </p>
        <div className="rules-note" aria-label="Prediction rules">
          <strong>Scoring</strong>
          <span>3 points for an exact score, 1 point for the right result.</span>
          <span>Picks lock 5 minutes before kickoff. Knockout draws need an advancer.</span>
        </div>
        <nav className="phase-filters" aria-label="Prediction phase filters">
          {PHASE_FILTERS.map((filter) => (
            <Link
              key={filter.value}
              className={filter.value === activePhase ? "active" : ""}
              href={phaseHref(filter.value)}
            >
              {filter.label}
            </Link>
          ))}
        </nav>
        <div className="match-groups">
          {Object.entries(groupedMatches).map(([date, dateMatches]) => (
            <section className="match-date-group" key={date} aria-labelledby={`date-${date}`}>
              <h2 id={`date-${date}`}>{date}</h2>
              <div className="match-list">
                {dateMatches.map((match) => (
                  <PredictionForm key={match.id} match={match} />
                ))}
              </div>
            </section>
          ))}
          {matches.length === 0 ? <p>No matches in this phase yet.</p> : null}
        </div>
      </section>
    </main>
  );
}
