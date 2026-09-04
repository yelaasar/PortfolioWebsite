import { NextResponse } from 'next/server'
import { ValidationError } from 'yup'
import { contactSchema, HONEYPOT_FIELD, MIN_FILL_MS } from '@/lib/contactSchema'
import { clientIp } from '@/lib/http'
import { notifyDiscord, notifyEmail, type NotifyResult } from '@/lib/notify'

// No-op today (nodejs is the default), kept as documentation: an HMAC-signed
// timestamp or an MX lookup on the lead's domain would need node:crypto /
// node:dns, and edge would block both.
export const runtime = 'nodejs'

const MAX_BODY_BYTES = 20_000

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

    // Every configured channel is attempted. Promise.allSettled rather than
    // Promise.all: one channel throwing must not prevent the other from being
    // awaited, or a Discord outage would suppress the email that did send.
    const settled = await Promise.allSettled([notifyEmail(input), notifyDiscord(input)])

    const results: NotifyResult[] = []
    for (const outcome of settled) {
      if (outcome.status === 'fulfilled') {
        // null means "this channel is not configured" — not a failure.
        if (outcome.value) results.push(outcome.value)
      } else {
        console.error('[contact] channel threw', outcome.reason)
      }
    }

    if (results.length === 0) {
      console.error(
        '[contact] no delivery channel configured — set DISCORD_WEBHOOK_URL, ' +
          'and/or RESEND_API_KEY + CONTACT_TO_EMAIL + CONTACT_FROM_EMAIL. See docs/SETUP.md',
      )
      return NextResponse.json({ error: 'server_error' }, { status: 500 })
    }

    const delivered = results.filter((r) => r.ok)
    const failed = results.filter((r) => !r.ok)

    // Log failures even when another channel succeeded: a quietly dead channel
    // is exactly the kind of thing nobody notices until they need it.
    for (const f of failed) {
      console.error('[contact] channel failed', { channel: f.channel, error: f.error })
    }

    // Succeed if ANY channel landed. The lead has reached you; which pipe it
    // came down is your problem, not the visitor's.
    if (delivered.length === 0) {
      return NextResponse.json({ error: 'send_failed' }, { status: 502 })
    }

    console.info('[contact] delivered', {
      via: delivered.map((r) => r.channel),
      failed: failed.map((r) => r.channel),
      messageLength: input.message.length, // length, never the body
    })
    return accepted()
  } catch (err) {
    console.error('[contact] unhandled', err)
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}
