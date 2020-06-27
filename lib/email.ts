import nodemailer from 'nodemailer'
import { newconfig } from './config'

const transporter = nodemailer.createTransport({
  host: newconfig.email.host,
  port: newconfig.email.port,
  secure: false, // upgrade later with STARTTLS
  auth: {
    user: newconfig.email.user,
    pass: newconfig.email.password
  }
})

export async function sendEmail (
  to: string, subject: string, text: string, html: string
): Promise<any> {
  return await transporter.sendMail({
    from: newconfig.email.user,
    to: to,
    subject: subject,
    text: text,
    html: html
  })
}

export async function sendAccessLink (
  origin: string, email: string, token: string
): Promise<any> {
  const link = `${origin}/?email=${email}&token=${token}`
  return await sendEmail(
    email,
    'HCW Study Reports link',
    `Your link:\n\n${link}`,
    `<a href=${link}>Reports link:</a><br/><br/>${link}`
  )
}
