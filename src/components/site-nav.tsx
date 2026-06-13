import { UserRole } from "@prisma/client";
import Link from "next/link";
import { logOut } from "@/app/auth/actions";
import { getCurrentUser } from "@/lib/auth";

export async function SiteNav() {
  const currentUser = await getCurrentUser();
  const signedIn = Boolean(currentUser);
  const isAdmin = currentUser?.role === UserRole.ADMIN;

  return (
    <nav className="topbar" aria-label="Primary navigation">
      <Link href="/" className="brand">
        <span className="brand-mark">B</span>
        <span>Baker&apos;s World Cup Picks</span>
      </Link>
      <div className="nav-actions">
        <Link href="/leaderboard">Leaderboard</Link>
        {currentUser ? <Link href={`/users/${currentUser.username}`}>My picks</Link> : null}
        {isAdmin ? <Link href="/admin">Admin</Link> : null}
        {signedIn ? (
          <form action={logOut}>
            <button className="ghost-button small" type="submit">
              Log out
            </button>
          </form>
        ) : (
          <>
            <Link href="/login">Log in</Link>
            <Link href="/signup" className="button small">
              Sign up
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
