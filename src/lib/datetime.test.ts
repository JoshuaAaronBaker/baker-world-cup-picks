import { describe, expect, it } from "vitest";
import { formatAppDate, formatAppDateTime, formatAppDateTimeLong, getAppTodayRange } from "@/lib/datetime";

describe("app date formatting", () => {
  it("formats server-rendered match times in Pacific time instead of the server timezone", () => {
    const kickoffAt = new Date("2026-06-12T20:00:00.000Z");

    expect(formatAppDateTime(kickoffAt)).toBe("Jun 12, 1:00 PM PDT");
  });

  it("uses the Pacific date when grouping matches", () => {
    const lateUtcMatch = new Date("2026-06-13T02:00:00.000Z");

    expect(formatAppDate(lateUtcMatch)).toBe("Fri, Jun 12");
  });

  it("includes the Pacific timezone on longer admin timestamps", () => {
    const timestamp = new Date("2026-12-12T20:00:00.000Z");

    expect(formatAppDateTimeLong(timestamp)).toContain("PST");
  });

  it("builds today's range from the Pacific calendar day", () => {
    const { start, end } = getAppTodayRange(new Date("2026-06-13T02:00:00.000Z"));

    expect(start.toISOString()).toBe("2026-06-12T07:00:00.000Z");
    expect(end.toISOString()).toBe("2026-06-13T07:00:00.000Z");
  });
});
