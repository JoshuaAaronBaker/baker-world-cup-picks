import { describe, expect, it } from "vitest";
import { teamName, type TeamDisplayMatch } from "@/lib/display";

describe("display helpers", () => {
  it.each([
    [
      "ENG",
      "England",
      "\u{1F3F4}\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F} England",
    ],
    [
      "SCO",
      "Scotland",
      "\u{1F3F4}\u{E0067}\u{E0062}\u{E0073}\u{E0063}\u{E0074}\u{E007F} Scotland",
    ],
  ])("shows the %s flag for existing teams stored with the generic black flag", (countryCode, name, expected) => {
    const match = {
      homePlaceholder: null,
      awayPlaceholder: null,
      homeTeam: {
        countryCode,
        flagEmoji: "🏴",
        name,
      },
      awayTeam: null,
    } as TeamDisplayMatch;

    expect(teamName(match, "home")).toBe(expected);
  });
});
