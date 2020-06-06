import { NextApiRequest, NextApiResponse } from 'next'
import db from '../../lib/db'
import cryptoRandomString from 'crypto-random-string'
import bcrypt from 'bcrypt'

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const allUsers = await db.user.getUsers()
  for (const user of allUsers) {
    if (req.body.email !== user.email) continue
    const token = cryptoRandomString({ length: 10 })
    const link = generateLink(
      req.headers.origin, token, user.id.toString()
    )
    console.log(`Supposed to send ${link} to ${user.email}`)
    res.status(200).end()
    return
  }
  // TODO
  // Send the token
  // Hash the token
  // Store token in the database
  res.status(404).end()
}

function generateLink (
  origin: string | string[], token: string, id: string
): string {
  return `${origin}/?id=${id}&token=${token}`
}
