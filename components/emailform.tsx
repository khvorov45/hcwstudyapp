import React from 'react'
import SubmitButton from './submit'
import styles from './form.module.css'
import inputStyles from './input.module.css'

// TODO: rewrite with hooks? May be useful for reusing stateful logic

export default class EmailForm extends React.Component<
  {message: string}, {email: string, success?: boolean}
> {
  constructor (props: {message: string}) {
    super(props)
    this.state = { email: '' }
    this.handleChange = this.handleChange.bind(this)
    this.handleSubmit = this.handleSubmit.bind(this)
  }

  handleChange (event) { this.setState({ email: event.target.value }) }
  handleSubmit (event) {
    const myHeaders = new Headers()
    myHeaders.append('Content-Type', 'application/json')
    fetch('/api/sendemail', {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify({ email: this.state.email })
    }).then((res) => {
      if (res.status === 200) {
        this.setState({ success: true })
      } else {
        this.setState({ success: false })
      }
    })
    event.preventDefault()
  }

  render () {
    return (
      <form className={styles.form} onSubmit={this.handleSubmit}>
        <label htmlFor="email">{this.props.message}</label>
        <input
          className={`${inputStyles.input} ${inputStyles.text}`}
          id="email"
          type="email"
          value={this.state.email}
          onChange={this.handleChange}
          placeholder="name@example.org"
        />
        <SubmitButton
          success={this.state.success}
          errormsg={
            'Email not found - make sure it\'s the email ' +
            'associated with the REDCap account'
          }
        />
      </form>
    )
  }
}
