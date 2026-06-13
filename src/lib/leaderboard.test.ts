import { PrismaClient, UserRole } from "@prisma/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getLeaderboard } from "@/lib/leaderboard";

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
