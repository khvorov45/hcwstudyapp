import React, { useState } from 'react'
import { TextLineLabelled, Form } from './input'

export default function EmailForm (props: {message: string}) {
  const [email, setEmail] = useState('')
  const [success, setSuccess] = useState(undefined)
  const [errormsg, setErrormsg] = useState('')

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
      if (res.status === 404) {
        setErrormsg(
          'Email not found - make sure it\'s the email ' +
          'associated with the REDCap account'
        )
      } else if (res.status === 500) {
        setErrormsg(
          'Server error, try again later'
        )
      } else {
        setErrormsg(`Unknown error, return status ${res.status}`)
      }
    })
    event.preventDefault()
  }

  return (
    <Form
      onSubmit={handleSubmit}
      success={success}
      errormsg={errormsg}
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
