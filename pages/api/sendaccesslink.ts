import { NextApiRequest, NextApiResponse } from 'next'
import db from '../../lib/db'
import cryptoRandomString from 'crypto-random-string'
import { sendAccessLink } from '../../lib/email'

export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    res.status(405).end()
    return
  }
  if (!req.body.email) {
    res.status(404).end()
    return
  }
  try {
    const email = req.body.email.toLowerCase()
    if (!await db.userExists(email)) {
      res.status(404).end()
      return
    }
    const token = cryptoRandomString({ length: 32, type: 'url-safe' })
    await db.storeUserToken(email, token)
    await sendAccessLink(
      // I guess sometimes the origin header isn't present
      req.headers.origin || 'https://reports.hcwflustudy.com', email, token
    )
    res.status(200).end()
  } catch (error) {
    console.error(error)
    res.status(500).end()
  }
}
