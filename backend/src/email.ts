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

export async function emailToken(
  t: Emailer,
  {
    email,
    token,
    linkPrefix,
  }: {
    email: string
    token: string
    linkPrefix: string
  }
): Promise<void> {
  const content = `Login link:\n\n${linkPrefix}${token}`
  await t.transporter.sendMail({
    from: t.from,
    to: email,
    subject: "token",
    text: content,
    html: content.replace(/\n/g, "<br/>"),
  })
}
