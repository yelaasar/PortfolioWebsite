import { Resend } from 'resend'
import type { ContactInput } from './contactSchema'

/**
 * Delivery channels for a captured lead. See docs/SETUP.md for how to get the
 * credentials — both providers are free.
 *
 * Each channel is independently optional: it reports "not configured" by
 * returning null rather than failing when its env vars are absent. The route
 * sends through every configured channel and succeeds if *any* of them lands,
 * so one provider being down does not lose an enquiry.
 */

export type NotifyResult = {
  channel: 'email' | 'discord'
  ok: boolean
  /** Server-side only. Never returned to the client. */
  error?: string
}

// C0/C1 controls plus bidi overrides. The latter matter in an email subject or
// a chat preview: U+202E visually reverses the rendered line, which is a cheap
// way to make a message look like it came from someone else.
//
// Built via RegExp rather than a literal so the escape sequences survive any
// tooling that would otherwise rewrite them into the raw control characters.
const CONTROL_AND_BIDI = new RegExp(
  '[' +
    '\\u0000-\\u001F' +
    '\\u007F-\\u009F' +
    '\\u200E\\u200F' +
    '\\u202A-\\u202E' +
    '\\u2066-\\u2069' +
    ']',
  'g',
)

export function oneLine(value: string, max: number): string {
  return value.replace(CONTROL_AND_BIDI, ' ').replace(/\s+/g, ' ').trim().slice(0, max)
}

/** The shared plain-text body. No markup — see the note in each sender. */
function body(lead: ContactInput, displayName: string): string {
  return [
    `Name:  ${displayName}`,
    `Email: ${lead.email}`,
    `Sent:  ${new Date().toISOString()}`,
    '',
    '--- message ---',
    lead.message,
  ].join('\n')
}

export async function notifyEmail(lead: ContactInput): Promise<NotifyResult | null> {
  const apiKey = process.env.RESEND_API_KEY
  const toEmail = process.env.CONTACT_TO_EMAIL
  const fromEmail = process.env.CONTACT_FROM_EMAIL
  if (!apiKey || !toEmail || !fromEmail) return null

  const displayName = oneLine(lead.name, 80)

  // Constructed here, not at module scope: `new Resend()` throws when no key
  // resolves, which at module scope turns a missing env var into an
  // import-time crash instead of a handled response.
  const resend = new Resend(apiKey)

  const { data, error } = await resend.emails.send({
    // `to` and `from` come from the environment and never from input. This is
    // the only thing preventing the form from becoming an open relay; there is
    // no sanitisation that makes a user-supplied `to` safe.
    from: `Portfolio Contact <${fromEmail}>`,
    to: [toEmail],
    // A string, never an array — an array is how you accidentally build a
    // fan-out. Safe because the schema's regex rejects whitespace and separators.
    replyTo: lead.email,
    subject: oneLine(`Portfolio contact — ${displayName}`, 120),
    // Plain text only. Never `html` or `react`: interpolating a stranger's
    // message into HTML creates an XSS surface inside your own mail client.
    //
    // The address is printed in the body deliberately. Nothing verifies the
    // sender owns it, so it is a claim, not identity — seeing it next to the
    // message is what stops Reply going somewhere surprising unnoticed.
    text: body(lead, displayName),
  })

  // The SDK does NOT throw on API errors — fetchRequest catches non-2xx and
  // returns { data: null, error }. A bare try/catch would report success on a
  // 422 or 429 and drop the lead. This branch is mandatory.
  if (error) {
    return { channel: 'email', ok: false, error: `${error.name}: ${error.message}` }
  }
  console.info('[contact] email sent', { id: data?.id })
  return { channel: 'email', ok: true }
}

/** Discord rejects a `content` longer than this outright. */
const DISCORD_MAX_CHARS = 2000

/**
 * Discord renders markdown in `content`. Left alone, a lead writing `*` or `_`
 * reformats the message you are reading as trustworthy, and backticks can hide
 * text in a code span. Escaping is cheaper than trying to render it faithfully.
 *
 * The backslash must be escaped FIRST — doing it last would re-escape the
 * backslashes this function just inserted.
 */
function escapeMarkdown(value: string): string {
  return value.replace(/[\\`*_~|]/g, (ch) => `\\${ch}`)
}

export async function notifyDiscord(lead: ContactInput): Promise<NotifyResult | null> {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL
  if (!webhookUrl) return null

  const displayName = oneLine(lead.name, 80)
  const text = escapeMarkdown(`New enquiry\n\n${body(lead, displayName)}`)

  // The schema allows a 5000-character message, well over Discord's 2000-char
  // ceiling, so this truncation is required rather than defensive. When Discord
  // is the only configured channel a long enquiry arrives clipped — which is a
  // concrete reason to configure email as well, since it carries the full text.
  const content =
    text.length > DISCORD_MAX_CHARS
      ? `${text.slice(0, DISCORD_MAX_CHARS - 40)}\n\n[truncated — full text in the email]`
      : text

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content,
        // Without this, a lead typing "@everyone" pings your entire server.
        // An empty parse array suppresses @everyone, @here, role and user
        // mentions alike. Do not remove it.
        allowed_mentions: { parse: [] },
      }),
    })

    // Discord answers a successful webhook with 204 No Content, not 200 —
    // `res.ok` covers both, but a `=== 200` check would report a false failure.
    if (!res.ok) {
      // The status alone is not diagnostic; Discord puts the reason in the body.
      const detail = await res.text().catch(() => '')
      return {
        channel: 'discord',
        ok: false,
        error: `HTTP ${res.status}: ${detail.slice(0, 200)}`,
      }
    }

    console.info('[contact] discord sent')
    return { channel: 'discord', ok: true }
  } catch (err) {
    return {
      channel: 'discord',
      ok: false,
      error: err instanceof Error ? err.message : 'fetch failed',
    }
  }
}
