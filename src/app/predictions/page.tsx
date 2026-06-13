import Link from "next/link";
import { logOut } from "@/app/auth/actions";
import { requireUser } from "@/lib/auth";

export default async function PredictionsPage() {
  const user = await requireUser();

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
        <p>
          Prediction entry is the next vertical slice. Your account and session
          are ready for it.
        </p>
      </section>
    </main>
  );
}
