import Link from "next/link";
import { MatchStatus } from "@prisma/client";
import { logOut } from "@/app/auth/actions";
import {
  recalculateAllAction,
  recalculateMatchAction,
  reopenMatchAction,
  syncFootballDataAction,
  updateMatchAction,
  updateUserAction,
} from "@/app/admin/actions";
import { requireAdmin } from "@/lib/auth";
import { teamName } from "@/lib/display";
import { formatPhase } from "@/lib/matches";
import { prisma } from "@/lib/prisma";

type AdminPageProps = {
  searchParams?: Promise<{
    sync?: string;
  }>;
};

function datetimeLocalValue(date: Date) {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  await requireAdmin();
  const params = await searchParams;
  const [matches, teams, users, auditLogs, syncRuns] = await Promise.all([
    prisma.match.findMany({
      where: { tournament: { active: true } },
      include: { homeTeam: true, awayTeam: true, advancingTeam: true },
      orderBy: { kickoffAt: "asc" },
    }),
    prisma.team.findMany({
      where: { tournament: { active: true } },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({
      orderBy: { username: "asc" },
    }),
    prisma.auditLog.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      include: { actor: { select: { username: true } } },
    }),
    prisma.syncRun.findMany({
      take: 5,
      orderBy: { startedAt: "desc" },
    }),
  ]);

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
        {params?.sync === "success" ? (
          <p className="form-success">football-data sync finished successfully.</p>
        ) : null}
        {params?.sync === "failed" ? (
          <p className="form-error">football-data sync failed. Check the provider sync table below.</p>
        ) : null}
        <div className="admin-actions">
          <form action={syncFootballDataAction}>
            <button className="button" type="submit">
              Sync football-data
            </button>
          </form>
          <form action={recalculateAllAction}>
            <button className="ghost-button" type="submit">
              Recalculate all scores
            </button>
          </form>
        </div>

        <section className="admin-section" aria-labelledby="admin-sync">
          <h2 id="admin-sync">Provider sync</h2>
          <div className="table-list">
            {syncRuns.length ? (
              syncRuns.map((syncRun) => (
                <article className="table-row" key={syncRun.id}>
                  <strong>{syncRun.status}</strong>
                  <span>{syncRun.provider}</span>
                  <span>
                    {syncRun.finishedAt?.toLocaleString() ?? syncRun.startedAt.toLocaleString()} ·{" "}
                    {syncRun.message ?? "Running"}
                  </span>
                </article>
              ))
            ) : (
              <article className="table-row">
                <strong>No syncs yet</strong>
                <span>football-data</span>
                <span>Ready</span>
              </article>
            )}
          </div>
        </section>

        <section className="admin-section" aria-labelledby="admin-matches">
          <h2 id="admin-matches">Matches</h2>
          <div className="admin-list">
            {matches.map((match) => (
              <article className="admin-card" key={match.id}>
                <form action={updateMatchAction} className="admin-match-form">
                  <input type="hidden" name="matchId" value={match.id} />
                  <div>
                    <p className="match-time">{formatPhase(match.phase)}</p>
                    <h3>
                      {teamName(match, "home")} vs {teamName(match, "away")}
                    </h3>
                    <p className="form-note">
                      Overrides:{" "}
                      {match.manualOverrides
                        ? Object.keys(match.manualOverrides as Record<string, unknown>).join(", ")
                        : "none"}
                    </p>
                  </div>
                  <label>
                    Kickoff
                    <input name="kickoffAt" type="datetime-local" defaultValue={datetimeLocalValue(match.kickoffAt)} />
                  </label>
                  <label>
                    Status
                    <select name="status" defaultValue={match.status}>
                      {Object.values(MatchStatus).map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Home
                    <input name="homeScore" type="number" min="0" max="20" defaultValue={match.homeScore ?? ""} />
                  </label>
                  <label>
                    Away
                    <input name="awayScore" type="number" min="0" max="20" defaultValue={match.awayScore ?? ""} />
                  </label>
                  <label>
                    Advances
                    <select name="advancingTeamId" defaultValue={match.advancingTeamId ?? ""}>
                      <option value="">None</option>
                      {teams.map((team) => (
                        <option key={team.id} value={team.id}>
                          {team.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button className="button small" type="submit">
                    Save
                  </button>
                </form>
                <div className="admin-actions">
                  <form action={reopenMatchAction}>
                    <input type="hidden" name="matchId" value={match.id} />
                    <button className="ghost-button small" type="submit">
                      Reopen
                    </button>
                  </form>
                  <form action={recalculateMatchAction}>
                    <input type="hidden" name="matchId" value={match.id} />
                    <button className="ghost-button small" type="submit">
                      Recalculate
                    </button>
                  </form>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="admin-section" aria-labelledby="admin-users">
          <h2 id="admin-users">Users</h2>
          <div className="admin-list">
            {users.map((targetUser) => (
              <form action={updateUserAction} className="admin-user-row" key={targetUser.id}>
                <input type="hidden" name="userId" value={targetUser.id} />
                <strong>{targetUser.username}</strong>
                <label>
                  <input name="disabled" type="checkbox" defaultChecked={targetUser.disabled} /> Disabled
                </label>
                <label>
                  <input
                    name="hideFromLeaderboard"
                    type="checkbox"
                    defaultChecked={targetUser.hideFromLeaderboard}
                  />{" "}
                  Hide from leaderboard
                </label>
                <button className="button small" type="submit">
                  Save
                </button>
              </form>
            ))}
          </div>
        </section>

        <section className="admin-section" aria-labelledby="admin-audit">
          <h2 id="admin-audit">Recent activity</h2>
          <div className="table-list">
            {auditLogs.map((log) => (
              <article className="table-row" key={log.id}>
                <strong>{log.action}</strong>
                <span>{log.actor?.username ?? "system"}</span>
                <span>{log.createdAt.toLocaleString()}</span>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
