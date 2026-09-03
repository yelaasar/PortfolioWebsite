# Blockers

Things that hold up the freelance-site migration but aren't code. Each entry says
what it blocks, who owns it, what to do, and how to tell it's cleared.

**Convention:** when a blocker clears, strike the heading through and add a
`**Resolved:**` line — don't delete the entry. The record of what held things up
is worth keeping.

Status as of 2026-09-03. Phases refer to the migration plan; Phases 1, 1b and 2
are done and committed on `next-migration`.

---

## 1. `site.email` is a placeholder — **you own this**

`frontend/content/site.ts` still reads:

```ts
email: 'youssef@example.com',
```

**Blocks:** the contact form's failure path. When the API route fails — provider
outage, misconfigured env var, the visitor being offline — the form offers
"email me directly" as a fallback so a lead is never a dead end. Pointing at
`example.com` means **the safety net is itself broken**, which defeats the entire
point of having one.

**Why it's yours:** this address gets published on a public page and scraped. I
have `youssef@aldemis.com` on file but deliberately did not publish it — that's
a decision about your inbox, not a coding detail. It does not have to be the same
address that receives leads (that's `CONTACT_TO_EMAIL`, which stays private in
the environment).

**To clear:** replace the string in `frontend/content/site.ts`.

**Verify:** load the site, force a submission failure (stop the dev server
mid-submit), and confirm the "email me directly" link opens your mail client
addressed correctly with the typed message prefilled.

**Cost of leaving it:** low volume now, but every lead that hits an API error is
lost silently. This is a one-line fix — there's no good reason to carry it.

---

## 2. No Resend account or API key — **you own this**

**Blocks:** end-to-end verification of the contact form. The route can be built
and tested without it — the 400/413/415/honeypot branches all work offline — but
**no email can actually be sent**, so "does a lead reach my inbox?" stays
unanswered until this exists.

**To clear:**

1. Sign up at <https://resend.com> using **the address that should receive
   leads**. On the free tier you can only send *to* the account owner's address,
   so this choice is load-bearing.
2. Create an API key at <https://resend.com/api-keys>.
3. Locally: copy `frontend/.env.example` to `frontend/.env.local` and fill in
   `RESEND_API_KEY` and `CONTACT_TO_EMAIL`. Leave
   `CONTACT_FROM_EMAIL=onboarding@resend.dev`.
4. On Vercel (once Blocker 3 clears): add all three to **Production, Preview and
   Development**. Setting them only on Production is the most common cause of
   "works locally, 500 on the preview URL".

> **Never prefix these with `NEXT_PUBLIC_`.** That ships the API key in the
> client bundle to every visitor.

**Verify:** submit the form; the email arrives; hitting Reply addresses the
*lead*, not `onboarding@resend.dev`. **Check your spam folder** — free-tier mail
from `resend.dev` lands there regularly.

**Free-tier limits, and when to care:** 100 emails/day, 3,000/month. You can only
send from `onboarding@resend.dev` and only to your own address, so you cannot
send the lead a confirmation. Buying a domain (~£10/yr, ~20 min of DNS) removes
both restrictions — worth doing after the first real lead, not before.

---

## 3. No Vercel project — **you own this**

**Blocks:** Phase 3, which is the only step that changes what's live. Everything
else can be built and merged without it.

**To clear:** import `yelaasar/PortfolioWebsite` at <https://vercel.com/new>, then:

| Setting | Value | Why |
|---|---|---|
| **Root Directory** | **`frontend`** | The Next app is not at the repo root. Miss this and the build fails outright. |
| Production branch | `main` | |
| Framework preset | Next.js | Should autodetect. |

Rename the project so the URL is a clean `yelaasar.vercel.app`, then set
`site.url` in `frontend/content/site.ts` to match — `metadataBase` and
`sitemap.ts` both read it, so social-preview and canonical URLs are wrong until
it's right.

**Verify:** view-source on the deployed page shows a real `<title>` and
`<meta name="description">`, not CRA boilerplate.

**Note on the old URL:** `theglassofwater.github.io/PortfolioWebsite` returns
**404** — the username rename did *not* preserve it. Only
`yelaasar.github.io/PortfolioWebsite` resolves. Don't touch the `gh-pages` branch
or GitHub Pages settings until the Vercel deploy is verified working.

---

## 4. No consulting content — **you own this**

**Blocks:** nothing technically. The case-study structure ships with visible
`TODO(youssef)` placeholders, so the build stays green and the pages render.

**Blocks in practice:** the entire point of the site. There's no services page and
no pricing page, so the case studies do all the selling. A prospect who lands on
a placeholder learns you haven't finished your own website.

**To clear**, per engagement:

- **Client** — real name, or `Confidential client, <sector>` if you're under NDA
- **Period** — e.g. `Mar 2025 – Aug 2025`
- **Your role** — what you were actually responsible for
- **The problem, in their words** — what they came to you with, not what you did
- **What you did** — 3–5 bullets, concrete
- **An outcome containing a number**

That last one is the one people skip. *"Improved their pipeline"* is a
description; *"cut a 40-minute nightly job to 6 minutes"* is evidence. If you
genuinely have no number, a before/after state works — but look for the number
first.

**Also needed:** cover images. All four project cards currently share
`music_generator_icon.jpeg`, which reads as unfinished.

---

## 5. Hugging Face model IDs use the old username — **needs checking**

The extracted generation code in `ml/music-generator/` loads:

- `theglassofwater/finetuning_16.0epochs`
- `theglassofwater/remi_12500`

Your GitHub username changed to `yelaasar`; these are Hugging Face, a separate
account, so they may be unaffected. HF also redirects renamed accounts.

**Blocks:** only the ability to actually *run* the CLI. The site and the
music-generator case study are static and don't touch these — the committed
`song.mp3` and `song.png` are pre-rendered.

**To clear:** run `python cli.py --out ./out` per `ml/music-generator/README.md`
and see whether the weights download.

**If they no longer resolve:** the README records them as historical and notes the
weights need re-uploading. Nothing else breaks.

---

## Not blockers, but decide eventually

- **A custom domain.** Removes the Resend free-tier restrictions (Blocker 2),
  improves deliverability, and reads more credibly than `.vercel.app` on an
  invoice. ~£10/yr.
- **Rate limiting on `/api/contact`.** Shipping with honeypot + time trap + length
  caps only. Add a Vercel Firewall rule (5 req/60s per IP) from the dashboard at
  zero code cost. Escalate to `@upstash/ratelimit` only if junk actually reaches
  your inbox, you burn >20% of the daily Resend quota in a day, or you verify a
  sending domain — after which relayed spam damages *your* reputation rather than
  `resend.dev`'s.
