import { prisma } from "@/lib/prisma";
import { formatAppDateTimeLong } from "@/lib/datetime";

export type PublicSyncStatus = {
  lastSuccessfulSyncAt: Date | null;
  label: string;
};

export function formatSyncStatus(syncRun: { finishedAt: Date | null } | null): PublicSyncStatus {
  if (!syncRun?.finishedAt) {
    return {
      lastSuccessfulSyncAt: null,
      label: "Scores update nightly after match days.",
    };
  }

  return {
    lastSuccessfulSyncAt: syncRun.finishedAt,
    label: `Scores last updated ${formatAppDateTimeLong(syncRun.finishedAt)}.`,
  };
}

export async function getPublicSyncStatus() {
  const syncRun = await prisma.syncRun.findFirst({
    where: {
      provider: "football-data",
      status: "SUCCEEDED",
      finishedAt: { not: null },
    },
    orderBy: { finishedAt: "desc" },
    select: { finishedAt: true },
  });

  return formatSyncStatus(syncRun);
}
