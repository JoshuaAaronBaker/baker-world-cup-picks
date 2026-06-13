export const rankMedals: Record<number, string> = {
  1: "🥇",
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
      <span className="rank-position" aria-hidden="true">
        {rank}
      </span>
      {medal ? (
        <span className="rank-medal" aria-hidden="true">
          {medal}
        </span>
      ) : (
        <span className="rank-medal rank-placeholder" aria-hidden="true">
          -
        </span>
      )}
    </span>
  );
}
