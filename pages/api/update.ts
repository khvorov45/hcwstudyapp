import { NextApiRequest, NextApiResponse } from 'next'
import db from '../../lib/db'
import { authorise } from '../../lib/authorise'

export default async function (req: NextApiRequest, res: NextApiResponse) {
  const authorised = await authorise(req.body.email, req.body.token)
  if (!authorised) {
    res.status(401).end()
    return
  }
  await (await db).update()
  res.status(200).send((await db).lastUpdate)
}
