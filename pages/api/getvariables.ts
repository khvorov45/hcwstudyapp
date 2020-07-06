import { NextApiRequest, NextApiResponse } from 'next'
import { newconfig } from '../../lib/config'

export default async function (req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    res.status(405).end()
  }
  res.setHeader('Content-Type', 'application/json')
  res.status(200).send(JSON.stringify(await newconfig.db.variables.Participant))
}
