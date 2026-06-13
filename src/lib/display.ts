import type { Match, Team } from "@prisma/client";

const TEAM_FLAG_OVERRIDES: Record<string, string> = {
  SCO: "\u{1F3F4}\u{E0067}\u{E0062}\u{E0073}\u{E0063}\u{E0074}\u{E007F}",
};

export type TeamDisplayMatch = Pick<Match, "homePlaceholder" | "awayPlaceholder"> & {
  homeTeam: Team | null;
  awayTeam: Team | null;
};

export function teamName(match: TeamDisplayMatch, side: "home" | "away") {
  const team = side === "home" ? match.homeTeam : match.awayTeam;
  const placeholder = side === "home" ? match.homePlaceholder : match.awayPlaceholder;

  if (team) {
    return `${TEAM_FLAG_OVERRIDES[team.countryCode] ?? team.flagEmoji} ${team.name}`;
  }

  return placeholder ?? "Team pending";
}

export function teamCode(match: TeamDisplayMatch, side: "home" | "away") {
  const team = side === "home" ? match.homeTeam : match.awayTeam;
  const placeholder = side === "home" ? match.homePlaceholder : match.awayPlaceholder;

  return team?.countryCode ?? placeholder ?? "TBD";
}

export function plainTeamName(match: TeamDisplayMatch, side: "home" | "away") {
  const team = side === "home" ? match.homeTeam : match.awayTeam;
  const placeholder = side === "home" ? match.homePlaceholder : match.awayPlaceholder;

  return team?.name ?? placeholder ?? "Team pending";
}
