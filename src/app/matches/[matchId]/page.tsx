import Link from "next/link";
import { notFound } from "next/navigation";
import { logOut } from "@/app/auth/actions";
import { requireUser } from "@/lib/auth";
import { plainTeamName, teamName } from "@/lib/display";
import { formatMatchTime, formatPhase } from "@/lib/matches";
import { canViewPredictionBreakdown } from "@/lib/prediction-visibility";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type MatchPageProps = {
  params: Promise<{
    matchId: string;
  }>;
};

export default async function MatchPage({ params }: MatchPageProps) {
  const user = await requireUser();
  const { matchId } = await params;
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      homeTeam: true,
      awayTeam: true,
      advancingTeam: true,
      predictions: {
        include: {
          user: { select: { username: true } },
          predictedAdvancingTeam: true,
        },
        orderBy: [{ pointsAwarded: "desc" }, { updatedAt: "asc" }],
      },
    },
  });

  if (!match) {
    notFound();
  }

  if (!canViewPredictionBreakdown({ viewerUserId: user.id, match })) {
    notFound();
  }

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
          <p className="eyebrow">
            {formatPhase(match.phase)} · {formatMatchTime(match.kickoffAt)}
          </p>
          <h1>
            {teamName(match, "home")} vs {teamName(match, "away")}
          </h1>
        </div>
        {match.homeScore !== null && match.awayScore !== null ? (
          <p className="progress-note">
            Final score: {match.homeScore}-{match.awayScore}
            {match.advancingTeam ? ` · ${match.advancingTeam.name} advanced` : ""}
          </p>
        ) : (
          <p className="progress-note">Predictions locked. Result pending.</p>
        )}
        <div className="table-list">
          {match.predictions.map((prediction) => (
            <article className="table-row" key={prediction.id}>
              <Link className="username-link" href={`/users/${prediction.user.username}`}>
                {prediction.user.username}
              </Link>
              <span>
                {prediction.homeScore}-{prediction.awayScore}
                {prediction.predictedAdvancingTeam
                  ? ` · ${prediction.predictedAdvancingTeam.name} advances`
                  : ""}
              </span>
              <strong>{prediction.pointsAwarded ?? 0} pts</strong>
            </article>
          ))}
          {match.predictions.length === 0 ? <p>No predictions for this match yet.</p> : null}
        </div>
        <p className="form-note">
          {plainTeamName(match, "home")} and {plainTeamName(match, "away")} predictions are visible
          because this match is locked.
        </p>
      </section>
    </main>
  );
}
