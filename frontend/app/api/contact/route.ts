import { NextResponse } from 'next/server'
import { ValidationError } from 'yup'
import { Resend } from 'resend'
import { contactSchema, HONEYPOT_FIELD, MIN_FILL_MS } from '@/lib/contactSchema'

// No-op today (nodejs is the default), kept as documentation: an HMAC-signed
// timestamp or an MX lookup on the lead's domain would need node:crypto /
// node:dns, and edge would block both.
export const runtime = 'nodejs'

const MAX_BODY_BYTES = 20_000

// C0/C1 controls plus bidi overrides. The latter matter: a name containing
// U+202E visually reverses the rendered subject line in most mail clients,
// which is a cheap way to make a message look like it came from someone else.
const CONTROL_AND_BIDI =
  /[\u0000-\u001F\u007F-\u009F\u200E\u200F\u202A-\u202E\u2066-\u2069]/g

function oneLine(value: string, max: number): string {
  return value.replace(CONTROL_AND_BIDI, ' ').replace(/\s+/g, ' ').trim().slice(0, max)
}

function clientIp(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
}

/**
 * The success response — also returned verbatim when a spam trap fires. It must
 * stay byte-identical in both cases so a bot cannot tell which trap it hit.
 */
const accepted = () => NextResponse.json({ ok: true }, { status: 200 })

export async function POST(req: Request) {
  try {
    // Also the CSRF control: a cross-origin <form> cannot send
    // application/json without triggering a preflight it will not survive.
    const contentType = req.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase()
    if (contentType !== 'application/json') {
      return NextResponse.json({ error: 'unsupported_media_type' }, { status: 415 })
    }

    // Cheap fuse ahead of allocating the body.
    const declaredLength = Number(req.headers.get('content-length') ?? 0)
    if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
      return NextResponse.json({ error: 'payload_too_large' }, { status: 413 })
    }

    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
    }
    if (typeof body !== 'object' || body === null || Array.isArray(body)) {
      return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
    }
    const envelope = body as Record<string, unknown>

    // --- Spam traps run BEFORE validation, so a bot never reaches a response
    // --- that differs by field.

    const trap = envelope[HONEYPOT_FIELD]
    if (typeof trap === 'string' && trap.trim() !== '') {
      // This log is the only way to detect a false positive (a real visitor
      // whose browser autofilled the field). A false positive is silent lead
      // loss: if this appears with a plausible IP and no matching email
      // arrives, rename HONEYPOT_FIELD to something with no autofill mapping.
      console.warn('[contact] honeypot tripped', { ip: clientIp(req) })
      return accepted()
    }

    const startedAt = Number(envelope.startedAt)
    if (Number.isFinite(startedAt)) {
      const elapsed = Date.now() - startedAt
      // elapsed >= 0 guards clock skew: a visitor whose clock runs fast
      // produces a negative elapsed and must not be dropped as a bot.
      if (elapsed >= 0 && elapsed < MIN_FILL_MS) {
        console.warn('[contact] time trap tripped', { elapsed, ip: clientIp(req) })
        return accepted()
      }
    }

    let input
    try {
      input = await contactSchema.validate(envelope, {
        abortEarly: false,
        stripUnknown: true,
      })
    } catch (err) {
      if (err instanceof ValidationError) {
        const fields: Record<string, string> = {}
        for (const issue of err.inner.length > 0 ? err.inner : [err]) {
          if (issue.path && !(issue.path in fields)) fields[issue.path] = issue.message
        }
        return NextResponse.json({ error: 'validation_failed', fields }, { status: 400 })
      }
      throw err
    }

    const apiKey = process.env.RESEND_API_KEY
    const toEmail = process.env.CONTACT_TO_EMAIL
    const fromEmail = process.env.CONTACT_FROM_EMAIL
    if (!apiKey || !toEmail || !fromEmail) {
      console.error('[contact] missing configuration', {
        hasKey: Boolean(apiKey),
        hasTo: Boolean(toEmail),
        hasFrom: Boolean(fromEmail),
      })
      return NextResponse.json({ error: 'server_error' }, { status: 500 })
    }

    const displayName = oneLine(input.name, 80)

    // Constructed here, not at module scope: `new Resend()` throws when no key
    // resolves, which at module scope turns a missing env var into an
    // import-time crash instead of the handled 500 above.
    const resend = new Resend(apiKey)

    const { data, error } = await resend.emails.send({
      // `to` and `from` come from the environment and never from input. This
      // is the only thing preventing the form from becoming an open relay;
      // there is no sanitisation that makes a user-supplied `to` safe.
      from: `Portfolio Contact <${fromEmail}>`,
      to: [toEmail],
      // A string, never an array — an array is how you accidentally build a
      // fan-out. Safe because EMAIL_RE rejects whitespace and separators.
      replyTo: input.email,
      subject: oneLine(`Portfolio contact — ${displayName}`, 120),
      // Plain text only. Never `html` or `react`: interpolating a stranger's
      // message into HTML creates an XSS surface inside your own mail client.
      //
      // The address is printed in the body deliberately. Nothing verifies the
      // sender owns it, so it is a claim, not identity — seeing it next to the
      // message is what stops Reply going somewhere surprising unnoticed.
      text: [
        `Name:  ${displayName}`,
        `Email: ${input.email}`,
        `Sent:  ${new Date().toISOString()}`,
        '',
        '--- message ---',
        input.message,
      ].join('\n'),
    })

    // The SDK does NOT throw on API errors — fetchRequest catches non-2xx and
    // returns { data: null, error }. A bare try/catch here would report success
    // on a 422 or 429 and drop the lead silently. This branch is mandatory.
    if (error) {
      console.error('[contact] resend send failed', { name: error.name, message: error.message })
      return NextResponse.json({ error: 'send_failed' }, { status: 502 })
    }

    // Length, never the body: Vercel logs are not a PII store.
    console.info('[contact] sent', { id: data?.id, messageLength: input.message.length })
    return accepted()
  } catch (err) {
    console.error('[contact] unhandled', err)
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}
