"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { isMatchLocked, isMatchPredictable, validateScoreValue } from "@/lib/matches";
import { prisma } from "@/lib/prisma";

export async function savePrediction(formData: FormData) {
  const user = await requireUser();
  const matchId = formData.get("matchId");

  if (typeof matchId !== "string") {
    throw new Error("Missing match.");
  }

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      homeTeam: true,
      awayTeam: true,
      predictions: {
        where: { userId: user.id },
      },
    },
  });

  if (!match) {
    throw new Error("Match not found.");
  }

  if (!isMatchPredictable(match) || isMatchLocked(match)) {
    throw new Error("This match is not open for predictions.");
  }

  const homeScore = validateScoreValue(formData.get("homeScore"));
  const awayScore = validateScoreValue(formData.get("awayScore"));

  if (homeScore === null || awayScore === null) {
    throw new Error("Enter scores from 0 to 20.");
  }

  await prisma.prediction.upsert({
    where: {
      userId_matchId: {
        userId: user.id,
        matchId,
      },
    },
    update: {
      homeScore,
      awayScore,
      pointsAwarded: null,
      exactScore: false,
      correctResult: false,
      status: "VALID",
    },
    create: {
      userId: user.id,
      matchId,
      homeScore,
      awayScore,
      status: "VALID",
    },
  });

  revalidatePath("/predictions");
  revalidatePath("/leaderboard");
}
