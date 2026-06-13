import { UserRole } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { logOut } from "@/app/auth/actions";
import { MobileSiteNav } from "@/components/mobile-site-nav";
import { getCurrentUser } from "@/lib/auth";

export async function SiteNav() {
  const currentUser = await getCurrentUser();
  const signedIn = Boolean(currentUser);
  const isAdmin = currentUser?.role === UserRole.ADMIN;

  const brand = (
    <Link href="/" className="brand">
      <Image
        className="brand-logo"
        src="/brand-logo-transparent.png"
        alt="World Cup Pick’ems by Baker"
        width={882}
        height={321}
        priority
      />
    </Link>
  );
  const actions = (
    <>
      <Link href="/">Home</Link>
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
    </>
  );

  return <MobileSiteNav brand={brand} actions={actions} />;
}
