import Link from "next/link";
import { AuthForm } from "@/components/auth-form";

export default function SignupPage() {
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
        <AuthForm mode="signup" />
        <p className="form-note">
          Usernames are public and locked after signup. Already joined?{" "}
          <Link href="/login">Log in</Link>.
        </p>
      </section>
    </main>
  );
}
