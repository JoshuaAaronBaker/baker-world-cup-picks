import Link from "next/link";
import { MatchPhase } from "@prisma/client";
import { logOut } from "@/app/auth/actions";
import { PredictionForm } from "@/components/prediction-form";
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
      <nav className="topbar" aria-label="Primary navigation">
        <Link href="/" className="brand">
          <span className="brand-mark">B</span>
          <span>Baker&apos;s World Cup Picks</span>
        </Link>
        <form action={logOut}>
          <button className="ghost-button" type="submit">
            Log out
          </button>
        </form>
      </nav>
      <section className="game-grid">
        <div className="section-heading">
          <p className="eyebrow">Signed in as {user.username}</p>
          <h1>My predictions</h1>
        </div>
        <p className="progress-note">
          Predicted {progress.predicted} of {progress.available} available matches.
        </p>
        <div className="rules-strip" aria-label="Prediction rules">
          <span>3 pts exact score</span>
          <span>1 pt correct result</span>
          <span>Picks lock 5 minutes before kickoff</span>
          <span>Knockout draws need an advancer</span>
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
