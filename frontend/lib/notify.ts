import { Resend } from 'resend'
import type { ContactInput } from './contactSchema'

/**
 * Delivery channels for a captured lead.
 *
 * Each channel is independently optional: it reports "not configured" rather
 * than failing when its env vars are absent. The route sends through every
 * configured channel and succeeds if *any* of them lands, so one provider being
 * down does not lose an enquiry.
 */

export type NotifyResult = {
  channel: 'email' | 'telegram'
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

/** The shared plain-text body. No markup anywhere — see the note in each sender. */
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

  // `to` and `from` come from the environment and never from input. This is the
  // only thing preventing the form from becoming an open relay; there is no
  // sanitisation that makes a user-supplied `to` safe.
  const { data, error } = await resend.emails.send({
    from: `Portfolio Contact <${fromEmail}>`,
    to: [toEmail],
    // A string, never an array — an array is how you accidentally build a
    // fan-out. Safe because the schema's regex rejects whitespace and separators.
    replyTo: lead.email,
    subject: oneLine(`Portfolio contact — ${displayName}`, 120),
    // Plain text only. Never `html` or `react`: interpolating a stranger's
    // message into HTML creates an XSS surface inside your own mail client.
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

/** Telegram rejects anything longer than this outright. */
const TELEGRAM_MAX_CHARS = 4096

export async function notifyTelegram(lead: ContactInput): Promise<NotifyResult | null> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID
  if (!token || !chatId) return null

  const displayName = oneLine(lead.name, 80)
  const text = `New enquiry\n\n${body(lead, displayName)}`

  // No `parse_mode`. With Markdown or HTML enabled, a lead whose message
  // contains an unmatched * or < gets a 400 from Telegram — and worse, controls
  // the formatting of a message you read as trustworthy. Plain text has no
  // interpretive syntax, so there is nothing to escape.
  //
  // The message schema allows 5000 chars, above Telegram's 4096 limit, so this
  // must be truncated or the whole notification fails on a long enquiry. The
  // email carries the untruncated text.
  const truncated =
    text.length > TELEGRAM_MAX_CHARS
      ? `${text.slice(0, TELEGRAM_MAX_CHARS - 24)}\n\n[truncated — see email]`
      : text

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: truncated,
        disable_web_page_preview: true,
      }),
    })

    if (!res.ok) {
      // Telegram puts the reason in the body; the status alone is not useful.
      const detail = await res.text().catch(() => '')
      return {
        channel: 'telegram',
        ok: false,
        error: `HTTP ${res.status}: ${detail.slice(0, 200)}`,
      }
    }

    console.info('[contact] telegram sent')
    return { channel: 'telegram', ok: true }
  } catch (err) {
    return {
      channel: 'telegram',
      ok: false,
      error: err instanceof Error ? err.message : 'fetch failed',
    }
  }
}
