import { NextApiRequest, NextApiResponse } from 'next'
import db from '../../lib/db'

export default async function (req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    res.status(405).end()
  }
  if (!req.query.email || !req.query.token) {
    res.status(401).end()
    return
  }
  const email = req.query.email.toString().toLowerCase()
  const token = req.query.token.toString()
  if (!await db.authoriseUser(email, token)) {
    res.status(401).end()
    return
  }
  res.setHeader('Content-Type', 'application/json')
  res.status(200).send(JSON.stringify(await db.getUserAccessGroup(email)))
}