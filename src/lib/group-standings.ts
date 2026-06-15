import { MatchPhase, MatchStatus, type Team } from "@prisma/client";
import { teamFlagEmoji } from "@/lib/display";
import { prisma } from "@/lib/prisma";

type GroupMatch = {
  awayScore: number | null;
  awayTeam: Team | null;
  homeScore: number | null;
  homeTeam: Team | null;
  latestProviderPayload: unknown;
  status: MatchStatus;
};

type StandingsScore = {
  away: number;
  home: number;
};

export type GroupStandingRow = {
  draws: number;
  goalDifference: number;
  goalsAgainst: number;
  goalsFor: number;
  losses: number;
  played: number;
  points: number;
  position: number;
  team: {
    countryCode: string;
    flagEmoji: string;
    name: string;
  };
  wins: number;
};

export type GroupStanding = {
  group: string;
  label: string;
  rows: GroupStandingRow[];
};

function groupLabel(group: string) {
  const suffix = group.replace(/^GROUP_/, "");
  return `Group ${suffix}`;
}

function providerGroup(payload: unknown) {
  if (!payload || typeof payload !== "object" || !("group" in payload)) return null;
  const group = (payload as { group?: unknown }).group;

  return typeof group === "string" ? group : null;
}

function providerStatus(payload: unknown) {
  if (!payload || typeof payload !== "object" || !("status" in payload)) return null;
  const status = (payload as { status?: unknown }).status;

  return typeof status === "string" ? status : null;
}

function providerFullTimeScore(payload: unknown): StandingsScore | null {
  if (!payload || typeof payload !== "object" || !("score" in payload)) return null;
  const score = (payload as { score?: unknown }).score;

  if (!score || typeof score !== "object" || !("fullTime" in score)) return null;
  const fullTime = (score as { fullTime?: unknown }).fullTime;

  if (!fullTime || typeof fullTime !== "object") return null;
  const { away, home } = fullTime as { away?: unknown; home?: unknown };

  if (typeof away !== "number" || typeof home !== "number") return null;

  return { away, home };
}

function standingsScore(match: GroupMatch): StandingsScore | null {
  if (
    match.status === MatchStatus.FINAL &&
    match.homeScore !== null &&
    match.awayScore !== null
  ) {
    return { away: match.awayScore, home: match.homeScore };
  }

  const providerMatchStatus = providerStatus(match.latestProviderPayload);
  const providerScore = providerFullTimeScore(match.latestProviderPayload);

  if (!providerScore) return null;

  if (
    providerMatchStatus === "FINISHED" ||
    providerMatchStatus === "IN_PLAY" ||
    providerMatchStatus === "PAUSED"
  ) {
    return providerScore;
  }

  return null;
}

function createRow(team: Team): Omit<GroupStandingRow, "position"> {
  return {
    draws: 0,
    goalDifference: 0,
    goalsAgainst: 0,
    goalsFor: 0,
    losses: 0,
    played: 0,
    points: 0,
    team: {
      countryCode: team.countryCode,
      flagEmoji: teamFlagEmoji(team),
      name: team.name,
    },
    wins: 0,
  };
}

function applyResult(row: Omit<GroupStandingRow, "position">, goalsFor: number, goalsAgainst: number) {
  row.played += 1;
  row.goalsFor += goalsFor;
  row.goalsAgainst += goalsAgainst;
  row.goalDifference = row.goalsFor - row.goalsAgainst;

  if (goalsFor > goalsAgainst) {
    row.wins += 1;
    row.points += 3;
  } else if (goalsFor === goalsAgainst) {
    row.draws += 1;
    row.points += 1;
  } else {
    row.losses += 1;
  }
}

export function calculateGroupStandings(matches: GroupMatch[]): GroupStanding[] {
  const groups = new Map<string, Map<string, Omit<GroupStandingRow, "position">>>();

  for (const match of matches) {
    const group = providerGroup(match.latestProviderPayload);

    if (!group || !match.homeTeam || !match.awayTeam) continue;

    const rows = groups.get(group) ?? new Map<string, Omit<GroupStandingRow, "position">>();
    const homeRow = rows.get(match.homeTeam.id) ?? createRow(match.homeTeam);
    const awayRow = rows.get(match.awayTeam.id) ?? createRow(match.awayTeam);
    rows.set(match.homeTeam.id, homeRow);
    rows.set(match.awayTeam.id, awayRow);
    groups.set(group, rows);

    const score = standingsScore(match);

    if (!score) continue;

    applyResult(homeRow, score.home, score.away);
    applyResult(awayRow, score.away, score.home);
  }

  return [...groups.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([group, rows]) => ({
      group,
      label: groupLabel(group),
      rows: [...rows.values()]
        .sort((left, right) => {
          if (right.points !== left.points) return right.points - left.points;
          if (right.goalDifference !== left.goalDifference) {
            return right.goalDifference - left.goalDifference;
          }
          if (right.goalsFor !== left.goalsFor) return right.goalsFor - left.goalsFor;
          return left.team.name.localeCompare(right.team.name);
        })
        .map((row, index) => ({ ...row, position: index + 1 })),
    }));
}

export async function getGroupStandings() {
  const matches = await prisma.match.findMany({
    where: {
      tournament: { active: true },
      phase: MatchPhase.GROUP_STAGE,
      status: { notIn: [MatchStatus.CANCELLED, MatchStatus.ABANDONED] },
    },
    include: {
      awayTeam: true,
      homeTeam: true,
    },
    orderBy: { kickoffAt: "asc" },
  });

  return calculateGroupStandings(matches);
}
