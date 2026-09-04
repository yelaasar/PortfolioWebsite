# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Personal site for freelance work: a Next.js 16 App Router app in `frontend/`,
deployed to Vercel. It is CV-shaped — one page composing Home, Experience, Work,
Skills and a contact form — with case-study subpages at `/work/[slug]`.

`ml/music-generator/` holds a standalone Python CLI, kept as evidence for the
case study of the same name. It is not part of the site build and nothing in
`frontend/` imports it.

A Django + DRF backend used to live in `WebApp/`. It was never deployed and was
deleted in Phase 6 of the Next.js migration; the generation code that was worth
keeping is now in `ml/`. Everything else is recoverable from the
`pre-nextjs-migration` tag (pushed to origin).

## Commands

```bash
cd frontend
npm install
npm run dev            # http://localhost:3000
npm run build
npm run lint

cd ml/music-generator  # unrelated to the site build
pip install -r requirements.txt
python cli.py --out ./out
```

There is no test suite.

## Layout

```
frontend/   the site. Vercel's Root Directory must be set to this.
ml/         standalone Python, not part of any build
supabase/   CLI-managed schema for the aim trainer leaderboard (migrations/)
docs/       BLOCKERS.md — what's outstanding and who owns it
```

`backend/` is reserved for a future API; the `frontend/` nesting exists so it
can be added without either owning the repo root.

## Architecture

**Content is data, not JSX.** Everything the site renders comes from
`frontend/content/`: `site.ts` (identity — name, title, tagline, email, url,
socials), `experience.ts`, `caseStudies.ts`, `skills.ts`, with shapes in
`types.ts`. Components read these; none hardcode copy. When changing text, edit
`content/`, not a component.

`site.ts` is genuinely the single source — `layout.tsx`, `Home`, `Footer`,
`sitemap.ts`, `robots.ts`, `manifest.ts` and the contact form's mailto fallback
all read it. Several of those used to keep their own copies, which is how the
site ended up publishing a stale year and a former GitHub username.

**`ExperienceEntry.caseStudySlug` is the join key** between the CV and the case
studies — it is what makes a CV row click through to evidence.
`assertContentIntegrity()` at the bottom of `experience.ts` runs at module load
and **fails the build** if a slug has no matching case study.

**`TODO(youssef): ...` strings are load-bearing.** `content/types.ts` exports
`TODO()` and `isTodo()`; components render matching strings inside a
high-contrast `<mark>`, and `sitemap.ts` filters those case studies out so a
placeholder page is never advertised to search engines. Unfilled content is
meant to be uncomfortable to look at, not silently invisible.

**Server components by default.** Only `Contact/ContactForm.tsx` and the four
files under `games/aim-trainer/react/` are `'use client'`. The header nav is
plain anchors plus `scroll-behavior: smooth` in `globals.css`, so it needs no JS.

**`games/aim-trainer/` is a guest, not a component.** It is a self-contained
three.js game behind one entry point (`index.ts` exports `createGame(element)`),
built so it can be lifted into its own repo and embedded back as an iframe. The
engine under `engine/` is plain TypeScript — it imports React nowhere, and owns
its own `Scene`, renderer, rAF loop and systems. `react/` is the only bridge:
`useGame.ts` mounts the engine and turns its snapshots into React state, and the
HUD is DOM drawn over the canvas, not geometry inside it. Nothing outside the
directory may import `engine/` internals; keep the seam at `index.ts`.

The one exception to "self-contained": `react/Leaderboard.tsx` calls
`/api/leaderboard`. That's still entirely inside the `games/aim-trainer/`
boundary — the API route lives outside it (`app/api/leaderboard/route.ts`,
alongside the contact route) — but it means the game is no longer literally
zero-dependency on the rest of the site the way the engine itself is.

Snapshots are quantised (`clockResolutionMs`) so the HUD re-renders ~10x a
second rather than once per frame — putting per-frame game state in React state
is exactly what this structure exists to prevent.

**Aim trainer leaderboard → `app/api/leaderboard/route.ts` → Supabase, via the
service_role key only.** The browser never talks to Supabase directly — no
anon key, no RLS policies to write, because there aren't any (the migration in
`supabase/` enables RLS with zero policies, which locks the table to every
Postgres role except service_role). This is also what makes score validation
real: it happens server-side, where a client can't skip it, rather than relying
on a public key plus database rules.

One leaderboard per round length (`ROUND_LENGTHS_MS` in
`games/aim-trainer/react/roundLengths.ts` — deliberately not exported from
`Hud.tsx`, which is a `'use client'` file with a CSS import; the API route and
`lib/leaderboardSchema.ts` need this same list without dragging that module
graph into a Node route). Mixing durations into one board would let a 60s round
always beat a 15s one on time alone.

The route does two checks with no genuine anti-cheat behind them, both
documented in the route as soft:

- **Plausibility bound** — `maxScoreForHits()` (exported from the engine's
  `ScoreSystem.ts`, not reimplemented) times reported hits, plus a floor on
  time between hits. Stops `POST {score: 999999}`, not a client that lies
  consistently.
- **Rate limit** — 5 submissions per 60s per HMAC-SHA256-hashed IP
  (`LEADERBOARD_IP_HASH_SECRET` peppers the hash; the raw IP is never stored).
  Fails closed (503) if that secret is unset, rather than hashing with an empty
  key.

Env vars: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
`LEADERBOARD_IP_HASH_SECRET`. Setup walkthrough (linking the CLI, running the
migration, where the dashboard keys live) is in `docs/LEADERBOARD.md`.

**Contact form → `app/api/contact/route.ts` → `lib/notify.ts` → Discord and/or
email.** The schema in `lib/contactSchema.ts` is shared by the client resolver
and the route, so the two cannot drift; the route re-validates regardless.

Notifications fan out. Each sender in `notify.ts` returns `null` to mean "not
configured" rather than failing, and the route uses `Promise.allSettled` so one
channel throwing cannot suppress another that succeeded. Status contract:

| Outcome | Status |
|---|---|
| Any channel delivered | 200 `{"ok":true}` |
| Every configured channel failed | 502 |
| No channel configured at all | 500 |

Non-obvious constraints, each of which has already caused a bug:

- The Resend SDK **returns** `{ data, error }` and does not throw on API errors.
  Branch on `error` — a `try/catch` reports success on a 422 and drops the lead.
- `new Resend(key)` **throws** when no key resolves, so it is constructed inside
  the sender, not at module scope.
- Discord answers a successful webhook with **204**, not 200. Use `res.ok`.
- Discord's `allowed_mentions: { parse: [] }` is load-bearing: without it a lead
  typing `@everyone` pings the whole server.
- Discord caps `content` at **2000** characters against the schema's 5000 max, so
  truncation is required, not defensive. It also renders markdown, hence
  `escapeMarkdown()`.
- The honeypot and time trap return a response **byte-identical** to success.
  Keep it that way; a differing response tells a bot which trap it hit.
- `to` and `from` come from env vars only. User input reaching either makes the
  form an open relay.
- The email is `text` only. Never add `html` or `react`.

Env vars: `DISCORD_WEBHOOK_URL`, and/or `RESEND_API_KEY` + `CONTACT_TO_EMAIL` +
`CONTACT_FROM_EMAIL`. Never `NEXT_PUBLIC_`-prefixed. Setup walkthrough is in
`docs/SETUP.md`; `frontend/.env.example` lists the names.

`components/Contact/ContactForm.tsx` is provider-agnostic — it knows only
`/api/contact`, the status codes and `site.email`. Adding or swapping a channel
should never touch it.

## Styling

CSS Modules colocated with components, plus `app/globals.css` for tokens
(`--background-color: #141414`, `--secondary-color: #a52a2a`,
`--text-color: #ffffff`) and the type scale. Dark, red, monospace — preserved
deliberately across the migration.

**Next 16 uses Lightning CSS, not PostCSS.** Two consequences:

1. A CSS Module selector containing no local class is a **hard build error**
   (`Selector "label" is not pure`). Nest bare element selectors inside a class.
2. Native nesting and range media queries (`@media (width >= 800px)`) are
   compiled, so they are safe to use.

`next/image` emits intrinsic `width`/`height` attributes, so any rule setting
only `width` on an image also needs `height: auto` or the aspect ratio distorts.
The hero GIF is `unoptimized` — the optimizer would serve a single still frame.

## Gotchas

- Route `params` is a **Promise** in Next 15+: `await params`. Most examples
  online still show the Next 14 shape.
- `dynamic(..., { ssr: false })` is illegal in a server component. Rather than a
  wrapper component to host it, `useGame.ts` does a plain `import()` inside
  `useEffect` — same effect (`three` stays out of the server bundle and off
  every other route), no extra file.
- Error text uses `#ff6b6b`, not `var(--secondary-color)`: `#a52a2a` on
  `#141414` is ~3.0:1 and fails WCAG AA for body text.
- The footer year comes from `getFullYear()` at **build** time, which is correct
  because Vercel rebuilds on every push.

## Outstanding

`docs/BLOCKERS.md` tracks what is unfinished and who owns it. The live one that
affects code behaviour: `site.email` is still `youssef@example.com`, so the
contact form's mailto fallback currently goes nowhere.
