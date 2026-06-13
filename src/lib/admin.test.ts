import { AuditAction, MatchPhase, MatchStatus, PrismaClient, UserRole } from "@prisma/client";
import { beforeEach, describe, expect, it } from "vitest";
import {
  recalculateMatchAdmin,
  reopenMatchPredictionsAdmin,
  updateMatchAdmin,
  updateUserAdmin,
} from "@/lib/admin";

const prisma = new PrismaClient();

async function createAdminTestWorld() {
  const adminUsername = `admin_${crypto.randomUUID()}`;
  const username = `user_${crypto.randomUUID()}`;
  const admin = await prisma.user.create({
    data: {
      username: adminUsername,
      normalizedUsername: adminUsername,
      passwordHash: "hash",
      role: UserRole.ADMIN,
    },
  });
  const user = await prisma.user.create({
    data: {
      username,
      normalizedUsername: username,
      passwordHash: "hash",
    },
  });
  const tournament = await prisma.tournament.create({
    data: {
      name: "Admin Test",
      slug: `admin-test-${crypto.randomUUID()}`,
      year: 2026,
    },
  });
  const home = await prisma.team.create({
    data: { tournamentId: tournament.id, name: "Home", countryCode: "HM", flagEmoji: "🏠" },
  });
  const away = await prisma.team.create({
    data: { tournamentId: tournament.id, name: "Away", countryCode: "AW", flagEmoji: "✈️" },
  });
  const match = await prisma.match.create({
    data: {
      tournamentId: tournament.id,
      phase: MatchPhase.GROUP_STAGE,
      kickoffAt: new Date("2026-06-12T20:00:00.000Z"),
      homeTeamId: home.id,
      awayTeamId: away.id,
    },
  });

  return { admin, user, tournament, home, away, match };
}

beforeEach(async () => {
  await prisma.auditLog.deleteMany({
    where: {
      OR: [
        { actor: { username: { startsWith: "admin_" } } },
        { actor: { username: { startsWith: "user_" } } },
      ],
    },
  });
  await prisma.prediction.deleteMany({ where: { user: { username: { startsWith: "user_" } } } });
  await prisma.match.deleteMany({ where: { tournament: { slug: { startsWith: "admin-test-" } } } });
  await prisma.team.deleteMany({ where: { tournament: { slug: { startsWith: "admin-test-" } } } });
  await prisma.tournament.deleteMany({ where: { slug: { startsWith: "admin-test-" } } });
  await prisma.user.deleteMany({
    where: {
      OR: [{ username: { startsWith: "admin_" } }, { username: { startsWith: "user_" } }],
    },
  });
});

describe("admin controls", () => {
  it("updates match fields, tracks manual overrides, recalculates final scores, and audits", async () => {
    const { admin, user, match } = await createAdminTestWorld();
    await prisma.prediction.create({
      data: { userId: user.id, matchId: match.id, homeScore: 2, awayScore: 1 },
    });

    await updateMatchAdmin({
      actorId: admin.id,
      matchId: match.id,
      kickoffAt: new Date("2026-06-13T20:00:00.000Z"),
      status: MatchStatus.FINAL,
      homeScore: 2,
      awayScore: 1,
      advancingTeamId: null,
    });

    const updatedMatch = await prisma.match.findUniqueOrThrow({ where: { id: match.id } });
    const prediction = await prisma.prediction.findFirstOrThrow({ where: { matchId: match.id } });
    const audit = await prisma.auditLog.findFirstOrThrow({
      where: { targetId: match.id, action: AuditAction.ADMIN_OVERRIDE },
    });

    expect(updatedMatch.status).toBe(MatchStatus.FINAL);
    expect(updatedMatch.manualOverrides).toMatchObject({
      kickoffAt: true,
      status: true,
      homeScore: true,
      awayScore: true,
      advancingTeamId: true,
    });
    expect(prediction.pointsAwarded).toBe(3);
    expect(audit.actorId).toBe(admin.id);
  });

  it("reopens match predictions with an override and audit record", async () => {
    const { admin, match } = await createAdminTestWorld();

    await reopenMatchPredictionsAdmin({ actorId: admin.id, matchId: match.id });

    const updatedMatch = await prisma.match.findUniqueOrThrow({ where: { id: match.id } });
    const audit = await prisma.auditLog.findFirstOrThrow({
      where: { targetId: match.id, action: AuditAction.REOPEN_PREDICTIONS },
    });

    expect(updatedMatch.predictionsReopened).toBe(true);
    expect(updatedMatch.manualOverrides).toMatchObject({ predictionsReopened: true });
    expect(audit.actorId).toBe(admin.id);
  });

  it("writes audit records for recalculation and user moderation", async () => {
    const { admin, user, match } = await createAdminTestWorld();

    await recalculateMatchAdmin({ actorId: admin.id, matchId: match.id });
    await updateUserAdmin({
      actorId: admin.id,
      userId: user.id,
      disabled: true,
      hideFromLeaderboard: true,
    });

    const updatedUser = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    const audits = await prisma.auditLog.findMany({
      where: { actorId: admin.id },
      orderBy: { createdAt: "asc" },
    });

    expect(updatedUser.disabled).toBe(true);
    expect(updatedUser.hideFromLeaderboard).toBe(true);
    expect(audits.map((audit) => audit.action)).toEqual([
      AuditAction.RECALCULATE_SCORES,
      AuditAction.USER_DISABLED,
    ]);
  });
});
