import { number, object, string, type InferType } from 'yup'
import { ROUND_LENGTHS_MS } from '@/games/aim-trainer/react/roundLengths'

/**
 * Shared shape for a leaderboard submission. Used by the API route
 * (app/api/leaderboard/route.ts) as the real gate — never trust the client,
 * same rule as contactSchema.ts. The client (Leaderboard.tsx) only does the
 * cheap parts (trim, maxLength on the input) since there's no form library in
 * this otherwise dependency-light game.
 */
export const leaderboardSchema = object({
  name: string()
    .trim()
    .min(1, 'Enter a name')
    .max(20, 'Name must be 20 characters or fewer')
    .required('Enter a name'),

  score: number().integer().min(0).required(),
  hits: number().integer().min(0).required(),
  misses: number().integer().min(0).required(),
  avgReactionMs: number().integer().min(0).required(),

  // Which leaderboard this entry belongs to. Restricted to the durations the
  // menu actually offers (games/aim-trainer/react/Hud.tsx) rather than any
  // integer, so a submitted duration always has a matching board to show it on.
  roundDurationMs: number()
    .integer()
    .oneOf(ROUND_LENGTHS_MS, 'Unrecognized round length')
    .required(),
})

export type LeaderboardSubmission = InferType<typeof leaderboardSchema>
