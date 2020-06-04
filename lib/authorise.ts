import { getAllSites } from './sites'

export async function authorise (site?: string, token?: string) {
  if (!site || !token) return false
  const allSites = await getAllSites()
  if (!allSites.includes(site)) return false
  console.log(allSites)
  console.log(`supposed to authorise access to ${site} with ${token}`)
  return false
}
