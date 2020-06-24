import db from './db'
import bcrypt from 'bcrypt'

export async function authorise (email: string, token: string) {
  if (!email || !token) return null
  const user = await (await db).getUser(email)
  if (!user || !user.tokenhash) return false
  return await bcrypt.compare(token, user.tokenhash)
}
