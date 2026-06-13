import { PrismaClient, UserRole } from "@prisma/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getLeaderboard, rankLeaderboardUsers } from "@/lib/leaderboard";

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
  it("counts correct picks out of scored picks", () => {
    const [row] = rankLeaderboardUsers([
      {
        username: `${testUsernamePrefix}counter`,
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        predictions: [
          { pointsAwarded: 3, exactScore: true, correctResult: true },
          { pointsAwarded: 1, exactScore: false, correctResult: true },
          { pointsAwarded: 0, exactScore: false, correctResult: false },
        ],
      },
    ]);

    expect(row).toMatchObject({
      correctResults: 2,
      scoredPicks: 3,
    });
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
