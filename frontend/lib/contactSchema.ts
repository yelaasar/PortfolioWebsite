import { object, string, type InferType } from 'yup'

/**
 * Shared by the client resolver in ContactForm.tsx and the server route in
 * app/api/contact/route.ts, so the two can never drift. Never trust the client
 * validation — the route re-runs this on every request.
 */

/**
 * Honeypot field name. Bots fill every input they find; humans never see this
 * one. Deliberately NOT part of contactSchema — see the note at the bottom.
 */
export const HONEYPOT_FIELD = 'company'

/** A human cannot read the page and fill three fields in under this. */
export const MIN_FILL_MS = 3000

/**
 * Stricter than yup's .email(), which accepts `a@b` with no TLD. A typo would
 * otherwise pass validation, get rejected by the mail provider, and surface to
 * the visitor as a generic "something went wrong" — the error belongs here, at
 * the 400 layer, where we can name the field.
 *
 * Also rejects whitespace, comma, semicolon, angle brackets and quotes. That is
 * what makes the value safe to pass to `replyTo`: it cannot be read as a
 * multi-address list or as a `Display Name <addr>` form by anything downstream.
 */
const EMAIL_RE = /^[^\s@<>,;"]+@[^\s@<>,;"]+\.[^\s@<>,;"]{2,}$/

export const contactSchema = object({
  name: string()
    .trim()
    .max(100, 'Name must be 100 characters or fewer')
    .required('Name is required'),

  email: string()
    .trim()
    .lowercase()
    .max(254, 'Email must be 254 characters or fewer')
    .matches(EMAIL_RE, {
      message: 'Enter a valid email address',
      excludeEmptyString: true,
    })
    .required('Email is required'),

  message: string()
    .trim()
    .min(10, 'Message must be at least 10 characters')
    .max(5000, 'Message must be 5000 characters or fewer')
    .required('Message is required'),
})

export type ContactInput = InferType<typeof contactSchema>

/** What actually goes over the wire: the content plus the two spam controls. */
export type ContactPayload = ContactInput & {
  [HONEYPOT_FIELD]?: string
  startedAt?: number
}

/*
 * Why the bounds are what they are:
 *
 *   name    100   lands in the Subject: line; keeps it one readable line in
 *                 every mail client after the "Portfolio contact — " prefix
 *   email   254   RFC 5321 maximum forward-path length. Longer than this is
 *                 not an address, it is a payload
 *   message  10   the highest-yield spam filter after the honeypot. Kills
 *                 "hi" and "test" and costs a real lead nothing
 *   message 5000  bounds the JSON body, the provider request, and lambda memory
 *
 * .trim() throughout is load-bearing, not tidiness: without it '   ' satisfies
 * .required().
 *
 * Why the honeypot and startedAt are NOT in this schema, though they travel
 * with it: they need the opposite control flow. A schema failure means "400,
 * here are the bad fields"; a honeypot hit means "200, send nothing, tell the
 * bot nothing". If `company` were a field here, then (a) the client resolver
 * would show "company must be at most 0 characters" to any real visitor whose
 * browser autofilled it — silently blocking a genuine lead — and (b) the
 * server's 400 would tell a bot exactly which field it tripped. They are a
 * transport concern, checked by hand in the route before validation runs.
 */
