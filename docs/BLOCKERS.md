# Blockers

What's outstanding, who owns it, and what unblocks it.

**Convention:** resolved items move to [Resolved](#resolved) with a note on what
actually fixed them, rather than being deleted. The record of what held things up
is worth keeping — several entries below were resolved by something other than
the obvious cause.

Audited against reality on **2026-09-03**: live site probed, files checked on
disk and in git, PR state read from GitHub, local `.env.local` checked for which
variable *names* are set (values never read or logged). Re-checked same day
after PR #2 merged — Discord delivery confirmed live via direct probe.

---

# Open

## 1. Email is half-configured — needs a Resend key to actually send

**Not urgent — Discord is already live**, confirmed by direct probe (see
Resolved, below). But worth knowing the exact state so it isn't confusing later.

`frontend/.env.local` currently has `CONTACT_TO_EMAIL` and `CONTACT_FROM_EMAIL`
set, but **`RESEND_API_KEY` is empty**. `notifyEmail()` requires all three to
attempt a send — with the key missing it returns `null`, meaning "not
configured," same as if none were set. Right now only Discord actually
delivers; the email half is inert until a key exists.

**To activate it later:** get a free key at
[resend.com/api-keys](https://resend.com/api-keys) — sign up with the address in
`CONTACT_TO_EMAIL`, since the free tier can only send *to* the account owner.
Full steps: [SETUP.md](SETUP.md#2-resend-api-key-5-minutes).

Once you do, remember `.env.local` only affects `npm run dev` locally — the same
three variables need to exist in **Vercel → Settings → Environment Variables**
(all three environments) for the deployed site to pick it up, followed by a
redeploy.

---

## 2. Case-study metrics — **you own this**

The experience section and all six case studies are written and live. The
homepage has no placeholders. What's missing is **the numbers**.

Four case studies carry a visible `TODO(youssef)` where a metric belongs, because
neither CV.pdf nor the Aldemis profile contains one, and inventing figures on
pages whose entire job is credibility would be worse than omitting them.

| Case study | What's needed |
|---|---|
| Banking platform recovery | How long it had been dormant; how long recovery took |
| Accounting platform continuity | How many months you held it solo; features shipped |
| Freelance full-stack delivery | Anything measurable — users, load, delivery time, cost saved |
| UK electricity analysis | What the analysis concluded, plus dataset scale |

*"Restored a platform that had been dead for eight months, in three weeks"* does
work that no amount of description does.

**Also outstanding:** all six cards share `music_generator_icon.jpeg`. Distinct
covers are the cheapest visual upgrade available here.

**A discrepancy to settle:** CV.pdf says **4 client projects** (1 transport,
3 fintech); the Aldemis profile says **3** (1 transport, 2 fintech). The site
follows the CV. Worth making them agree before a prospect reads both.

---

# Resolved

## ~~PR #2 unmerged / contact form dead in production~~

**Resolved 2026-09-03.** PR #2 merged (`bea2120`), Vercel redeployed, and the
live endpoint was probed directly:

```bash
curl -s -w '\n[%{http_code}]\n' -X POST https://yelaasar.vercel.app/api/contact \
  -H 'Content-Type: application/json' \
  -d "{\"name\":\"Deploy check\",\"email\":\"check@example.com\",\"message\":\"Verifying the deployed notification code.\",\"startedAt\":$(( $(date +%s) * 1000 - 10000 ))}"
```

Returned `200 {"ok":true}`. Discord delivery is live.

## ~~Vercel deployment returned 404~~

**Resolved 2026-09-03.** Verified live: `/`, `/sitemap.xml` and every case-study
route return 200.

The cause was *not* Root Directory, which is the natural guess. Probing showed
everything physically present in `frontend/public/` served 200 while every route
the Next build *generates* 404'd — so `public/` was being published as a plain
static folder and the build output ignored. Fixed by setting **Framework Preset →
Next.js** and clearing the Output Directory override.

Diagnostic worth keeping, since it distinguishes the two causes in one step:

```bash
curl -s -o /dev/null -w '%{http_code}\n' https://yelaasar.vercel.app/CV.pdf      # static file
curl -s -o /dev/null -w '%{http_code}\n' https://yelaasar.vercel.app/sitemap.xml # build output
```

Both 200 = healthy. First 200, second 404 = the framework isn't being detected.
Both 404 = wrong Root Directory or wrong branch.

## ~~A confidential document was in `frontend/public/`~~

**Resolved 2026-09-03.** `Aldemis_Consultant_Profile_Youssef.pdf` — stamped
"Strictly confidential – Distribution prohibited" — was sitting in the directory
Vercel serves to the open web.

It was never committed, so it was never deployed, and it's no longer on disk.
Confirmed three ways: absent from `frontend/public/`, no commit in any branch
touches the path, and the live URL returns 404. `frontend/.gitignore` still
carries a rule for `public/Aldemis_Consultant_Profile_*.pdf` so a future
`git add -A` can't republish it.

Its *contents* remain used in the case studies, anonymised by sector with no
client named and no figure that isn't also in your own CV.

## ~~`site.email` was a placeholder~~

**Resolved 2026-09-03.** Set to `yelaasar02@gmail.com`, taken from CV.pdf — which
is served at `/CV.pdf` and linked from the homepage, so the address was already
public. This is the *public* address used by the form's mailto fallback; the
inbox that would receive form submissions is `CONTACT_TO_EMAIL` and can differ.

## ~~Hugging Face model IDs used the old username~~

**Resolved 2026-09-03 — never actually broken.** `theglassofwater` is the former
*GitHub* username; the Hugging Face account was never renamed. Both
`theglassofwater/finetuning_16.0epochs` and `theglassofwater/remi_12500` return
HTTP 200, so `ml/music-generator/cli.py` downloads weights as written.

Kept because "the username changed, so the model IDs must be stale" is a
reasonable inference that happens to be wrong, and someone will make it again.

---

# Not blockers, but decide eventually

- **A custom domain** (~£10/yr). Lifts Resend's "send only to your own address"
  limit, improves deliverability, and reads more credibly than `.vercel.app` on
  an invoice. Irrelevant while Discord is the only active channel.
- **Rate limiting on `/api/contact`.** Currently honeypot + time trap + length
  caps only. A Vercel Firewall rule (5 req/60s per IP) costs nothing and runs at
  the edge, before the function is invoked. Escalate to `@upstash/ratelimit` only
  if junk actually reaches you, or you verify a sending domain — after which
  relayed spam damages *your* reputation rather than a shared one.
- **Deleting the `next-migration` branch.** Merged via PR #1, but it still holds
  the unshipped Telegram commit. Harmless; delete when you're sure you don't want
  it.
