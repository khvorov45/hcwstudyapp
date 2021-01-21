import Mail from "nodemailer/lib/mailer"
import { createTransport as nmCreateTransport } from "nodemailer"
import { parseConnectionUrl } from "nodemailer/lib/shared"

/** Wraps `Mail` from `nodemailer` to allow metadata access */
export type Emailer = {
  from: string
  transporter: Mail
}

export function createTransport(con: string): Emailer {
  const opts = parseConnectionUrl(con)
  if (!opts.auth?.user) {
    throw Error("bad connection string: could not find user")
  }
  return {
    from: opts.auth.user,
    transporter: nmCreateTransport(opts),
  }
}

export async function emailLoginLink(
  t: Emailer,
  {
    email,
    token,
    frontendRoot,
  }: {
    email: string
    token: string
    frontendRoot: string
  }
): Promise<void> {
  const content = `Login link:\n\n${frontendRoot}/login?token=${token}`
  await t.transporter.sendMail({
    from: t.from,
    to: email,
    subject: "NIH HCW Study Login Link",
    text: content,
    html: content.replace(/\n/g, "<br/>"),
  })
}

export async function emailApiToken(
  t: Emailer,
  {
    email,
    token,
  }: {
    email: string
    token: string
  }
): Promise<void> {
  const content = `API token:\n\n${token}`
  await t.transporter.sendMail({
    from: t.from,
    to: email,
    subject: "NIH HCW Study API Token",
    text: content,
    html: content.replace(/\n/g, "<br/>"),
  })
}
