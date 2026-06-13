import { syncFootballDataWorldCup } from "@/lib/providers/football-data";
import { prisma } from "@/lib/prisma";

const PACIFIC_TIME_ZONE = "America/Los_Angeles";

type NightlySyncRunner = () => Promise<unknown>;

export type NightlySyncResult =
  | { status: "skipped"; reason: "not-a-match-day" }
  | { status: "synced"; result: unknown };

export function getPacificDayRange(date: Date) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: PACIFIC_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = Object.fromEntries(
    formatter.formatToParts(date).map((part) => [part.type, part.value]),
  );
  const pacificDate = `${parts.year}-${parts.month}-${parts.day}`;

  return {
    start: new Date(`${pacificDate}T00:00:00-07:00`),
    end: new Date(`${pacificDate}T23:59:59.999-07:00`),
  };
}

export async function hasActiveMatchOnPacificDay(date: Date) {
  const { start, end } = getPacificDayRange(date);
  const matchCount = await prisma.match.count({
    where: {
      tournament: { active: true },
      kickoffAt: {
        gte: start,
        lte: end,
      },
    },
  });

  return matchCount > 0;
}

export async function runNightlyScoreSync(input: {
  now?: Date;
  syncRunner?: NightlySyncRunner;
} = {}): Promise<NightlySyncResult> {
  const now = input.now ?? new Date();
  const isMatchDay = await hasActiveMatchOnPacificDay(now);

  if (!isMatchDay) {
    return { status: "skipped", reason: "not-a-match-day" };
  }

  const result = await (input.syncRunner ?? syncFootballDataWorldCup)();

  return { status: "synced", result };
}
