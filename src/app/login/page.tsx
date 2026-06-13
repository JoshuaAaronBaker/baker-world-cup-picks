import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { SiteNav } from "@/components/site-nav";

export default function LoginPage() {
  return (
    <main className="app-shell">
      <SiteNav />
      <section className="game-grid centered-page">
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
