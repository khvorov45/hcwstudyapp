import { NextApiRequest, NextApiResponse } from 'next'
import db from '../../lib/db'

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const allUsers = await db.user.getUsers()
  for (const user of allUsers) {
    if (req.body.email !== user.email) continue
    console.log(user)
    res.status(200).end()
    return
  }
  // TODO
  // Generate a token and send it
  // Hash the token and store it in the database
  res.status(404).end()
}
