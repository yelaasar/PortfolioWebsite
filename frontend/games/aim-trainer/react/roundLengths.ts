/**
 * Round lengths the menu offers, in milliseconds. Plain data with no 'use
 * client' and no CSS import, unlike Hud.tsx — the leaderboard's server side
 * (lib/leaderboardSchema.ts, app/api/leaderboard/route.ts) needs this list too,
 * to restrict a submission's duration to one the menu actually offers, and
 * importing it from Hud.tsx would drag a whole client-component module graph
 * into a Node API route.
 */
export const ROUND_LENGTHS_MS = [15_000, 30_000]
