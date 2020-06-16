import db from './db'
import bcrypt from 'bcrypt'

export async function authorise (id: number, token: string) {
  if (!id || !token) return null
  const allUsers = await (await db).getUsers()
  for (const user of allUsers) {
    if (user.id !== id || !user.tokenhash) continue
    return await bcrypt.compare(token, user.tokenhash)
  }
  return false
}
