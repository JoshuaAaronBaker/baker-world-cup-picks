import Link from "next/link";
import { MatchPhase, MatchStatus } from "@prisma/client";
import { MatchDateGroup } from "@/components/match-date-group";
import { PredictionForm } from "@/components/prediction-form";
import { SiteNav } from "@/components/site-nav";
import { requireUser } from "@/lib/auth";
import { getAppTodayRange } from "@/lib/datetime";
import { formatLeaderboardPlacement, getLeaderboard } from "@/lib/leaderboard";
import {
  formatMatchDate,
  getPredictionMatches,
  getPredictionProgress,
  isMatchLocked,
  PHASE_FILTERS,
  parsePhaseFilter,
} from "@/lib/matches";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type PredictionsPageProps = {
  searchParams?: Promise<{
    phase?: string;
  }>;
};

type GroupablePredictionMatch = {
  kickoffAt: Date;
  predictionsReopened: boolean;
  status: MatchStatus;
};

type MatchGroup<TMatch> = {
  defaultOpen: boolean;
  label: string;
  matches: TMatch[];
};

export function groupMatchesForPredictions<TMatch extends GroupablePredictionMatch>(
  matches: TMatch[],
  now = new Date(),
): MatchGroup<TMatch>[] {
  const { start: todayStart } = getAppTodayRange(now);
  const completedMatches: TMatch[] = [];
  const upcomingGroups = new Map<string, TMatch[]>();

  for (const match of matches) {
    const completedPastMatch = match.kickoffAt < todayStart && isMatchLocked(match);

    if (completedPastMatch) {
      completedMatches.push(match);
      continue;
    }

    const key = formatMatchDate(match.kickoffAt);
    upcomingGroups.set(key, [...(upcomingGroups.get(key) ?? []), match]);
  }

  const groups: MatchGroup<TMatch>[] = [];

  if (completedMatches.length > 0) {
    groups.push({
      defaultOpen: false,
      label: "Completed matches",
      matches: completedMatches,
    });
  }

  for (const [label, dateMatches] of upcomingGroups) {
    groups.push({
      defaultOpen: dateMatches.some((match) => !isMatchLocked(match, now)),
      label,
      matches: dateMatches,
    });
  }

  return groups;
}

function phaseHref(phase: MatchPhase | "all") {
  return phase === "all" ? "/predictions" : `/predictions?phase=${phase}`;
}

export default async function PredictionsPage({ searchParams }: PredictionsPageProps) {
  const user = await requireUser();
  const params = await searchParams;
  const phase = parsePhaseFilter(params?.phase);
  const [matches, points, leaderboard] = await Promise.all([
    getPredictionMatches(user.id, phase),
    prisma.prediction.aggregate({
      where: {
        userId: user.id,
        pointsAwarded: { not: null },
        match: { tournament: { active: true } },
      },
      _sum: { pointsAwarded: true },
    }),
    getLeaderboard(),
  ]);
  const progress = getPredictionProgress(matches);
  const matchGroups = groupMatchesForPredictions(matches);
  const activePhase = phase ?? "all";
  const totalPoints = points._sum.pointsAwarded ?? 0;
  const placement = formatLeaderboardPlacement(
    leaderboard.find((player) => player.username === user.username),
  );

  return (
    <main className="app-shell">
      <SiteNav />
      <section className="game-grid">
        <div className="page-title-row">
          <div className="section-heading">
            <p className="eyebrow">Signed in as {user.username}</p>
            <h1>My predictions</h1>
          </div>
          <div className="points-counter" aria-label="Total Points">
            <span>Total Points:</span>
            <strong>{totalPoints}</strong>
            {placement ? <small>{placement}</small> : null}
          </div>
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
          {matchGroups.map((group) => (
            <MatchDateGroup
              date={group.label}
              defaultOpen={group.defaultOpen}
              key={group.label}
              matchCount={group.matches.length}
            >
              <div className="match-list">
                {group.matches.map((match) => (
                  <PredictionForm key={match.id} match={match} />
                ))}
              </div>
            </MatchDateGroup>
          ))}
          {matches.length === 0 ? <p>No matches in this phase yet.</p> : null}
        </div>
      </section>
    </main>
  );
}
