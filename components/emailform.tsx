import React, { useState } from 'react'
import SubmitButton from './submit'
import styles from './form.module.css'
import inputStyles from './input.module.css'

export default function EmailForm (props: {message: string}) {
  const [email, setEmail] = useState('')
  const [success, setSuccess] = useState(undefined)

  function handleChange (event) { setEmail(event.target.value) }

  function handleSubmit (event) {
    const myHeaders = new Headers()
    myHeaders.append('Content-Type', 'application/json')
    fetch('/api/sendemail', {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify({ email: email })
    }).then((res) => {
      if (res.status === 200) {
        setSuccess(true)
      } else {
        setSuccess(false)
      }
    })
    event.preventDefault()
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <label htmlFor="email">{props.message}</label>
      <input
        className={`${inputStyles.input} ${inputStyles.text}`}
        id="email"
        type="email"
        value={email}
        onChange={handleChange}
        placeholder="name@example.org"
      />
      <SubmitButton
        success={success}
        errormsg={
          'Email not found - make sure it\'s the email ' +
          'associated with the REDCap account'
        }
      />
    </form>
  )
}
