const rankMedals: Record<number, string> = {
  1: "🏆",
  2: "🥈",
  3: "🥉",
};

type LeaderboardRankProps = {
  rank: number;
};

export function LeaderboardRank({ rank }: LeaderboardRankProps) {
  const medal = rankMedals[rank];

  return (
    <span className="rank" aria-label={medal ? `Rank ${rank}` : undefined}>
      {medal ? (
        <>
          <span aria-hidden="true">{medal}</span>
          <span className="rank-number">{rank}</span>
        </>
      ) : (
        rank
      )}
    </span>
  );
}
