import React, { useState } from 'react'
import { TextLineLabelled, Form } from './input'

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
    <Form
      onSubmit={handleSubmit}
      success={success}
      errormsg={
        'Email not found - make sure it\'s the email ' +
      'associated with the REDCap account'
      }
    >
      <TextLineLabelled
        label={props.message}
        value={email}
        onChange={handleChange}
        type="email"
        placeholder="name@example.org"
        id="email"
      />
    </Form>
  )
}
