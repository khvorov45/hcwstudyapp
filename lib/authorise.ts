import db from './db'
import bcrypt from 'bcrypt'

export async function authorise (id: number, token: string) {
  if (!id || !token) return null
  const allUsers = await (await db.user).getUsers()
  for (const user of allUsers) {
    if (user.id !== id) continue
    return await bcrypt.compare(token, user.tokenhash)
  }
  return false
}
