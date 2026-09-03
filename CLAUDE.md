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

**Server components by default.** Only `Contact/ContactForm.tsx` and the two
`AimTrainer/` files are `'use client'`. The header nav is plain anchors plus
`scroll-behavior: smooth` in `globals.css`, so it needs no JS.

**Contact form → `app/api/contact/route.ts` → Resend.** The schema in
`lib/contactSchema.ts` is shared by the client resolver and the route, so the
two cannot drift; the route re-validates regardless. Non-obvious constraints,
each of which has already caused a bug:

- The Resend SDK **returns** `{ data, error }` and does not throw on API errors.
  Branch on `error` — a `try/catch` reports success on a 422 and drops the lead.
- `new Resend(key)` **throws** when no key resolves, so it is constructed inside
  the handler, not at module scope.
- The honeypot and time trap return a response **byte-identical** to success.
  Keep it that way; a differing response tells a bot which trap it hit.
- `to` and `from` come from env vars only. User input reaching either makes the
  form an open relay.
- The email is `text` only. Never add `html` or `react`.

Env vars: `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL`. Never
`NEXT_PUBLIC_`-prefixed. See `frontend/.env.example`.

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
- `dynamic(..., { ssr: false })` is illegal in a server component — hence the
  thin `AimTrainerCanvas.tsx` client wrapper.
- Error text uses `#ff6b6b`, not `var(--secondary-color)`: `#a52a2a` on
  `#141414` is ~3.0:1 and fails WCAG AA for body text.
- The footer year comes from `getFullYear()` at **build** time, which is correct
  because Vercel rebuilds on every push.

## Outstanding

`docs/BLOCKERS.md` tracks what is unfinished and who owns it. The live one that
affects code behaviour: `site.email` is still `youssef@example.com`, so the
contact form's mailto fallback currently goes nowhere.
