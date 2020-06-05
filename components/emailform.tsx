import React from 'react'
import styles from './form.module.css'
import inputStyles from './input.module.css'

export default class EmailForm
  extends React.Component<{message: string}, {email: string}> {
  constructor (props: {message: string}) {
    super(props)
    this.state = { email: '' }
    this.handleChange = this.handleChange.bind(this)
    this.handleSubmit = this.handleSubmit.bind(this)
  }

  handleChange (event) { this.setState({ email: event.target.value }) }
  handleSubmit (event) {
    console.log('An email was submitted: ' + this.state.email)
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
        <input
          className={`${inputStyles.input} ${inputStyles.submitButton}`}
          type="submit"
          value="Submit"
        />
      </form>
    )
  }
}
