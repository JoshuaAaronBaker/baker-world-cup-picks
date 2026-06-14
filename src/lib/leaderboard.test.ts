import { PrismaClient, UserRole } from "@prisma/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { formatLeaderboardPlacement, getLeaderboard, rankLeaderboardUsers } from "@/lib/leaderboard";

const prisma = new PrismaClient();
const testUsernamePrefix = "leaderboard_role_";

beforeEach(async () => {
  await cleanupLeaderboardRoleTestData();
});

afterEach(async () => {
  await cleanupLeaderboardRoleTestData();
});

async function cleanupLeaderboardRoleTestData() {
  await prisma.user.deleteMany({
    where: { normalizedUsername: { startsWith: testUsernamePrefix } },
  });
}

describe("getLeaderboard", () => {
  it("counts correct picks out of completed matches, including missed picks", () => {
    const [row] = rankLeaderboardUsers([
      {
        username: `${testUsernamePrefix}counter`,
        nationalityFlags: "🇺🇸",
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        predictions: [
          { pointsAwarded: 3, exactScore: true, correctResult: true },
          { pointsAwarded: 1, exactScore: false, correctResult: true },
          { pointsAwarded: 0, exactScore: false, correctResult: false },
        ],
      },
    ], 4);

    expect(row).toMatchObject({
      nationalityFlags: "🇺🇸",
      correctResults: 2,
      scoredPicks: 4,
    });
  });

  it("formats tied and untied leaderboard placements", () => {
    const rows = rankLeaderboardUsers([
      {
        username: `${testUsernamePrefix}first`,
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        predictions: [{ pointsAwarded: 3, exactScore: true, correctResult: true }],
      },
      {
        username: `${testUsernamePrefix}also_first`,
        createdAt: new Date("2026-01-02T00:00:00.000Z"),
        predictions: [{ pointsAwarded: 3, exactScore: true, correctResult: true }],
      },
      {
        username: `${testUsernamePrefix}third`,
        createdAt: new Date("2026-01-03T00:00:00.000Z"),
        predictions: [{ pointsAwarded: 1, exactScore: false, correctResult: true }],
      },
    ]);

    expect(formatLeaderboardPlacement(rows[0])).toBe("🥇 Tied for 1st");
    expect(formatLeaderboardPlacement(rows[1])).toBe("🥇 Tied for 1st");
    expect(formatLeaderboardPlacement(rows[2])).toBe("🥈 2nd place");
  });

  it("excludes admin accounts even when they are not hidden", async () => {
    await prisma.user.createMany({
      data: [
        {
          username: `${testUsernamePrefix}user`,
          normalizedUsername: `${testUsernamePrefix}user`,
          passwordHash: "hash",
          role: UserRole.USER,
        },
        {
          username: `${testUsernamePrefix}admin`,
          normalizedUsername: `${testUsernamePrefix}admin`,
          passwordHash: "hash",
          role: UserRole.ADMIN,
          hideFromLeaderboard: false,
        },
      ],
    });

    const leaderboard = await getLeaderboard();
    const testRows = leaderboard.filter((row) => row.username.startsWith(testUsernamePrefix));

    expect(testRows.map((row) => row.username)).toEqual([`${testUsernamePrefix}user`]);
  });
});
