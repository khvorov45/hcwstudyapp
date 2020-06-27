import { NextApiRequest, NextApiResponse } from 'next'
import db from '../../lib/db'

export default async function (req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    res.status(200).send(await db.getLastFill())
    return
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST')
    res.status(405).end()
  }
  if (!req.body.email || !req.body.token) {
    res.status(401).end()
    return
  }
  const email = req.body.email.toString().toLowerCase()
  const token = req.body.token.toString()
  if (!await db.authoriseUser(email, token)) {
    res.status(401).end()
    return
  }
  await db.update(false)
  res.status(200).send(await db.getLastFill())
}
