'use client'

import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { contactSchema, HONEYPOT_FIELD, type ContactInput } from '@/lib/contactSchema'
import { site } from '@/content/site'
import styles from './Contact.module.css'

type Status = 'idle' | 'submitting' | 'success' | 'error'

export default function ContactForm() {
  // Was `useState(false)`. A boolean cannot express "failed", so a failed send
  // looked identical to never having submitted — which is how leads were lost.
  const [status, setStatus] = useState<Status>('idle')

  // Set in an effect, not as a useRef initialiser: the clock should start when
  // the form becomes interactive on the client, which is what the server's
  // time trap is actually measuring. A useRef(Date.now()) would compute a
  // value during SSR that is then discarded at hydration.
  const startedAt = useRef(0)
  useEffect(() => {
    startedAt.current = Date.now()
  }, [])

  // Uncontrolled on purpose: keeping the honeypot out of react-hook-form keeps
  // it out of validation, out of dirtyFields, and out of ContactInput — the
  // schema must not contain it (see lib/contactSchema.ts).
  const honeypotRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    getValues,
    setError,
    formState: { errors },
  } = useForm<ContactInput>({ resolver: yupResolver(contactSchema) })

  const onSubmit = async (data: ContactInput) => {
    setStatus('submitting')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          [HONEYPOT_FIELD]: honeypotRef.current?.value ?? '',
          startedAt: startedAt.current,
        }),
      })

      if (res.ok) {
        setStatus('success')
        return
      }

      // Surface server-side validation on the fields it belongs to, so a
      // rule the client somehow missed still reads as a normal field error.
      if (res.status === 400) {
        const payload = (await res.json().catch(() => null)) as {
          fields?: Partial<Record<keyof ContactInput, string>>
        } | null
        if (payload?.fields) {
          for (const [field, message] of Object.entries(payload.fields)) {
            setError(field as keyof ContactInput, { type: 'server', message })
          }
        }
      }

      setStatus('error')
    } catch {
      // Offline, DNS failure, blocked request.
      setStatus('error')
    }
  }

  // Never a dead end: prefilled with whatever they already typed, so a failed
  // send costs them nothing but a click.
  const mailtoHref = () => {
    const { name, email, message } = getValues()
    const body = [`Name: ${name ?? ''}`, `Email: ${email ?? ''}`, '', message ?? '']
      .join('\n')
      .slice(0, 1500) // mailto: URLs break in some clients past ~2000 chars
    return `mailto:${site.email}?subject=${encodeURIComponent(
      'Portfolio contact',
    )}&body=${encodeURIComponent(body)}`
  }

  if (status === 'success') {
    return (
      <section id="contact" className={styles.container}>
        <h1 className="sectionTitle">contact</h1>
        <div role="status" className={styles.status}>
          <p>Thanks — your message is on its way.</p>
          <p>I&apos;ll reply to the address you gave.</p>
        </div>
      </section>
    )
  }

  return (
    <section id="contact" className={styles.container}>
      <h1 className="sectionTitle">contact</h1>
      {/* noValidate: the HTML `required` attributes fired native bubbles that
          competed with the styled messages below each field.

          handleSubmit is invoked inside the event rather than during render:
          onSubmit closes over two refs, and building the handler at render
          time reads as a render-phase ref access. */}
      <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} noValidate>
        <div>
          <label htmlFor="name" hidden>
            Name
          </label>
          <input
            type="text"
            id="name"
            placeholder="Name"
            autoComplete="name"
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={errors.name ? 'name-error' : undefined}
            {...register('name')}
          />
          {errors.name && (
            <p id="name-error" className={styles.fieldError}>
              {errors.name.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="email" hidden>
            Email
          </label>
          <input
            type="email"
            id="email"
            placeholder="Email"
            autoComplete="email"
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={errors.email ? 'email-error' : undefined}
            {...register('email')}
          />
          {errors.email && (
            <p id="email-error" className={styles.fieldError}>
              {errors.email.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="message" hidden>
            Message
          </label>
          <textarea
            id="message"
            placeholder="Message"
            aria-invalid={errors.message ? true : undefined}
            aria-describedby={errors.message ? 'message-error' : undefined}
            {...register('message')}
          />
          {errors.message && (
            <p id="message-error" className={styles.fieldError}>
              {errors.message.message}
            </p>
          )}
        </div>

        {/* Honeypot. Bots fill every input they find; this one is off-screen
            so nobody else ever sees it. tabIndex={-1} keeps it out of the tab
            order, which is what makes aria-hidden legitimate here. */}
        <div className={styles.honeypot} aria-hidden="true">
          <label htmlFor="company">Company</label>
          <input
            type="text"
            id="company"
            name="company"
            ref={honeypotRef}
            tabIndex={-1}
            autoComplete="off"
            defaultValue=""
          />
        </div>

        {status === 'error' && (
          <div role="alert" className={styles.error}>
            <p>Something went wrong sending your message. Your text is still here.</p>
            <p className={styles.fallback}>
              Try again below, or <a href={mailtoHref()}>email me directly</a>.
            </p>
          </div>
        )}

        {/* Kept as input[type=submit] rather than <button>: the existing CSS
            targets that selector for the pill, hover and shadow. */}
        <input
          type="submit"
          value={status === 'submitting' ? 'Sending…' : 'Submit'}
          disabled={status === 'submitting'}
        />
      </form>
    </section>
  )
}
