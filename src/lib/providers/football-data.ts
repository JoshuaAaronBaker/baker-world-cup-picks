import {
  AuditAction,
  MatchPhase,
  MatchStatus,
  type Match,
  type Prisma,
  type Team,
} from "@prisma/client";
import { recalculateMatchScores } from "@/lib/score-matches";
import { prisma } from "@/lib/prisma";

const FOOTBALL_DATA_PROVIDER = "football-data";
const FOOTBALL_DATA_WC_MATCHES_URL =
  "https://api.football-data.org/v4/competitions/WC/matches?season=2026";
const TLA_FLAG_EMOJI: Record<string, string> = {
  ALG: "🇩🇿",
  ARG: "🇦🇷",
  AUS: "🇦🇺",
  AUT: "🇦🇹",
  BEL: "🇧🇪",
  BIH: "🇧🇦",
  BRA: "🇧🇷",
  CAN: "🇨🇦",
  CIV: "🇨🇮",
  COD: "🇨🇩",
  COL: "🇨🇴",
  CPV: "🇨🇻",
  CRO: "🇭🇷",
  CUW: "🇨🇼",
  CZE: "🇨🇿",
  ECU: "🇪🇨",
  EGY: "🇪🇬",
  ENG: "\u{1F3F4}\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F}",
  ESP: "🇪🇸",
  FRA: "🇫🇷",
  GER: "🇩🇪",
  GHA: "🇬🇭",
  HAI: "🇭🇹",
  IRN: "🇮🇷",
  IRQ: "🇮🇶",
  JOR: "🇯🇴",
  JPN: "🇯🇵",
  KOR: "🇰🇷",
  KSA: "🇸🇦",
  MAR: "🇲🇦",
  MEX: "🇲🇽",
  NED: "🇳🇱",
  NOR: "🇳🇴",
  NZL: "🇳🇿",
  PAN: "🇵🇦",
  PAR: "🇵🇾",
  POR: "🇵🇹",
  QAT: "🇶🇦",
  RSA: "🇿🇦",
  SCO: "\u{1F3F4}\u{E0067}\u{E0062}\u{E0073}\u{E0063}\u{E0074}\u{E007F}",
  SEN: "🇸🇳",
  SUI: "🇨🇭",
  SWE: "🇸🇪",
  TUN: "🇹🇳",
  TUR: "🇹🇷",
  URY: "🇺🇾",
  USA: "🇺🇸",
  UZB: "🇺🇿",
};

type ProviderTeam = {
  id: number | null;
  name: string | null;
  tla?: string | null;
  shortName?: string | null;
};

type ProviderScore = {
  winner?: "HOME_TEAM" | "AWAY_TEAM" | "DRAW" | null;
  fullTime?: {
    home: number | null;
    away: number | null;
  } | null;
};

export type FootballDataMatch = {
  id: number;
  utcDate: string;
  status: string;
  matchday?: number | null;
  stage?: string | null;
  group?: string | null;
  homeTeam: ProviderTeam;
  awayTeam: ProviderTeam;
  score?: ProviderScore | null;
};

export type FootballDataMatchesPayload = {
  matches: FootballDataMatch[];
};

type SyncOptions = {
  actorId?: string;
  tournamentSlug?: string;
  tournamentName?: string;
  active?: boolean;
};

type SyncPayloadOptions = SyncOptions & {
  provider?: string;
};

type TeamByProviderId = Map<string, Team>;

export function mapFootballDataStage(stage: string | null | undefined): MatchPhase {
  switch (stage) {
    case "LAST_32":
      return MatchPhase.ROUND_OF_32;
    case "LAST_16":
      return MatchPhase.ROUND_OF_16;
    case "QUARTER_FINALS":
      return MatchPhase.QUARTER_FINAL;
    case "SEMI_FINALS":
      return MatchPhase.SEMI_FINAL;
    case "THIRD_PLACE":
      return MatchPhase.THIRD_PLACE;
    case "FINAL":
      return MatchPhase.FINAL;
    case "GROUP_STAGE":
    default:
      return MatchPhase.GROUP_STAGE;
  }
}

export function mapFootballDataStatus(status: string): MatchStatus {
  switch (status) {
    case "FINISHED":
    case "AWARDED":
      return MatchStatus.FINAL;
    case "IN_PLAY":
    case "PAUSED":
    case "LIVE":
      return MatchStatus.LOCKED;
    case "POSTPONED":
      return MatchStatus.POSTPONED;
    case "CANCELLED":
      return MatchStatus.CANCELLED;
    case "SUSPENDED":
      return MatchStatus.ABANDONED;
    case "TIMED":
    case "SCHEDULED":
    default:
      return MatchStatus.SCHEDULED;
  }
}

export async function fetchFootballDataWorldCupMatches(apiKey = process.env.FOOTBALL_DATA_API_KEY) {
  if (!apiKey) {
    throw new Error("FOOTBALL_DATA_API_KEY is not configured.");
  }

  const response = await fetch(FOOTBALL_DATA_WC_MATCHES_URL, {
    headers: {
      "X-Auth-Token": apiKey,
    },
  });

  if (!response.ok) {
    throw new Error(`football-data request failed with ${response.status}.`);
  }

  return (await response.json()) as FootballDataMatchesPayload;
}

export async function syncFootballDataWorldCup(input: SyncOptions = {}) {
  return runProviderSync({
    ...input,
    payloadLoader: fetchFootballDataWorldCupMatches,
  });
}

export async function syncFootballDataPayload(
  payload: FootballDataMatchesPayload,
  input: SyncPayloadOptions = {},
) {
  return importFootballDataPayload(payload, input);
}

async function runProviderSync(input: SyncOptions & { payloadLoader: () => Promise<FootballDataMatchesPayload> }) {
  const syncRun = await prisma.syncRun.create({
    data: {
      provider: FOOTBALL_DATA_PROVIDER,
      status: "STARTED",
    },
  });

  await writeSyncAudit(AuditAction.SYNC_STARTED, input.actorId, syncRun.id);

  try {
    const payload = await input.payloadLoader();
    const result = await importFootballDataPayload(payload, input);
    const message = `Imported ${result.matchesImported} matches and ${result.teamsImported} teams.`;

    await prisma.syncRun.update({
      where: { id: syncRun.id },
      data: {
        status: "SUCCEEDED",
        finishedAt: new Date(),
        message,
      },
    });
    await writeSyncAudit(AuditAction.SYNC_SUCCEEDED, input.actorId, syncRun.id, {
      matchesImported: result.matchesImported,
      teamsImported: result.teamsImported,
    });

    return { ...result, syncRunId: syncRun.id };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown sync error.";

    await prisma.syncRun.update({
      where: { id: syncRun.id },
      data: {
        status: "FAILED",
        finishedAt: new Date(),
        message,
      },
    });
    await writeSyncAudit(AuditAction.SYNC_FAILED, input.actorId, syncRun.id, { message });

    throw error;
  }
}

async function importFootballDataPayload(payload: FootballDataMatchesPayload, input: SyncPayloadOptions) {
  const tournament = await prisma.tournament.upsert({
    where: { slug: input.tournamentSlug ?? "fifa-world-cup-2026" },
    create: {
      name: input.tournamentName ?? "FIFA World Cup 2026",
      slug: input.tournamentSlug ?? "fifa-world-cup-2026",
      year: 2026,
      active: input.active ?? true,
    },
    update: {
      name: input.tournamentName ?? "FIFA World Cup 2026",
      year: 2026,
      active: input.active ?? true,
    },
  });

  const teamByProviderId = new Map<string, Team>();

  for (const match of payload.matches) {
    await upsertProviderTeam(tournament.id, match.homeTeam, teamByProviderId);
    await upsertProviderTeam(tournament.id, match.awayTeam, teamByProviderId);
  }

  let matchesImported = 0;
  const recalculationMatchIds: string[] = [];

  for (const providerMatch of payload.matches) {
    const existingMatch = await prisma.match.findUnique({
      where: { providerId: String(providerMatch.id) },
    });
    const matchData = buildMatchData(providerMatch, existingMatch, teamByProviderId);
    const match = await prisma.match.upsert({
      where: { providerId: String(providerMatch.id) },
      create: {
        ...matchData,
        tournamentId: tournament.id,
        providerId: String(providerMatch.id),
      },
      update: matchData,
    });

    matchesImported += 1;

    if (
      match.status === MatchStatus.FINAL ||
      match.status === MatchStatus.CANCELLED ||
      match.status === MatchStatus.ABANDONED
    ) {
      recalculationMatchIds.push(match.id);
    }
  }

  for (const matchId of recalculationMatchIds) {
    await recalculateMatchScores(matchId);
  }

  return {
    tournamentId: tournament.id,
    teamsImported: teamByProviderId.size,
    matchesImported,
  };
}

async function upsertProviderTeam(
  tournamentId: string,
  providerTeam: ProviderTeam,
  teamByProviderId: TeamByProviderId,
) {
  if (!providerTeam.id || !providerTeam.name) {
    return;
  }

  const providerId = String(providerTeam.id);
  const countryCode = providerTeam.tla ?? providerId;
  const team = await prisma.team.upsert({
    where: {
      tournamentId_countryCode: {
        tournamentId,
        countryCode,
      },
    },
    create: {
      tournamentId,
      name: providerTeam.name,
      countryCode,
      flagEmoji: flagEmojiForTla(providerTeam.tla),
      providerId,
    },
    update: {
      name: providerTeam.name,
      flagEmoji: flagEmojiForTla(providerTeam.tla),
      providerId,
    },
  });

  teamByProviderId.set(providerId, team);
}

function buildMatchData(
  providerMatch: FootballDataMatch,
  existingMatch: Match | null,
  teamByProviderId: TeamByProviderId,
) {
  const homeTeamId = providerMatch.homeTeam.id
    ? teamByProviderId.get(String(providerMatch.homeTeam.id))?.id ?? null
    : null;
  const awayTeamId = providerMatch.awayTeam.id
    ? teamByProviderId.get(String(providerMatch.awayTeam.id))?.id ?? null
    : null;
  const status = mapFootballDataStatus(providerMatch.status);
  const homeScore = providerMatch.score?.fullTime?.home ?? null;
  const awayScore = providerMatch.score?.fullTime?.away ?? null;

  const providerData = {
    phase: mapFootballDataStage(providerMatch.stage),
    status,
    matchday: providerMatch.matchday ?? null,
    kickoffAt: new Date(providerMatch.utcDate),
    homeTeamId,
    awayTeamId,
    homePlaceholder: homeTeamId ? null : providerMatch.homeTeam.name ?? "Home TBD",
    awayPlaceholder: awayTeamId ? null : providerMatch.awayTeam.name ?? "Away TBD",
    homeScore: status === MatchStatus.FINAL ? homeScore : null,
    awayScore: status === MatchStatus.FINAL ? awayScore : null,
    advancingTeamId: getAdvancingTeamId(providerMatch, teamByProviderId),
    latestProviderPayload: providerMatch as unknown as Prisma.InputJsonValue,
  };

  return preserveManualOverrides(providerData, existingMatch);
}

function preserveManualOverrides<T extends Record<string, unknown>>(providerData: T, existingMatch: Match | null) {
  if (!existingMatch?.manualOverrides || typeof existingMatch.manualOverrides !== "object") {
    return providerData;
  }

  const manualOverrides = existingMatch.manualOverrides as Record<string, unknown>;
  const preservedData: Record<string, unknown> = { ...providerData };

  for (const field of Object.keys(providerData)) {
    if (manualOverrides[field] === true) {
      preservedData[field] = existingMatch[field as keyof Match];
    }
  }

  return preservedData as T;
}

function getAdvancingTeamId(providerMatch: FootballDataMatch, teamByProviderId: TeamByProviderId) {
  if (providerMatch.score?.winner === "HOME_TEAM" && providerMatch.homeTeam.id) {
    return teamByProviderId.get(String(providerMatch.homeTeam.id))?.id ?? null;
  }

  if (providerMatch.score?.winner === "AWAY_TEAM" && providerMatch.awayTeam.id) {
    return teamByProviderId.get(String(providerMatch.awayTeam.id))?.id ?? null;
  }

  return null;
}

function flagEmojiForTla(tla?: string | null) {
  const normalizedTla = tla?.toUpperCase();

  if (normalizedTla && TLA_FLAG_EMOJI[normalizedTla]) {
    return TLA_FLAG_EMOJI[normalizedTla];
  }

  const code = normalizedTla?.slice(0, 2);

  if (!code || !/^[A-Z]{2}$/.test(code)) {
    return "";
  }

  return code
    .split("")
    .map((letter) => String.fromCodePoint(letter.charCodeAt(0) + 127397))
    .join("");
}

async function writeSyncAudit(
  action: AuditAction,
  actorId: string | undefined,
  targetId: string,
  metadata?: Prisma.InputJsonValue,
) {
  await prisma.auditLog.create({
    data: {
      action,
      actorId,
      targetId,
      metadata,
    },
  });
}
