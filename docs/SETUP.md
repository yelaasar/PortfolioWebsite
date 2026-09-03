# Setting up contact-form notifications

How to get the credentials that make the contact form reach you, and where to put
them.

**This costs nothing.** Neither provider asks for a card. See [Cost](#cost) at the
bottom for the actual numbers.

---

## How the form behaves

The form sends to every channel you configure and **succeeds if any one of them
lands**. So:

- Configure **Discord only** — enquiries ping a Discord channel. Fine.
- Configure **email only** — enquiries land in your inbox. Also fine.
- Configure **both** — recommended. Discord is instant; email gives you an
  archive and a Reply button that goes straight to the lead.
- Configure **neither** — the site still builds and the form still renders. A
  submission fails cleanly, keeps everything the visitor typed, and offers an
  "email me directly" link instead. Nothing is broken; nothing reaches you.

You can do Discord now and email later. Nothing depends on doing both.

---

## 1. Discord webhook (~2 minutes)

A webhook is a single URL that lets something post into one channel. No bot, no
token exchange, no approval.

1. Pick or create a server. If you would rather not use an existing one:
   **+** in the server list → *Create My Own* → *For me and my friends*. A server
   with just you in it is free and takes about ten seconds.
2. Create a channel for enquiries, e.g. `#enquiries`.
3. **Server Settings** → **Integrations** → **Webhooks** → **New Webhook**.
4. Select the channel, optionally rename it (the name shows as the message
   author), then **Copy Webhook URL**.

That URL is the whole credential. It looks like:

```
https://discord.com/api/webhooks/123456789012345678/aVeryLongOpaqueToken
```

> **Treat it as a secret.** Anyone with that URL can post into the channel. Do
> not commit it or paste it anywhere public. If it leaks, delete the webhook in
> the same settings page and make a new one — that instantly invalidates the old
> URL.

Set it as `DISCORD_WEBHOOK_URL`.

### Testing it without the site

```bash
curl -X POST "$DISCORD_WEBHOOK_URL" \
  -H 'Content-Type: application/json' \
  -d '{"content":"test from curl"}'
```

A `204 No Content` and a message in the channel means it works. Discord returns
**204, not 200**, on success — that is normal.

---

## 2. Resend API key (~5 minutes)

Email gives you two things Discord cannot: a searchable archive, and a Reply
button that addresses the lead directly.

1. Sign up at <https://resend.com>. **Use the address you want enquiries sent
   to** — see the constraint below, it makes this choice load-bearing.
   Signup does not ask for payment details.
2. Go to <https://resend.com/api-keys> → **Create API Key**. Sending permission
   is all it needs.
3. Copy the key (it starts `re_`). It is shown once.

Set three values:

| Variable | Value |
|---|---|
| `RESEND_API_KEY` | the key you just copied |
| `CONTACT_TO_EMAIL` | the inbox that receives enquiries |
| `CONTACT_FROM_EMAIL` | leave as `onboarding@resend.dev` |

> **Free-tier constraint, worth understanding before you debug it.** Without a
> verified domain, Resend will only send **from** `onboarding@resend.dev` and
> only **to** the address that owns the Resend account. If `CONTACT_TO_EMAIL` is
> any other address, the API rejects the send and the form returns a 502.
>
> This is why step 1 says to sign up with the address you actually want to use.

Adding a domain (~£10/yr, ~20 minutes of DNS) removes both restrictions. Worth
doing after the first real enquiry, not before.

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

**Settings → Environment Variables.** For each variable, tick **all three**
environments — Production, Preview *and* Development.

> Setting them on Production only is the most common cause of "works locally,
> 500 on the preview URL".

Environment variables are baked in at build time, so **an existing deployment
does not pick up new values**. After adding them: **Deployments → ⋯ → Redeploy**.

> **Never prefix any of these with `NEXT_PUBLIC_`.** That is not a naming
> convention — it is an instruction to Next.js to inline the value into the
> JavaScript every visitor downloads. Your API key would be public.

---

## 4. Verifying it works

With the dev server running (`npm run dev`, port 3000):

```bash
curl -i -X POST http://localhost:3000/api/contact \
  -H 'Content-Type: application/json' \
  -d "{\"name\":\"Test Lead\",\"email\":\"someone@example.com\",\"message\":\"A test message, comfortably over ten characters.\",\"startedAt\":$(( $(date +%s) * 1000 - 10000 ))}"
```

`startedAt` is backdated ten seconds on purpose — the route drops anything
submitted less than three seconds after the form loads, as a bot filter.

What the status codes mean:

| Status | Meaning |
|---|---|
| `200 {"ok":true}` | At least one channel delivered |
| `500 server_error` | **No channel is configured** — nothing was attempted |
| `502 send_failed` | A channel was configured and **every one failed** |
| `400 validation_failed` | The submission itself was invalid; `fields` says which |

The 500/502 split is the useful one: 500 means you have not set the variables,
502 means you set them and something is wrong with the values.

Then submit the real form in a browser and confirm the message arrives.

---

## 5. Troubleshooting

| Symptom | Cause |
|---|---|
| `500 server_error` | No variables set, or set in the wrong Vercel environment. Redeploy after adding them. |
| `502 send_failed` | Configured but failing. Check the deployment logs for `[contact] channel failed` — it names the channel and the provider's reason. |
| Works locally, 500 on a preview URL | Variables not ticked for **Preview**. |
| Nothing in Discord, no error | The webhook was deleted, or it posts to a channel you are not looking at. Test the URL with the `curl` in step 1. |
| Nothing in email, no error | **Check spam.** Free-tier mail from `onboarding@resend.dev` lands there routinely. |
| Email 502s specifically | `CONTACT_TO_EMAIL` is not the address that owns the Resend account. Free tier will not send anywhere else. |
| Long message clipped in Discord | Expected. Discord caps a message at 2000 characters; the notification says it was truncated. The email carries the full text — a good reason to configure both. |
| Changed a variable, nothing changed | Values are baked in at build time. Redeploy. |

Deployment logs live in **Vercel → your project → Logs**. The route logs
`[contact] delivered` on success and `[contact] channel failed` on failure, with
the provider's reason. It never logs the message body.

---

## Cost

| | Free tier | Enough? |
|---|---|---|
| Discord webhooks | Unlimited, no account beyond Discord | Yes |
| Resend | 3,000 emails/month, 100/day | Yes, by a wide margin |

Neither signup asks for a card. The only optional paid item anywhere in this
project is a custom domain (~£10/yr), which lifts Resend's "send only to your own
address" limit — irrelevant while you are the recipient.
