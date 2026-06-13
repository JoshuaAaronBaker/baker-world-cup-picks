import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { SiteNav } from "@/components/site-nav";

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
      <SiteNav />
      <section className="game-grid centered-page">
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
