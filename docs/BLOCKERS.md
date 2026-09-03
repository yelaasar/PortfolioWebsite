# Blockers

Things that hold up the freelance-site migration but aren't code. Each entry says
what it blocks, who owns it, what to do, and how to tell it's cleared.

**Convention:** when a blocker clears, strike the heading through and add a
`**Resolved:**` line — don't delete the entry. The record of what held things up
is worth keeping.

Status as of 2026-09-03. Phases refer to the migration plan; Phases 1, 1b and 2
are done and committed on `next-migration`.

---

## ~~1. `site.email` is a placeholder~~

**Resolved 2026-09-03.** Set to `yelaasar02@gmail.com`, taken from CV.pdf. That
CV is served at `/CV.pdf` and linked from the homepage, so the address was
already public — publishing it in `site.ts` exposes nothing new.

The contact form's mailto fallback now reaches a real inbox. Note this is the
*public* address; the inbox that receives form submissions is `CONTACT_TO_EMAIL`
in the environment and can be different.

---

## 2. No notification channel configured yet — **you own this**

**Blocks:** enquiries actually reaching you. Everything else about the form works
without it — validation, the spam traps, and the graceful failure path with its
mailto fallback are all live and tested.

**Full walkthrough: [SETUP.md](SETUP.md).** Short version:

- **Discord** (~2 min, free, no signup beyond Discord): Server Settings →
  Integrations → Webhooks → New Webhook → Copy Webhook URL → set
  `DISCORD_WEBHOOK_URL`. **This alone is enough** — email is optional.
- **Email** (~5 min, free): a Resend key plus `CONTACT_TO_EMAIL` and
  `CONTACT_FROM_EMAIL`. Adds an archive and one-tap Reply to the lead.

Set them locally in `frontend/.env.local`, and on Vercel across **all three**
environments, then redeploy — env changes do not reach an existing deployment.

**Verify:** submit the form. `500` means nothing is configured; `502` means
something is configured but failing (the logs name which channel and why); `200`
means it landed.

**Cost:** nothing, and neither provider asks for a card. Discord webhooks are
unlimited; Resend's free tier is 3,000/month. A custom domain (~£10/yr) is the
only optional paid item, and only lifts Resend's "send to your own address"
limit — irrelevant while you are the recipient.

---

## 3. Vercel deploy returns 404 — **you own this**

**Symptom:** `yelaasar.vercel.app` returns Vercel's own `404: NOT_FOUND`
(`x-vercel-error: NOT_FOUND`), not the site's styled 404 page.

**Diagnosis (2026-09-03).** Probe both kinds of URL:

```bash
curl -s -o /dev/null -w '%{http_code}\n' https://yelaasar.vercel.app/CV.pdf      # 200
curl -s -o /dev/null -w '%{http_code}\n' https://yelaasar.vercel.app/sitemap.xml # 404
```

Everything that physically exists in `frontend/public/` serves 200. Every route
the Next build *generates* — `/`, `/sitemap.xml`, `/robots.txt`,
`/manifest.webmanifest`, `/opengraph-image`, `/work/*`, `/api/contact` — 404s.

So **`frontend/public/` is being published as a plain static folder and the Next
build output is not being used.** Root Directory is already correct: `/CV.pdf`
could not resolve otherwise. This is Framework Preset / Output Directory.

The usual cause: the project was imported while the repo root had no
`package.json` — true of `main`, which is still the pre-migration tree — so
framework detection fell back to "Other" and pinned Output Directory to
`public`. Setting Root Directory afterwards does **not** re-run detection.

**To clear** — Settings → Build and Deployment:

| Setting | Value |
|---|---|
| Framework Preset | **Next.js** ← the actual fix |
| Root Directory | `frontend` |
| Build Command | clear override (`next build`) |
| Output Directory | **clear override** (likely set to `public`) |
| Install Command | clear override |

Then Deployments → ⋯ → Redeploy with **"Use existing build cache" unchecked**.

Also check Settings → Git → **Production Branch**. Since `frontend/public/` files
are serving, it is not building `main` (which has no `frontend/`). Merging the
migration PR makes `main` correct, which is the state you want long-term.

**Verify:** `/sitemap.xml` returns 200 and lists the case-study URLs; the
homepage renders the dark themed page rather than a white Vercel error card.

Then set `site.url` in `frontend/content/site.ts` to the final domain —
`metadataBase` and `sitemap.ts` both read it, so canonical and social-preview
URLs stay wrong until it matches.

**Note on the old URL:** `theglassofwater.github.io/PortfolioWebsite` returns
**404** — the username rename did *not* preserve it. Only
`yelaasar.github.io/PortfolioWebsite` resolves. Don't touch the `gh-pages` branch
or GitHub Pages settings until the Vercel deploy is verified working.

---

## 4. Case-study metrics — **you own this** *(mostly resolved)*

**Resolved 2026-09-03:** the experience section and all six case studies are now
written from CV.pdf and the Aldemis consultant profile. Four client engagements
are live — banking platform recovery, accounting platform continuity, freelance
full-stack delivery, and the dissertation. The homepage has **no placeholders
left**.

**Still outstanding: the numbers.** Four case studies carry a visible TODO where
a metric belongs, because neither source document contains one and I would not
invent them. On pages whose entire job is credibility, a fabricated figure is
worse than a missing one.

| Case study | What's needed |
|---|---|
| Banking platform recovery | How long it had been dormant; how long recovery took |
| Accounting platform continuity | How many months you held it solo; features shipped in that window |
| Freelance full-stack delivery | Anything measurable — users, load, delivery time, cost saved |
| UK electricity analysis | What the analysis concluded, plus dataset scale |

These are the strongest sentences on the site once filled. *"Restored a platform
that had been dead for eight months, in three weeks"* does work that no amount
of description does.

**Also outstanding:** all six cards share `music_generator_icon.jpeg`. Distinct
covers are the cheapest visual upgrade available.

**A discrepancy to resolve:** CV.pdf says **4 client projects** (1 transport,
3 fintech); the Aldemis profile says **3** (1 transport, 2 fintech). The site
currently follows the CV. Worth making them agree before a prospect compares
them.

---

## ~~5. Hugging Face model IDs use the old username~~

**Resolved 2026-09-03 — not a blocker.** `theglassofwater` is the former *GitHub*
username; the Hugging Face account was never renamed. Both
`theglassofwater/finetuning_16.0epochs` and `theglassofwater/remi_12500` return
HTTP 200, so `ml/music-generator/cli.py` can download weights as written. No
action needed.

Kept here because "the username changed, so the model IDs must be stale" is a
reasonable inference that happens to be wrong, and someone will make it again.

---

## 6. A confidential document is sitting in `frontend/public/` — **decide what to do with it**

`frontend/public/Aldemis_Consultant_Profile_Youssef.pdf` is stamped **"Strictly
confidential – Distribution prohibited"** on every page. `public/` is the
directory Vercel serves to the open web: anything committed there is downloadable
by anyone who guesses the filename, and it is not behind auth.

**Current state:** the file is untracked, so it is *not* deployed. It is now also
listed in `frontend/.gitignore`, so a future `git add -A` cannot publish it by
accident.

**Its contents are used** — the experience entries and case studies were written
from it, anonymised by sector with no client named and no figure that is not also
in your own CV. That is fine. Serving the document itself is not.

**To clear:** move the file out of `frontend/public/` entirely. Nothing in the
site references it, so nothing breaks. Keep it wherever you keep source documents
— just not in a directory whose whole purpose is being publicly served.

> Worth deciding separately: whether Aldemis considers the *contents* shareable
> even anonymised. The engagements are described at a level a prospect needs, but
> you are the one with the contract.

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
