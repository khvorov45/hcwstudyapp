import { NextApiRequest, NextApiResponse } from 'next'
import db from '../../lib/db'

export default async function (req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    res.status(405).end()
    return
  }
  res.setHeader('Content-Type', 'application/json')
  if (!req.query.email || !req.query.token ||
    req.query.email === 'undefined' || req.query.token === 'undefined' ||
    req.query.email === 'null' || req.query.token === 'null') {
    res.status(200).send(JSON.stringify(null))
    return
  }
  const email = req.query.email.toString().toLowerCase()
  const token = req.query.token.toString()
  res.setHeader('Content-Type', 'application/json')
  res.status(200).send(JSON.stringify(await db.authoriseUser(email, token)))
}
