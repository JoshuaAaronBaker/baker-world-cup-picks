import Link from "next/link";
import { logOut } from "@/app/auth/actions";
import { PredictionForm } from "@/components/prediction-form";
import { requireUser } from "@/lib/auth";
import { getPredictionMatches, isMatchPredictable } from "@/lib/matches";

export const dynamic = "force-dynamic";

export default async function PredictionsPage() {
  const user = await requireUser();
  const matches = await getPredictionMatches(user.id);
  const availableMatches = matches.filter(isMatchPredictable);
  const predictedMatches = availableMatches.filter((match) => match.predictions.length > 0);

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
          Predicted {predictedMatches.length} of {availableMatches.length} available matches.
        </p>
        <div className="match-list">
          {matches.map((match) => (
            <PredictionForm key={match.id} match={match} />
          ))}
        </div>
      </section>
    </main>
  );
}
