import { NextApiRequest, NextApiResponse } from 'next'
import db from '../../lib/db'

export default async function (req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    res.status(405).end()
    return
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
  const accessGroup = await db.getUserAccessGroup(email)
  let data: any
  if (!req.query.subset) {
    data = await db.getParticipants(accessGroup)
  } else if (req.query.subset === 'contact') {
    data = await db.getParticipantsContact(accessGroup)
  } else if (req.query.subset === 'baseline') {
    data = await db.getParticipantsBaseline(accessGroup)
  } else {
    res.status(404).end()
    return
  }
  res.status(200).send(data)
}
