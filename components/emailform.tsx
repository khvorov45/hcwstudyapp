import React from 'react'
import SubmitButton from './submit'
import styles from './form.module.css'
import inputStyles from './input.module.css'

export default class EmailForm
  extends React.Component<
  {message: string}, {email: string, success?: boolean}> {
  constructor (props: {message: string}) {
    super(props)
    this.state = { email: '' }
    this.handleChange = this.handleChange.bind(this)
    this.handleSubmit = this.handleSubmit.bind(this)
  }

  handleChange (event) { this.setState({ email: event.target.value }) }
  handleSubmit (event) {
    console.log('An email was submitted: ' + this.state.email)
    const myHeaders = new Headers()
    myHeaders.append('Content-Type', 'application/json')
    fetch('/api/sendemail', {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify({ email: this.state.email })
    }).then((res) => {
      if (res.status === 200) {
        this.setState({ success: true })
        console.log('successfully sent email')
      } else {
        this.setState({ success: false })
        console.log('email was not sent')
      }
    })
    event.preventDefault()
  }

  render () {
    return (
      <form className={styles.form} onSubmit={this.handleSubmit}>
        <label>{this.props.message}</label>
        <input
          className={`${inputStyles.input} ${inputStyles.text}`}
          type="email"
          value={this.state.email}
          onChange={this.handleChange}
          placeholder="name@example.org"
        />
        <SubmitButton success={this.state.success}/>
      </form>
    )
  }
}
