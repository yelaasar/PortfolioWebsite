import { createHmac } from 'node:crypto'
import { NextResponse } from 'next/server'
import { ValidationError } from 'yup'
import { maxScoreForHits } from '@/games/aim-trainer/engine/systems/ScoreSystem'
import { ROUND_LENGTHS_MS } from '@/games/aim-trainer/react/roundLengths'
import { clientIp } from '@/lib/http'
import { leaderboardSchema } from '@/lib/leaderboardSchema'
import { oneLine } from '@/lib/notify'
import { getSupabase } from '@/lib/supabase'

// Needs node:crypto for the IP hash — same reasoning as the contact route.
export const runtime = 'nodejs'

const LEADERBOARD_SIZE = 10
const MAX_BODY_BYTES = 2_000

/**
 * No genuine click can land faster than this, so a reported hit rate above it
 * is not a fast player — it is a scripted request. Deliberately generous: this
 * exists to stop the trivial case, not to referee borderline runs.
 */
const MIN_HIT_INTERVAL_MS = 80

const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX_SUBMISSIONS = 5

type LeaderboardRow = {
  name: string
  score: number
  hits: number
  misses: number
  avg_reaction_ms: number
  created_at: string
}

function hashIp(ip: string): string {
  const secret = process.env.LEADERBOARD_IP_HASH_SECRET ?? ''
  return createHmac('sha256', secret).update(ip).digest('hex')
}

function parseDuration(raw: string | null): number | null {
  const ms = Number(raw)
  return ROUND_LENGTHS_MS.includes(ms) ? ms : null
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const durationMs = parseDuration(searchParams.get('duration'))
  if (durationMs === null) {
    return NextResponse.json({ error: 'invalid_duration' }, { status: 400 })
  }

  const supabase = getSupabase()
  if (!supabase) return NextResponse.json({ configured: false, entries: [] })

  const { data, error } = await supabase
    .from('aim_trainer_scores')
    .select('name, score, hits, misses, avg_reaction_ms, created_at')
    .eq('round_duration_ms', durationMs)
    .order('score', { ascending: false })
    .limit(LEADERBOARD_SIZE)

  if (error) {
    console.error('[leaderboard] read failed', error)
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }

  const entries = (data as LeaderboardRow[]).map((row) => ({
    name: row.name,
    score: row.score,
    hits: row.hits,
    misses: row.misses,
    avgReactionMs: row.avg_reaction_ms,
  }))

  return NextResponse.json({ configured: true, entries })
}

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase()
    if (contentType !== 'application/json') {
      return NextResponse.json({ error: 'unsupported_media_type' }, { status: 415 })
    }

    const declaredLength = Number(req.headers.get('content-length') ?? 0)
    if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
      return NextResponse.json({ error: 'payload_too_large' }, { status: 413 })
    }

    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
    }

    let input
    try {
      input = await leaderboardSchema.validate(body, { abortEarly: false, stripUnknown: true })
    } catch (err) {
      if (err instanceof ValidationError) {
        const fields: Record<string, string> = {}
        for (const issue of err.inner.length > 0 ? err.inner : [err]) {
          if (issue.path && !(issue.path in fields)) fields[issue.path] = issue.message
        }
        return NextResponse.json({ error: 'validation_failed', fields }, { status: 400 })
      }
      throw err
    }

    // Plausibility bound, not real anti-cheat — the client still self-reports
    // hits/misses/score, so this only stops the trivial "POST a huge number"
    // case, not a determined client that lies consistently.
    const maxPlausibleScore = maxScoreForHits(input.hits)
    const maxPlausibleHits = Math.floor(input.roundDurationMs / MIN_HIT_INTERVAL_MS)
    if (input.score > maxPlausibleScore || input.hits > maxPlausibleHits) {
      return NextResponse.json({ error: 'implausible_score' }, { status: 400 })
    }

    const supabase = getSupabase()
    if (!supabase) {
      return NextResponse.json({ error: 'supabase_not_configured' }, { status: 503 })
    }

    // Hashing with an empty key defeats the whole point of hashing — the
    // table would then hold something anyone could brute-force back to an IP.
    // Fail closed instead of silently doing that.
    if (!process.env.LEADERBOARD_IP_HASH_SECRET) {
      // Both this and the branch above are "leaderboard isn't set up" to the
      // client, but they're deliberately distinct error codes: GET only ever
      // checks the Supabase vars, so if the leaderboard is visibly rendering
      // at all, this is the one env var left to check.
      console.error('[leaderboard] LEADERBOARD_IP_HASH_SECRET is unset')
      return NextResponse.json({ error: 'ip_hash_secret_not_configured' }, { status: 503 })
    }

    const ipHash = hashIp(clientIp(req))

    const { count: recentCount, error: rateLimitError } = await supabase
      .from('aim_trainer_scores')
      .select('*', { count: 'exact', head: true })
      .eq('ip_hash', ipHash)
      .gte('created_at', new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString())

    if (rateLimitError) {
      console.error('[leaderboard] rate-limit check failed', rateLimitError)
      return NextResponse.json({ error: 'server_error' }, { status: 500 })
    }
    if ((recentCount ?? 0) >= RATE_LIMIT_MAX_SUBMISSIONS) {
      return NextResponse.json({ error: 'rate_limited' }, { status: 429 })
    }

    // The schema only trims; strip control/bidi characters the way the
    // contact route does for the same reason (a leaderboard is rendered raw).
    // oneLine can still collapse an all-control-character name to '' even
    // though .trim() saw it as non-empty, so re-check after sanitizing.
    const displayName = oneLine(input.name, 20)
    if (displayName === '') {
      return NextResponse.json(
        { error: 'validation_failed', fields: { name: 'Enter a name' } },
        { status: 400 },
      )
    }

    const { error: insertError } = await supabase.from('aim_trainer_scores').insert({
      name: displayName,
      score: input.score,
      hits: input.hits,
      misses: input.misses,
      avg_reaction_ms: input.avgReactionMs,
      round_duration_ms: input.roundDurationMs,
      ip_hash: ipHash,
    })

    if (insertError) {
      console.error('[leaderboard] insert failed', insertError)
      return NextResponse.json({ error: 'server_error' }, { status: 500 })
    }

    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (err) {
    console.error('[leaderboard] unhandled', err)
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}
