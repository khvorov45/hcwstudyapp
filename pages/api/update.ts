import { NextApiRequest, NextApiResponse } from 'next'
import db from '../../lib/db'
import { authorise } from '../../lib/authorise'

export default async function (req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    res.status(200).send(await (await db).getLastUpdate())
    return
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST')
    res.status(405).end()
  }
  const authorised = await authorise(req.body.email, req.body.token)
  if (!authorised) {
    res.setHeader('WWW-Authenticate', 'Basic realm=dbaccess')
    res.status(401).end()
    return
  }
  console.log('actually updating db')
  await (await db).update()
  res.status(200).send(await (await db).getLastUpdate())
}
