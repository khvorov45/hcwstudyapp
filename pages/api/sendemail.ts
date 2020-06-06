import { NextApiRequest, NextApiResponse } from 'next'
import db from '../../lib/db'
import cryptoRandomString from 'crypto-random-string'
import bcrypt from 'bcrypt'
import { sendEmail } from '../../lib/email'

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const allUsers = await db.user.getUsers()
  for (const user of allUsers) {
    if (req.body.email !== user.email) continue
    const token = cryptoRandomString({ length: 10 })
    const link = generateLink(
      req.headers.origin, token, user.id.toString()
    )
    sendEmail(
      user.email,
      'HCW Study Reports link',
      `Your link:\n\n${link}`,
      `<a href=${link}>Reports link</a>`
    )
    const hash = await bcrypt.hash(token, 10)
    console.log(`Supposed to store ${hash} in the database`)
    res.status(200).end()
    return
  }
  // TODO
  // Send the token
  // Store tokenhash in the database
  res.status(404).end()
}

function generateLink (
  origin: string | string[], token: string, id: string
): string {
  return `${origin}/?id=${id}&token=${token}`
}
