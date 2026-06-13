"use server";

import { MatchStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import {
  recalculateAllAdmin,
  recalculateMatchAdmin,
  reopenMatchPredictionsAdmin,
  updateMatchAdmin,
  updateUserAdmin,
} from "@/lib/admin";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function getNullableScore(formData: FormData, key: string) {
  const value = getString(formData, key).trim();

  if (!value) return null;

  const score = Number(value);

  if (!Number.isInteger(score) || score < 0 || score > 20) {
    throw new Error("Scores must be whole numbers from 0 to 20.");
  }

  return score;
}

export async function updateMatchAction(formData: FormData) {
  const admin = await requireAdmin();
  const matchId = getString(formData, "matchId");
  const kickoffAt = new Date(getString(formData, "kickoffAt"));
  const status = getString(formData, "status") as MatchStatus;

  if (!matchId || Number.isNaN(kickoffAt.getTime()) || !Object.values(MatchStatus).includes(status)) {
    throw new Error("Invalid match update.");
  }

  await updateMatchAdmin({
    actorId: admin.id,
    matchId,
    kickoffAt,
    status,
    homeScore: getNullableScore(formData, "homeScore"),
    awayScore: getNullableScore(formData, "awayScore"),
    advancingTeamId: getString(formData, "advancingTeamId") || null,
  });

  revalidatePath("/admin");
  revalidatePath("/leaderboard");
  revalidatePath("/predictions");
}

export async function reopenMatchAction(formData: FormData) {
  const admin = await requireAdmin();
  await reopenMatchPredictionsAdmin({
    actorId: admin.id,
    matchId: getString(formData, "matchId"),
  });

  revalidatePath("/admin");
  revalidatePath("/predictions");
}

export async function recalculateMatchAction(formData: FormData) {
  const admin = await requireAdmin();
  await recalculateMatchAdmin({
    actorId: admin.id,
    matchId: getString(formData, "matchId"),
  });

  revalidatePath("/admin");
  revalidatePath("/leaderboard");
}

export async function recalculateAllAction() {
  const admin = await requireAdmin();
  await recalculateAllAdmin({ actorId: admin.id });

  revalidatePath("/admin");
  revalidatePath("/leaderboard");
}

export async function updateUserAction(formData: FormData) {
  const admin = await requireAdmin();

  await updateUserAdmin({
    actorId: admin.id,
    userId: getString(formData, "userId"),
    disabled: formData.get("disabled") === "on",
    hideFromLeaderboard: formData.get("hideFromLeaderboard") === "on",
  });

  revalidatePath("/admin");
  revalidatePath("/leaderboard");
}
