import db from './db'

export async function authorise (site?: string, token?: string) {
  db.temp()
  if (!site || !token) return false
  console.log(`supposed to authorise access to ${site} with ${token}`)
  return false
}
