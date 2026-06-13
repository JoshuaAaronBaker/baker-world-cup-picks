import Link from "next/link";
import { AuthForm } from "@/components/auth-form";

type SignupPageProps = {
  searchParams?: Promise<{
    next?: string;
  }>;
};

function getSignupRedirect(next?: string) {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/predictions";
  }

  return next;
}

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const params = await searchParams;
  const redirectTo = getSignupRedirect(params?.next);

  return (
    <main className="app-shell">
      <nav className="topbar" aria-label="Primary navigation">
        <Link href="/" className="brand">
          <span className="brand-mark">B</span>
          <span>Baker&apos;s World Cup Picks</span>
        </Link>
      </nav>
      <section className="game-grid">
        <div className="section-heading">
          <p className="eyebrow">Join the table</p>
          <h1>Sign up</h1>
        </div>
        <AuthForm mode="signup" redirectTo={redirectTo} />
        <p className="form-note">
          Usernames are public and locked after signup. Already joined?{" "}
          <Link href="/login">Log in</Link>.
        </p>
      </section>
    </main>
  );
}
