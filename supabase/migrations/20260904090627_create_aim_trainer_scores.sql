-- Aim trainer leaderboard. One table, bucketed by round_duration_ms so a 60s
-- round can never outscore every 15s entry just by having more time on the
-- clock — the app treats each duration as its own leaderboard.
create table aim_trainer_scores (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  score integer not null,
  hits integer not null,
  misses integer not null,
  avg_reaction_ms integer not null,
  round_duration_ms integer not null,
  -- HMAC-SHA256 of the submitter's IP with a server-only secret, never the
  -- raw IP. Enough to rate-limit submissions without storing anything that
  -- identifies a visitor.
  ip_hash text not null,
  created_at timestamptz not null default now()
);

-- Serves the leaderboard read: top scores for one duration bucket.
create index aim_trainer_scores_leaderboard_idx
  on aim_trainer_scores (round_duration_ms, score desc);

-- Serves the rate-limit check: recent submissions from one hashed IP.
create index aim_trainer_scores_rate_limit_idx
  on aim_trainer_scores (ip_hash, created_at desc);

-- No policies added on purpose. RLS with zero policies locks this table to
-- every Postgres role except service_role, which bypasses RLS entirely — the
-- only credential the app's API route ever uses. Defense in depth: even if a
-- NEXT_PUBLIC_ anon key is added to this project for something else later, it
-- still cannot read or write this table.
alter table aim_trainer_scores enable row level security;
