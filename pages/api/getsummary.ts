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
  let accessGroup: string
  const actualAccessGroup = await db.getUserAccessGroup(email)
  if (!req.query.accessGroup) {
    accessGroup = actualAccessGroup
  } else if (
    ['unrestricted', 'admin'].includes(actualAccessGroup) ||
      actualAccessGroup === req.query.accessGroup.toString()
  ) {
    accessGroup = req.query.accessGroup.toString()
  } else {
    res.status(401).end()
    return
  }
  const data = await db.getSiteVacSummary(
    accessGroup, req.query.withdrawn
      ? req.query.withdrawn === 'yes' ? true
        : req.query.withdrawn === 'no' ? false : null
      : null
  )
  res.status(200).send(data)
}
