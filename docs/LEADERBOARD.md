# Setting up the aim trainer leaderboard

How to get the aim trainer's leaderboard talking to a real Supabase project,
and where the values go.

**This costs nothing** on Supabase's free tier. See [Cost](#cost) at the
bottom. Without any of this configured, the site still builds and the game
still plays — the leaderboard sections just don't render.

---

## How it behaves

Reads and writes both go through `app/api/leaderboard/route.ts`, which is the
only thing that ever talks to Supabase — the browser never does. That route
uses the **service_role key**, not the public anon key, so there is no
row-level-security policy to design: the migration enables RLS with zero
policies, which locks the table to everything except that one key.

- **Configured** — the idle screen and the results screen both show a top-10
  list for the currently selected round length, and the results screen lets
  you save your score under a name.
- **Not configured** — those sections don't render. Nothing else on the page
  changes.

---

## 1. Link the Supabase project (~5 minutes)

The schema lives in `supabase/migrations/` as versioned SQL, already
committed. You're linking a real hosted project to run it against, not
creating the schema by hand in the dashboard.

1. Install the CLI if you don't have it: `npx supabase --version` works
   without a global install.
2. From the repo root (not `frontend/`):
   ```bash
   npx supabase login
   npx supabase link --project-ref <your-project-ref>
   ```
   The project ref is in the dashboard URL:
   `supabase.com/dashboard/project/<project-ref>`.
3. Push the migration:
   ```bash
   npx supabase db push
   ```
   This creates `aim_trainer_scores` with its two indexes and enables RLS
   with no policies. Confirm in **Table Editor** that the table exists and
   **Authentication → Policies** shows RLS on with an empty policy list.

---

## 2. Get the API credentials (~2 minutes)

**Project Settings → API** in the dashboard:

| Variable | Value |
|---|---|
| `SUPABASE_URL` | "Project URL" |
| `SUPABASE_SERVICE_ROLE_KEY` | "service_role" key — **not** "anon public" |

> **The service_role key bypasses every RLS policy.** That's exactly why the
> app uses it (the route does its own validation instead), and exactly why it
> must never reach the browser — never prefix it `NEXT_PUBLIC_`, same rule as
> every other secret in this project.

Then generate the IP-hashing secret — any random string works:

```bash
openssl rand -hex 32
```

Set it as `LEADERBOARD_IP_HASH_SECRET`.

---

## 3. Where the values go

### Locally

```bash
cd frontend
cp .env.example .env.local
# then edit .env.local
```

`.env.local` is gitignored. Restart `npm run dev` after changing it.

### On Vercel

**Settings → Environment Variables.** Tick all three environments —
Production, Preview *and* Development — for all three variables, then
**Deployments → ⋯ → Redeploy** (values are baked in at build time; an
existing deployment won't pick up new ones).

---

## 4. Verifying it works

With the dev server running (`npm run dev`, port 3000):

```bash
curl "http://localhost:3000/api/leaderboard?duration=30000"
```

`{"configured":true,"entries":[]}` means the connection works and the board
is just empty. `{"configured":false,...}` means the app didn't see the env
vars — check they're in `.env.local` and that you restarted the dev server.

Then post a real score:

```bash
curl -i -X POST http://localhost:3000/api/leaderboard \
  -H 'Content-Type: application/json' \
  -d '{"name":"Test","score":150,"hits":1,"misses":0,"avgReactionMs":150,"roundDurationMs":30000}'
```

| Status | Meaning |
|---|---|
| `201 {"ok":true}` | Saved |
| `503 supabase_not_configured` | `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` missing — GET would also show `configured:false` |
| `503 ip_hash_secret_not_configured` | `LEADERBOARD_IP_HASH_SECRET` missing — the two 503s are separate codes on purpose, since GET never checks this one, so it can be missing even while the board itself renders fine |
| `400 implausible_score` | `score`/`hits` fail the plausibility bound — expected if you make the numbers up |
| `429 rate_limited` | More than 5 submissions from this IP in the last 60s |

Then play the real game in a browser, save a score, and confirm it appears.

---

## 5. Troubleshooting

| Symptom | Cause |
|---|---|
| Leaderboard sections don't render at all | Env vars not set, or not redeployed after setting them. |
| Board shows fine (`configured:true`, possibly "No scores yet"), but Save fails with "Leaderboard isn't fully set up yet" | `LEADERBOARD_IP_HASH_SECRET` specifically is missing — GET never checks it, so the board can render while saving still 503s. Check it's set **and ticked for the environment you're testing** (e.g. Production), then redeploy. |
| `db push` fails with "not linked" | Run `supabase link` again — the link is local to your machine, not stored in the repo. |
| Scores don't show up after saving | Confirm you're looking at the same round-length tab you played — each duration is its own board. |
| Works locally, sections missing on the deployed site | Variables not ticked for the environment that deployment used (Preview vs. Production). |
| Was working, now every request 500s, nothing changed in env vars | The project auto-paused from a week of inactivity — see [Cost](#cost). Resume it in the dashboard. |

---

## Cost

| | Free tier | Enough? |
|---|---|---|
| Supabase | 500MB database, 50k monthly active users, unlimited API requests | Yes, by a very wide margin for a portfolio leaderboard |

No card required to sign up. The one thing worth knowing: a Supabase project
**auto-pauses after a week with no activity**, and needs a manual "Restore" in
the dashboard before it responds again — it does not just cold-start on the
next request. A real possibility for a game that goes quiet between visitors;
if the leaderboard sections silently stop working, check the project isn't
paused before assuming the env vars are wrong.
