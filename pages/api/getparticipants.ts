import { NextApiRequest, NextApiResponse } from 'next'
import db from '../../lib/db'
import { authorise } from '../../lib/authorise'

export default async function (req: NextApiRequest, res: NextApiResponse) {
  const authorised = await authorise(req.body.email, req.body.token)
  if (!authorised) {
    res.status(401).end()
    return
  }
  const accessGroup = (await (await db).getUser(req.body.email)).accessGroup
  res.status(200).send(await (await db).getParticipants(accessGroup))
}
