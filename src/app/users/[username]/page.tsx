import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteNav } from "@/components/site-nav";
import { requireUser } from "@/lib/auth";
import { MatchStatus } from "@prisma/client";
import { teamName } from "@/lib/display";
import { formatLeaderboardPlacement, getLeaderboard } from "@/lib/leaderboard";
import { formatMatchTime, formatPhase } from "@/lib/matches";
import { canViewPrediction, canViewPredictionBreakdown } from "@/lib/prediction-visibility";
import { prisma } from "@/lib/prisma";
import { normalizeUsername } from "@/lib/username";

export const dynamic = "force-dynamic";

type UserPageProps = {
  params: Promise<{
    username: string;
  }>;
};

function predictionResultClass(prediction: { pointsAwarded: number | null; exactScore: boolean; correctResult: boolean }) {
  if (prediction.pointsAwarded === null) return "";
  if (prediction.exactScore) return "prediction-result-exact";
  if (prediction.correctResult) return "prediction-result-winner";
  return "prediction-result-missed";
}

function pointsLabel(pointsAwarded: number | null) {
  if (pointsAwarded === null) return null;
  return pointsAwarded > 0
    ? `+${pointsAwarded} ${pointsAwarded === 1 ? "point" : "points"}`
    : "0 points";
}

export default async function UserPage({ params }: UserPageProps) {
  const viewer = await requireUser();
  const { username } = await params;
  const [profileUser, leaderboard, matches] = await Promise.all([
    prisma.user.findUnique({
      where: { normalizedUsername: normalizeUsername(decodeURIComponent(username)) },
      select: {
        id: true,
        username: true,
        hideFromLeaderboard: true,
        predictions: {
          select: {
            pointsAwarded: true,
            exactScore: true,
            correctResult: true,
          },
        },
      },
    }),
    getLeaderboard(),
    prisma.match.findMany({
      where: {
        tournament: { active: true },
        status: { notIn: [MatchStatus.CANCELLED, MatchStatus.ABANDONED] },
      },
      include: {
        homeTeam: true,
        awayTeam: true,
        predictions: {
          where: { user: { normalizedUsername: normalizeUsername(decodeURIComponent(username)) } },
          include: { predictedAdvancingTeam: true },
        },
      },
      orderBy: { kickoffAt: "asc" },
    }),
  ]);

  if (!profileUser || (profileUser.hideFromLeaderboard && profileUser.id !== viewer.id)) {
    notFound();
  }

  const visibleMatches = matches.filter((match) => {
    const prediction = match.predictions[0];

    if (prediction) {
      return canViewPrediction({
        viewerUserId: viewer.id,
        predictionUserId: profileUser.id,
        match,
      });
    }

    return canViewPredictionBreakdown({ viewerUserId: viewer.id, match });
  });
  const totalPoints = profileUser.predictions.reduce(
    (total, prediction) => total + (prediction.pointsAwarded ?? 0),
    0,
  );
  const placement = formatLeaderboardPlacement(
    leaderboard.find((player) => player.username === profileUser.username),
  );

  return (
    <main className="app-shell">
      <SiteNav />
      <section className="game-grid">
        <div className="page-title-row">
          <div className="section-heading">
            <p className="eyebrow">{profileUser.id === viewer.id ? "My picks" : "Player profile"}</p>
            <h1>{profileUser.username}</h1>
          </div>
          <div className="points-counter" aria-label="Total points">
            <span>Total points</span>
            <strong>{totalPoints}</strong>
            {placement ? <small>{placement}</small> : null}
          </div>
        </div>
        <div className="table-list">
          {visibleMatches.map((match) => {
            const prediction = match.predictions[0];

            return (
              <article
                className={`table-row ${prediction ? predictionResultClass(prediction) : "prediction-result-missed-pick"}`}
                key={match.id}
              >
                {canViewPredictionBreakdown({ viewerUserId: viewer.id, match }) ? (
                  <Link href={`/matches/${match.id}`}>
                    {teamName(match, "home")} vs {teamName(match, "away")}
                  </Link>
                ) : (
                  <span>
                    {teamName(match, "home")} vs {teamName(match, "away")}
                  </span>
                )}
                <span>
                  {formatPhase(match.phase)} · {formatMatchTime(match.kickoffAt)}
                </span>
                {prediction ? (
                  <strong>
                    {prediction.homeScore}-{prediction.awayScore}
                    {pointsLabel(prediction.pointsAwarded) ? (
                      <span className="points-pill">{pointsLabel(prediction.pointsAwarded)}</span>
                    ) : null}
                  </strong>
                ) : (
                  <strong>
                    Missed
                    <span className="points-pill">0 points</span>
                  </strong>
                )}
              </article>
            );
          })}
          {visibleMatches.length === 0 ? (
            <p>No locked or own predictions are visible yet.</p>
          ) : null}
        </div>
      </section>
    </main>
  );
}
