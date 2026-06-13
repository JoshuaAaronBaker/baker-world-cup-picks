import { describe, expect, it } from "vitest";
import { teamName, type TeamDisplayMatch } from "@/lib/display";

describe("display helpers", () => {
  it("shows the Scotland flag for existing SCO teams stored with the generic black flag", () => {
    const match = {
      homePlaceholder: null,
      awayPlaceholder: null,
      homeTeam: {
        countryCode: "SCO",
        flagEmoji: "🏴",
        name: "Scotland",
      },
      awayTeam: null,
    } as TeamDisplayMatch;

    expect(teamName(match, "home")).toBe(
      "\u{1F3F4}\u{E0067}\u{E0062}\u{E0073}\u{E0063}\u{E0074}\u{E007F} Scotland",
    );
  });
});
