import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteNav } from "@/components/site-nav";
import { requireUser } from "@/lib/auth";
import { teamName } from "@/lib/display";
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

export default async function UserPage({ params }: UserPageProps) {
  const viewer = await requireUser();
  const { username } = await params;
  const profileUser = await prisma.user.findUnique({
    where: { normalizedUsername: normalizeUsername(decodeURIComponent(username)) },
    include: {
      predictions: {
        include: {
          predictedAdvancingTeam: true,
          match: {
            include: {
              homeTeam: true,
              awayTeam: true,
            },
          },
        },
        orderBy: { match: { kickoffAt: "asc" } },
      },
    },
  });

  if (!profileUser || (profileUser.hideFromLeaderboard && profileUser.id !== viewer.id)) {
    notFound();
  }

  const visiblePredictions = profileUser.predictions.filter((prediction) =>
    canViewPrediction({
      viewerUserId: viewer.id,
      predictionUserId: profileUser.id,
      match: prediction.match,
    }),
  );
  const totalPoints = profileUser.predictions.reduce(
    (total, prediction) => total + (prediction.pointsAwarded ?? 0),
    0,
  );

  return (
    <main className="app-shell">
      <SiteNav />
      <section className="game-grid">
        <div className="section-heading">
          <p className="eyebrow">{profileUser.id === viewer.id ? "My picks" : "Player profile"}</p>
          <h1>{profileUser.username}</h1>
        </div>
        <div className="points-counter" aria-label="Total points">
          <span>Total points</span>
          <strong>{totalPoints}</strong>
        </div>
        <div className="table-list">
          {visiblePredictions.map((prediction) => (
            <article className={`table-row ${predictionResultClass(prediction)}`} key={prediction.id}>
              {canViewPredictionBreakdown({ viewerUserId: viewer.id, match: prediction.match }) ? (
                <Link href={`/matches/${prediction.match.id}`}>
                  {teamName(prediction.match, "home")} vs {teamName(prediction.match, "away")}
                </Link>
              ) : (
                <span>
                  {teamName(prediction.match, "home")} vs {teamName(prediction.match, "away")}
                </span>
              )}
              <span>
                {formatPhase(prediction.match.phase)} · {formatMatchTime(prediction.match.kickoffAt)}
              </span>
              <strong>
                {prediction.homeScore}-{prediction.awayScore}
                {prediction.pointsAwarded !== null ? ` · ${prediction.pointsAwarded} pts` : ""}
              </strong>
            </article>
          ))}
          {visiblePredictions.length === 0 ? (
            <p>No locked or own predictions are visible yet.</p>
          ) : null}
        </div>
      </section>
    </main>
  );
}
