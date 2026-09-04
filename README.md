# Portfolio

Personal site for freelance work — a CV that funnels into a contact form, with
case studies for the work behind it.

Built with Next.js 16 (App Router), React 19 and TypeScript. Deployed on Vercel.

```
frontend/   the site
ml/         standalone Python from the music-generator case study
supabase/   schema for the aim trainer leaderboard, managed via CLI migrations
docs/       BLOCKERS.md — what's outstanding
```

## Running it

```bash
cd frontend
npm install
npm run dev        # http://localhost:3000
```

To make the contact form reach you, follow [docs/SETUP.md](docs/SETUP.md) — a
Discord webhook takes about two minutes and costs nothing. Everything else works
without it; an unconfigured form still renders and offers a mailto fallback.

To turn on the aim trainer's leaderboard, follow
[docs/LEADERBOARD.md](docs/LEADERBOARD.md) — a free Supabase project, linked via
CLI. Without it the game plays exactly the same; the leaderboard sections just
don't render.

## Notes

Content lives in `frontend/content/` rather than in components — identity,
experience, case studies and skills are all typed data. Placeholder copy is
marked with `TODO(youssef):`, rendered visibly on the page, and excluded from the
sitemap.

`ml/music-generator/` is a small language model fine-tuned on MIDI token streams,
kept as a runnable CLI. It used to be served by a Django backend that ran only on
localhost; that backend was retired in 2026, and the generation code — which
never depended on it — was extracted rather than deleted. The pre-migration
history is at the `pre-nextjs-migration` tag.

The site previously lived on GitHub Pages at
`theglassofwater.github.io/PortfolioWebsite`, which no longer resolves.
