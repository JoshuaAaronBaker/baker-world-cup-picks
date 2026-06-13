import { MatchPhase, MatchStatus, PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminUsername = process.env.ADMIN_USERNAME ?? "baker";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "password";

  const passwordHash = await bcrypt.hash(adminPassword, 12);
  const userHash = await bcrypt.hash("password", 12);

  const tournament = await prisma.tournament.upsert({
    where: { slug: "fifa-world-cup-2026" },
    update: { active: true },
    create: {
      name: "FIFA Men's World Cup 2026",
      slug: "fifa-world-cup-2026",
      year: 2026,
      active: true,
    },
  });

  const teams = await Promise.all(
    [
      ["United States", "US", "🇺🇸"],
      ["Canada", "CA", "🇨🇦"],
      ["Mexico", "MX", "🇲🇽"],
      ["Brazil", "BR", "🇧🇷"],
      ["France", "FR", "🇫🇷"],
      ["Japan", "JP", "🇯🇵"],
      ["Argentina", "AR", "🇦🇷"],
      ["Spain", "ES", "🇪🇸"],
    ].map(([name, countryCode, flagEmoji]) =>
      prisma.team.upsert({
        where: {
          tournamentId_countryCode: {
            tournamentId: tournament.id,
            countryCode,
          },
        },
        update: { name, flagEmoji },
        create: {
          tournamentId: tournament.id,
          name,
          countryCode,
          flagEmoji,
        },
      }),
    ),
  );

  const teamByCode = Object.fromEntries(teams.map((team) => [team.countryCode, team]));

  const users = await Promise.all([
    prisma.user.upsert({
      where: { normalizedUsername: adminUsername.toLowerCase() },
      update: { role: UserRole.ADMIN, passwordHash },
      create: {
        username: adminUsername,
        normalizedUsername: adminUsername.toLowerCase(),
        passwordHash,
        role: UserRole.ADMIN,
      },
    }),
    ...["maria_10", "sam-j", "alex_92"].map((username) =>
      prisma.user.upsert({
        where: { normalizedUsername: username.toLowerCase() },
        update: {},
        create: {
          username,
          normalizedUsername: username.toLowerCase(),
          passwordHash: userHash,
        },
      }),
    ),
  ]);

  const finalMatch = await prisma.match.upsert({
    where: { providerId: "seed-final-1" },
    update: {},
    create: {
      tournamentId: tournament.id,
      providerId: "seed-final-1",
      phase: MatchPhase.GROUP_STAGE,
      status: MatchStatus.FINAL,
      matchday: 1,
      kickoffAt: new Date("2026-06-11T23:00:00.000Z"),
      homeTeamId: teamByCode.US.id,
      awayTeamId: teamByCode.CA.id,
      homeScore: 2,
      awayScore: 1,
      latestProviderPayload: { source: "seed" },
    },
  });

  await prisma.match.upsert({
    where: { providerId: "seed-scheduled-1" },
    update: {},
    create: {
      tournamentId: tournament.id,
      providerId: "seed-scheduled-1",
      phase: MatchPhase.GROUP_STAGE,
      status: MatchStatus.SCHEDULED,
      matchday: 2,
      kickoffAt: new Date("2026-06-13T01:30:00.000Z"),
      homeTeamId: teamByCode.MX.id,
      awayTeamId: teamByCode.BR.id,
      latestProviderPayload: { source: "seed" },
    },
  });

  await prisma.match.upsert({
    where: { providerId: "seed-placeholder-1" },
    update: {},
    create: {
      tournamentId: tournament.id,
      providerId: "seed-placeholder-1",
      phase: MatchPhase.ROUND_OF_32,
      status: MatchStatus.SCHEDULED,
      kickoffAt: new Date("2026-06-29T23:00:00.000Z"),
      homePlaceholder: "Winner Group A",
      awayPlaceholder: "Runner-up Group B",
      latestProviderPayload: { source: "seed" },
    },
  });

  await prisma.match.upsert({
    where: { providerId: "seed-knockout-known-1" },
    update: {},
    create: {
      tournamentId: tournament.id,
      providerId: "seed-knockout-known-1",
      phase: MatchPhase.ROUND_OF_16,
      status: MatchStatus.SCHEDULED,
      kickoffAt: new Date("2026-07-04T23:00:00.000Z"),
      homeTeamId: teamByCode.AR.id,
      awayTeamId: teamByCode.ES.id,
      latestProviderPayload: { source: "seed" },
    },
  });

  const predictionInputs = [
    [users[0].id, 2, 1, 3, true, true],
    [users[1].id, 1, 0, 1, false, true],
    [users[2].id, 0, 1, 0, false, false],
    [users[3].id, 2, 0, 1, false, true],
  ] as const;

  await Promise.all(
    predictionInputs.map(
      ([userId, homeScore, awayScore, pointsAwarded, exactScore, correctResult]) =>
        prisma.prediction.upsert({
          where: {
            userId_matchId: {
              userId,
              matchId: finalMatch.id,
            },
          },
          update: {
            homeScore,
            awayScore,
            pointsAwarded,
            exactScore,
            correctResult,
            status: "SCORED",
          },
          create: {
            userId,
            matchId: finalMatch.id,
            homeScore,
            awayScore,
            pointsAwarded,
            exactScore,
            correctResult,
            status: "SCORED",
          },
        }),
    ),
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
