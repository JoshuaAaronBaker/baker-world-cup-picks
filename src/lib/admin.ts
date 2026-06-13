import { AuditAction, MatchStatus } from "@prisma/client";
import { recalculateAllScores, recalculateMatchScores } from "@/lib/score-matches";
import { prisma } from "@/lib/prisma";

type OverrideMap = Record<string, true>;

function parseOverrides(value: unknown): OverrideMap {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).filter(([, fieldValue]) => fieldValue === true),
  ) as OverrideMap;
}

function withOverrides(existing: unknown, fields: string[]) {
  return {
    ...parseOverrides(existing),
    ...Object.fromEntries(fields.map((field) => [field, true])),
  };
}

export async function updateMatchAdmin(input: {
  actorId: string;
  matchId: string;
  kickoffAt: Date;
  status: MatchStatus;
  homeScore: number | null;
  awayScore: number | null;
  advancingTeamId: string | null;
}) {
  const existingMatch = await prisma.match.findUnique({
    where: { id: input.matchId },
    select: { manualOverrides: true },
  });

  if (!existingMatch) {
    throw new Error("Match not found.");
  }

  const changedFields = ["kickoffAt", "status", "homeScore", "awayScore", "advancingTeamId"];
  const match = await prisma.match.update({
    where: { id: input.matchId },
    data: {
      kickoffAt: input.kickoffAt,
      status: input.status,
      homeScore: input.homeScore,
      awayScore: input.awayScore,
      advancingTeamId: input.advancingTeamId || null,
      manualOverrides: withOverrides(existingMatch.manualOverrides, changedFields),
    },
  });

  await prisma.auditLog.create({
    data: {
      action: AuditAction.ADMIN_OVERRIDE,
      actorId: input.actorId,
      targetId: input.matchId,
      metadata: { fields: changedFields },
    },
  });

  if (
    match.status === MatchStatus.FINAL ||
    match.status === MatchStatus.CANCELLED ||
    match.status === MatchStatus.ABANDONED
  ) {
    await recalculateMatchScores(match.id);
  }

  return match;
}

export async function reopenMatchPredictionsAdmin(input: { actorId: string; matchId: string }) {
  const match = await prisma.match.findUnique({
    where: { id: input.matchId },
    select: { manualOverrides: true },
  });

  if (!match) {
    throw new Error("Match not found.");
  }

  const updatedMatch = await prisma.match.update({
    where: { id: input.matchId },
    data: {
      predictionsReopened: true,
      manualOverrides: withOverrides(match.manualOverrides, ["predictionsReopened"]),
    },
  });

  await prisma.auditLog.create({
    data: {
      action: AuditAction.REOPEN_PREDICTIONS,
      actorId: input.actorId,
      targetId: input.matchId,
      metadata: { predictionsReopened: true },
    },
  });

  return updatedMatch;
}

export async function recalculateMatchAdmin(input: { actorId: string; matchId: string }) {
  const result = await recalculateMatchScores(input.matchId);

  await prisma.auditLog.create({
    data: {
      action: AuditAction.RECALCULATE_SCORES,
      actorId: input.actorId,
      targetId: input.matchId,
      metadata: result,
    },
  });

  return result;
}

export async function recalculateAllAdmin(input: { actorId: string }) {
  const result = await recalculateAllScores();

  await prisma.auditLog.create({
    data: {
      action: AuditAction.RECALCULATE_SCORES,
      actorId: input.actorId,
      metadata: { all: true, ...result },
    },
  });

  return result;
}

export async function updateUserAdmin(input: {
  actorId: string;
  userId: string;
  disabled: boolean;
  hideFromLeaderboard: boolean;
}) {
  const user = await prisma.user.update({
    where: { id: input.userId },
    data: {
      disabled: input.disabled,
      hideFromLeaderboard: input.hideFromLeaderboard,
    },
  });

  await prisma.auditLog.create({
    data: {
      action: input.disabled ? AuditAction.USER_DISABLED : AuditAction.USER_HIDDEN,
      actorId: input.actorId,
      targetId: input.userId,
      metadata: {
        disabled: input.disabled,
        hideFromLeaderboard: input.hideFromLeaderboard,
      },
    },
  });

  return user;
}
