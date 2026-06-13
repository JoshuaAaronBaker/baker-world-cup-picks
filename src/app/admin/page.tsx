import Link from "next/link";
import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { logOut } from "@/app/auth/actions";
import { requireUser } from "@/lib/auth";

export default async function AdminPage() {
  const user = await requireUser();

  if (user.role !== UserRole.ADMIN) {
    redirect("/predictions");
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
          <p className="eyebrow">Admin</p>
          <h1>Match control</h1>
        </div>
        <p>
          Lightweight match editing, sync, recalculation, and user controls will
          land in the admin slice.
        </p>
      </section>
    </main>
  );
}
