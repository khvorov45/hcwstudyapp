import { NextApiRequest, NextApiResponse } from 'next'

export default (req: NextApiRequest, res: NextApiResponse) => {
  console.log(req.body)
  // TODO
  // Check email is present in the database
  // Generate a token and send it
  // Hash the token and store it in the database
  res.status(210).end()
}
