# Baker's World Cup Picks PRD

## Problem Statement

Friends and acquaintances need a lightweight public web app for competing on FIFA Men's World Cup 2026 score predictions. Players should be able to create an account with only a username and password, predict match scores before each deadline, earn points when official results are known, and compare standings on a single leaderboard.

The app should feel fun and easy to share, but it should not become a serious fantasy sports platform. It needs enough admin control to correct fixtures, scores, and users when needed, while keeping the game simple.

## Solution

Build **Baker's World Cup Picks**, a mobile-first Next.js web app backed by PostgreSQL and Prisma. Users register with a unique public username and password, then submit score predictions for known World Cup matches. Predictions lock 5 minutes before kickoff. Scores update once per day near the end of each match day, planned for around 11:30 PM Pacific Time, using football-data.org through a provider adapter.

The leaderboard is global. Anonymous visitors can see only rank, username, and points. Logged-in users can predict matches, see richer leaderboard stats, view locked match predictions, and inspect user prediction history for locked or final matches.

## User Stories

1. As a visitor, I want to view the public leaderboard, so that I can see who is winning before signing up.
2. As a visitor, I want public leaderboard data to be minimal, so that the public page stays simple.
3. As a visitor, I want to create an account with a username and password, so that I can join the game without sharing my email.
4. As a user, I want my username to be public, so that people can recognize me on the leaderboard.
5. As a user, I want my username to be locked after signup, so that leaderboard identity stays stable.
6. As a user, I want username rules to be clear, so that signup errors are easy to fix.
7. As a user, I want to log in with username and password, so that only I can edit my predictions.
8. As a user, I want no account recovery flow, so that the app does not collect emails or add extra account complexity.
9. As a user, I want to see upcoming matches grouped by date, so that I can quickly decide what to predict.
10. As a user, I want phase filters, so that I can browse group stage and knockout matches.
11. As a user, I want match times shown in my local timezone, so that I know the deadline where I am.
12. As a user, I want kickoff times stored consistently, so that deadlines behave correctly across timezones.
13. As a user, I want to predict a complete score pair, so that my prediction is valid.
14. As a user, I want blank score inputs to mean no prediction yet, so that I am not forced to predict everything at once.
15. As a user, I want predictions to autosave one match at a time, so that filling many matches feels easy.
16. As a user, I want to edit predictions until 5 minutes before kickoff, so that I can change my mind while the match is still safely in the future.
17. As a user, I want locked matches to be clearly marked, so that I know I can no longer edit them.
18. As a user, I want matches within 24 hours to show a lock countdown, so that deadlines are obvious.
19. As a user, I want my prediction progress shown as predicted matches out of available matches, so that I know what still needs attention.
20. As a user, I want unavailable knockout placeholders excluded from progress counts, so that I am not penalized for matches I cannot predict yet.
21. As a user, I want knockout placeholder matches disabled until both teams are known, so that predictions are not ambiguous.
22. As a user, I want to predict knockout scores after extra time but excluding penalty shootout goals, so that scoring matches standard football scorelines.
23. As a user, I want to pick the advancing team when I predict a knockout draw, so that the app can score the winner correctly.
24. As a user, I want a knockout draw prediction without an advancing team to be invalid, so that scoring stays deterministic.
25. As a user, I want to earn 3 points for an exact score, so that precision is rewarded.
26. As a user, I want to earn 1 point for the correct result or winner, so that I still get credit for the right outcome.
27. As a user, I want to earn 0 points for the wrong result, so that the scoring system is easy to understand.
28. As a user, I want the leaderboard to rank by points, exact scores, and correct results, so that ties reward better prediction quality.
29. As a user, I want tied users to share the same rank after those tie-breakers, so that arbitrary ordering does not decide ties.
30. As a user, I want everyone who registered to appear on the leaderboard, so that I can find myself even before scoring points.
31. As a user, I want late joiners to be allowed, so that friends can join after the tournament starts.
32. As a user, I want missed locked matches to simply score 0, so that late participation stays straightforward.
33. As a user, I want other players' future predictions hidden, so that copying is discouraged.
34. As a user, I want locked match predictions to become visible to logged-in users, so that the game feels social after the deadline.
35. As a user, I want to view another user's locked prediction history, so that I can compare picks after matches lock.
36. As a user, I want public visitors blocked from fixture and prediction details, so that only the leaderboard is public.
37. As a user, I want scores to update nightly after match days, so that I know why standings may not update immediately.
38. As a user, I want a last-updated timestamp, so that I know how fresh the leaderboard is.
39. As an admin, I want to be the only admin account, so that control stays simple.
40. As an admin, I want a lightweight admin page, so that I can maintain the game without a large dashboard.
41. As an admin, I want to manually sync fixtures and results, so that I can update data outside the nightly job if needed.
42. As an admin, I want to edit kickoff time, teams, status, score, and advancing team, so that I can correct provider mistakes.
43. As an admin, I want manual overrides to be per-field, so that future API syncs can still update unrelated fields.
44. As an admin, I want provider syncs not to overwrite manual overrides automatically, so that corrections are preserved.
45. As an admin, I want to clear an override or replace it with provider data, so that I can return to synced data when appropriate.
46. As an admin, I want to recalculate scores automatically after result changes, so that standings stay correct.
47. As an admin, I want a manual recalculate-all action, so that I can fix scoring after data or rule corrections.
48. As an admin, I want to disable users, so that I can block bad accounts without deleting history.
49. As an admin, I want to hide users from the leaderboard separately from disabling login, so that moderation stays flexible.
50. As an admin, I want minimal audit records for syncs, overrides, reopen actions, and recalculations, so that I can answer why points changed.
51. As an admin, I want sync failures visible only to me, so that normal users are not distracted by operational details.
52. As a developer, I want a provider adapter around football-data.org, so that the app can swap data providers later if coverage or pricing changes.
53. As a developer, I want local seed data, so that the app can be developed before real World Cup fixtures are fully integrated.
54. As a developer, I want seeded scheduled, locked, and final matches, so that all important UI states can be tested locally.
55. As a developer, I want a production admin created via environment or one-time seed configuration, so that known local credentials are not deployed.

## Implementation Decisions

- The MVP targets the FIFA Men's World Cup 2026 only in the UI.
- The database should include a tournament model so future tournaments remain possible.
- The app name is displayed as **Baker's World Cup Picks**.
- Project identifiers and slugs should use `bakers-world-cup-picks`.
- The app uses one global leaderboard, not leagues or groups.
- The planned stack is Next.js, PostgreSQL, Prisma, username/password auth, and scheduled sync.
- The intended deployment is Vercel plus Neon Postgres.
- Authentication uses a unique public username and password only.
- No email collection, password recovery, or terms acceptance is included.
- Usernames are 3-24 characters, letters/numbers/underscore/hyphen only.
- Username uniqueness is case-insensitive, while display preserves original casing.
- Username is the public leaderboard identity and cannot be changed by normal users.
- Admin is a single manually configured account.
- Normal users can register at any time.
- Public anonymous access is limited to leaderboard rank, username, and points.
- Logged-in leaderboard includes rank, username, points, exact scores, and correct results.
- Logged-in users can view locked/final match predictions and user prediction history.
- Prediction inputs are shown in a fixture list grouped by date, with phase filters.
- Supported phase filters include all, group stage, round of 32, round of 16, quarter-finals, semi-finals, and final.
- Match times are stored in UTC and rendered in the user's browser timezone.
- Predictions lock 5 minutes before kickoff.
- Countdown text appears for matches within 24 hours of lock.
- Users may predict any future unlocked match.
- Prediction entry supports one-match-at-a-time autosave inside the fixture list.
- A prediction is valid only when both scores are complete integers between 0 and 20.
- The database enforces one prediction per user per match.
- Knockout matches are predicted as the official score after extra time, excluding penalty shootout goals.
- If a knockout score prediction is tied, the user must choose which team advances.
- Knockout placeholders can be stored before teams are known, but prediction is disabled until both teams are known.
- Country flags are rendered as emoji flags.
- The UI uses one polished light theme for MVP.
- Scoring is 3 points for exact score, 1 point for correct result/winner, and 0 for wrong result.
- Leaderboard ordering is total points, exact scores, correct results, then shared rank.
- Timestamp tiebreakers are out of scope.
- Points are stored on predictions when matches are finalized.
- Leaderboard totals derive from stored awarded points and can be recalculated.
- Cancelled or abandoned matches do not count unless admin marks a scorable result.
- Postponed matches keep existing predictions.
- If a kickoff changes before lock, the lock deadline follows the latest official kickoff.
- If a match already locked and is then postponed, it stays locked unless admin manually reopens it.
- Admin can manually reopen predictions with an explicit override.
- The API provider default is football-data.org.
- Provider data is imported through an internal adapter rather than used directly throughout the app.
- The adapter maps provider payloads into internal tournament, team, match, result, and status fields.
- Latest raw provider payloads are stored for debugging.
- The nightly sync runs once per match day, planned around 11:30 PM Pacific Time.
- Admin also has a manual sync button.
- The app does not depend on live scores.
- Internal match statuses should include scheduled, locked, final, postponed, cancelled, and abandoned.
- Normal users do not need an in-progress status; locked is sufficient until final.
- Admin has one lightweight page with match editing, sync, recalculate, and user moderation controls.
- Admin override UI should remain intentionally small.
- Minimal audit logs are stored but no audit dashboard is required for MVP.
- Development seed data includes admin, sample users, teams, matches, and predictions.

## Testing Decisions

- Tests should assert external behavior rather than implementation details.
- Auth tests should cover signup, login, case-insensitive username uniqueness, username validation, and locked usernames.
- Prediction tests should cover complete score validation, invalid score rejection, one-prediction-per-user-per-match behavior, autosave updates, and lock deadline enforcement.
- Locking tests should cover the 5-minute cutoff, kickoff changes before lock, postponed matches, and admin reopen behavior.
- Knockout tests should cover draw predictions requiring an advancing team and non-draw predictions implying the winner.
- Scoring tests should cover exact score, correct result, wrong result, knockout drawn score with correct advancer, recalculation after result edits, and cancelled/abandoned exclusions.
- Leaderboard tests should cover public columns, logged-in columns, rank ordering, shared ranks, hidden users, disabled users, late joiners, and zero-point users.
- Visibility tests should cover anonymous leaderboard-only access, hidden future predictions, and logged-in locked prediction views.
- Provider adapter tests should use recorded or mocked football-data.org payloads and verify mapping into internal models.
- Sync tests should cover nightly sync behavior, raw payload storage, sync errors, manual sync, and preservation of manual overrides.
- Admin tests should cover match edits, per-field overrides, clearing overrides, score recalculation, user disable, and hide-from-leaderboard behavior.
- UI tests should cover mobile prediction entry, countdown display, grouped fixture browsing, and local timezone rendering.
- The first implementation milestone should be tested against seed data before football-data.org integration.

## Out of Scope

- Multiple leagues or private groups.
- Multiple tournaments in the MVP UI.
- Public fixture pages for anonymous visitors.
- Public prediction breakdowns for anonymous visitors.
- Email collection.
- Password recovery.
- Account deletion.
- User-editable usernames after signup.
- Notifications, reminders, email, or push.
- Dedicated rules page or signup rules acceptance.
- Group standings.
- Live scores.
- Leaderboard movement indicators.
- Daily leaderboard snapshots.
- Dark mode.
- Federation crests or flag image assets.
- Complex admin dashboards, charts, or enterprise audit tooling.

## Further Notes

- The product should feel playful but clean, with fast mobile prediction entry as the primary experience.
- Rules should appear inline where needed rather than on a dedicated rules page.
- A subtle label should explain that scores update nightly after match days and show the last update time.
- football-data.org is the planned default provider, but actual 2026 World Cup coverage and free-plan access should be verified with a real token before launch.
- Milestone 1 should deliver a playable seeded full-stack MVP.
- Milestone 2 should add the football-data.org provider adapter, nightly sync, real fixture import, and admin manual sync.
