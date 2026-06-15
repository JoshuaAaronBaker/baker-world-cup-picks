import { describe, expect, it } from "vitest";
import { formatLocalMatchTime } from "@/components/local-match-time";

describe("formatLocalMatchTime", () => {
  it("includes a short timezone label from the viewer locale", () => {
    expect(formatLocalMatchTime(new Date("2026-06-12T20:00:00.000Z"))).toMatch(
      /[A-Z]{2,5}|GMT[+-]\d{1,2}/,
    );
  });
});
