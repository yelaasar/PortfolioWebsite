'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { object, string, type InferType } from 'yup'
import styles from './Contact.module.css'

const schema = object({
  name: string().required('Name is required'),
  email: string().email().required('Email is required'),
  message: string().required('Message is required'),
})

type ContactInput = InferType<typeof schema>

export default function ContactForm() {
  const [contactData, setContactData] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ContactInput>({ resolver: yupResolver(schema) })

  // Phase 2 stub. Phase 4 replaces this with a POST to /api/contact plus a
  // real idle|submitting|success|error state machine — the boolean above
  // cannot express "failed", which is why leads are lost today.
  const onSubmit = (data: ContactInput) => {
    console.log('contact submit (not yet wired):', data)
    setContactData(true)
  }

  return (
    <section id="contact" className={styles.container}>
      <h1 className="sectionTitle">contact</h1>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div>
          <label htmlFor="name" hidden>
            Name
          </label>
          <input type="text" id="name" placeholder="Name" {...register('name')} required />
        </div>
        <div>
          <label htmlFor="email" hidden>
            Email
          </label>
          <input type="text" id="email" placeholder="Email" {...register('email')} required />
          {errors.email && <p>{errors.email.message}</p>}
        </div>
        <div>
          <label htmlFor="message" hidden>
            Message
          </label>
          <textarea id="message" placeholder="Message" {...register('message')} required />
          {errors.message && <p>{errors.message.message}</p>}
        </div>
        {contactData && <p>Contact information has been submitted!</p>}
        <input type="submit" value="Submit" />
      </form>
    </section>
  )
}
