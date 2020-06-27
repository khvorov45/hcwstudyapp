import { NextApiRequest, NextApiResponse } from 'next'
import { Postgres } from '../../lib/db'
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
    const db = await new Postgres().init()
    if (!await db.userExists(email)) {
      res.setHeader('WWW-Authenticate', 'Basic realm=dbaccess')
      res.status(401).end()
      return
    }
    const token = cryptoRandomString({ length: 32, type: 'url-safe' })
    await db.storeUserToken(email, token)
    await sendAccessLink(req.headers.origin, email, token)
    await db.end()
    res.status(200).end()
  } catch (error) {
    console.error(error)
    res.status(500).end()
  }
}