import Link from "next/link";
import { AuthForm } from "@/components/auth-form";

export default function LoginPage() {
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
          <p className="eyebrow">Welcome back</p>
          <h1>Log in</h1>
        </div>
        <AuthForm mode="login" />
        <p className="form-note">
          New here? <Link href="/signup">Create your username</Link>.
        </p>
      </section>
    </main>
  );
}
