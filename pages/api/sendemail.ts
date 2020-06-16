import { NextApiRequest, NextApiResponse } from 'next'
import db from '../../lib/db'
import cryptoRandomString from 'crypto-random-string'
import bcrypt from 'bcrypt'
import { sendEmail } from '../../lib/email'

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const allUsers = await (await db).getUsers()
  for (const user of allUsers) {
    if (req.body.email.toLowerCase() !== user.email) continue
    const token = cryptoRandomString({ length: 10, type: 'url-safe' })
    const link = generateLink(
      req.headers.origin, token, user.id.toString()
    )
    try {
      const emailPromise = sendEmail(
        user.email,
        'HCW Study Reports link',
        `Your link:\n\n${link}`,
        `<a href=${link}>Reports link</a>`
      )
      const hashPromise = bcrypt.hash(token, 10)
      const [email, hash] = await Promise.all([emailPromise, hashPromise])
      console.log(email)
      await (await db).storeTokenHash(hash, user.id)
      res.status(200).end()
      return
    } catch (error) {
      console.error(error)
      res.status(500).end()
      return
    }
  }
  res.status(404).end()
}

function generateLink (
  origin: string | string[], token: string, id: string
): string {
  return `${origin}/?id=${id}&token=${token}`
}
