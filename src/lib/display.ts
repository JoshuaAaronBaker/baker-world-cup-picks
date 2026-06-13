import type { Match, Team } from "@prisma/client";

export type TeamDisplayMatch = Pick<Match, "homePlaceholder" | "awayPlaceholder"> & {
  homeTeam: Team | null;
  awayTeam: Team | null;
};

export function teamName(match: TeamDisplayMatch, side: "home" | "away") {
  const team = side === "home" ? match.homeTeam : match.awayTeam;
  const placeholder = side === "home" ? match.homePlaceholder : match.awayPlaceholder;

  if (team) {
    return `${team.flagEmoji} ${team.countryCode}`;
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
