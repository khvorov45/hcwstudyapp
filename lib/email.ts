import nodemailer from 'nodemailer'
import config from './config'

const transporter = nodemailer.createTransport({
  host: config.emailCredentials.host,
  port: config.emailCredentials.port,
  secure: false, // upgrade later with STARTTLS
  auth: {
    user: config.emailCredentials.user,
    pass: config.emailCredentials.password
  }
})

export function sendEmail (
  to: string, subject: string, text: string, html: string
) {
  transporter.sendMail({
    from: config.emailCredentials.user,
    to: to,
    subject: subject,
    text: text,
    html: html
  })
}
