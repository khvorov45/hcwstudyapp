import db from './db'
import bcrypt from 'bcrypt'

export async function authorise (email: string, token: string) {
  if (!email || !token) return null
  const allUsers = await (await db).getUsers()
  for (const user of allUsers) {
    if (user.email !== email || !user.tokenhash) continue
    return await bcrypt.compare(token, user.tokenhash)
  }
  return false
}
