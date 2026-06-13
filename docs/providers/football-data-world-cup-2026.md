# football-data.org World Cup 2026 Verification

Verified on June 13, 2026 with a real football-data.org token. The token is stored only in ignored local environment files as `FOOTBALL_DATA_API_KEY`; do not commit provider tokens.

## Result

football-data.org is viable for the MVP provider.

The `WC` competition is available through the v4 API, and the current season is the FIFA World Cup 2026:

- Competition code: `WC`
- Competition name: `FIFA World Cup`
- Competition id: `2000`
- Current season id: `2398`
- Season start: `2026-06-11`
- Season end: `2026-07-19`
- Current matchday reported by provider: `1`

## Endpoints Tested

All calls returned HTTP 200 with the provided token:

- `GET https://api.football-data.org/v4/competitions`
- `GET https://api.football-data.org/v4/competitions/WC`
- `GET https://api.football-data.org/v4/competitions/WC/matches`
- `GET https://api.football-data.org/v4/competitions/WC/matches?season=2026`
- `GET https://api.football-data.org/v4/competitions/WC/matches?dateFrom=2026-06-11&dateTo=2026-07-19`

The season and date-filtered match endpoints returned the full 104-match tournament schedule.

## Payload Coverage

The match payload includes the fields needed by Baker's World Cup Picks:

- Stable provider match id, e.g. `537327`
- UTC kickoff time via `utcDate`
- Match status via `status`
- Stage via `stage`
- Group via `group` for group-stage matches
- Matchday via `matchday`
- Home and away team ids, names, short names, TLA codes, and crest URLs when known
- Placeholder-style `null` home/away team values for future knockout fixtures not yet determined
- Final score via `score.fullTime.home` and `score.fullTime.away`
- Result winner via `score.winner`
- Duration via `score.duration`
- Provider update timestamp via `lastUpdated`

Observed 2026 match breakdown from `GET /competitions/WC/matches?season=2026`:

- Total matches: `104`
- Statuses: `FINISHED: 3`, `TIMED: 100`, `SCHEDULED: 1`
- Stages: `GROUP_STAGE: 72`, `LAST_32: 16`, `LAST_16: 8`, `QUARTER_FINALS: 4`, `SEMI_FINALS: 2`, `THIRD_PLACE: 1`, `FINAL: 1`

## Adapter Notes

Map football-data.org stages to internal phases:

- `GROUP_STAGE` -> `GROUP_STAGE`
- `LAST_32` -> `ROUND_OF_32`
- `LAST_16` -> `ROUND_OF_16`
- `QUARTER_FINALS` -> `QUARTER_FINAL`
- `SEMI_FINALS` -> `SEMI_FINAL`
- `THIRD_PLACE` -> `THIRD_PLACE`
- `FINAL` -> `FINAL`

Map statuses conservatively:

- `TIMED` / `SCHEDULED` -> `SCHEDULED`
- `FINISHED` -> `FINAL`
- Provider postponed/cancelled/suspended variants should map to the closest internal status when encountered.

For group-stage results, use `score.fullTime` and `score.winner`.

For knockout results, use `score.fullTime` as the official score after extra time when provider `duration` indicates extra time. If `score.fullTime` is tied and `score.winner` is `HOME_TEAM` or `AWAY_TEAM`, map that team as `advancingTeamId`. This matches the app rule that penalty shootout goals do not change the predicted score, but the advancing team matters for tied knockout matches.

Future knockout fixtures currently return `null` team ids/names until the provider knows the participants. The app should keep those matches visible as placeholders and disable prediction inputs until both teams are known.

## Rate Limits

Response headers observed during verification:

- `x-requests-available-minute: 6-9`
- `x-requestcounter-reset: 55-60`

This is sufficient for the MVP sync plan because we only need nightly schedule/result sync plus an admin manual sync. A single full tournament match fetch is one API request.

## Decision

Proceed with football-data.org as the default provider for the MVP adapter.

Keep the provider adapter boundary so the app can swap providers later if free-tier access, rate limits, or knockout winner semantics change.

Fallback candidates if football-data.org becomes unsuitable:

- API-Football
- Sportmonks
- A manual CSV/admin import fallback for schedule and final scores
