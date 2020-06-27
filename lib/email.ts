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

export async function sendEmail (
  to: string, subject: string, text: string, html: string
): Promise<any> {
  return await transporter.sendMail({
    from: config.emailCredentials.user,
    to: to,
    subject: subject,
    text: text,
    html: html
  })
}

export async function sendAccessLink (
  origin: string, email: string, token: string
): Promise<any> {
  const link = `http://${origin}/?email=${email}&token=${token}`
  return await sendEmail(
    email,
    'HCW Study Reports link',
    `Your link:\n\n${link}`,
    `<a href=${link}>Reports link:</a><br/><br/>${link}`
  )
}
