import { DatabasePostgres } from '../lib/db'
import { newconfig } from '../lib/config'
import bcrypt from 'bcrypt'

test('postgres', async () => {
  // Basic initialisation
  const conf = newconfig.db.postgres
  conf.users = newconfig.db.users
  conf.database = 'hcwstudy-test'
  let db = new DatabasePostgres(conf)

  // Simulate connection to an empty database
  await db.removeTables()
  expect(await db.isEmpty()).toBe(true)
  await db.init()
  expect(await db.isEmpty()).toBe(false)
  const firstFillTimestamp = await db.getLastFill()

  // Tokenhash is persistent across soft updates
  await db.storeUserToken('khvorov45@gmail.com', '123')
  let storedHash = await db.getUserTokenHash('khvorov45@gmail.com')
  expect(await bcrypt.compare('123', storedHash)).toBe(true)
  expect(await db.authoriseUser('khvorov45@gmail.com', '123')).toBe(true)
  expect(await db.authoriseUser('khvorov45@gmail.com', '1234')).toBe(false)
  expect(await db.authoriseUser('arseniy.khvorov@mh.org.au', '123')).toBe(false)
  expect(await db.authoriseUser('khvorov45@gmail.com', null)).toBe(null)
  await db.update(false)
  storedHash = await db.getUserTokenHash('khvorov45@gmail.com')
  expect(await bcrypt.compare('123', storedHash)).toBe(true)
  // But not across hard updates
  await db.update(true)
  expect(await db.getUserTokenHash('khvorov45@gmail.com')).toBe(null)
  await db.end()

  // Local users override redcap
  conf.users.push(
    { email: 'ARSENIY.KHVOROV@MH.ORG.AU', accessGroup: 'MELBOURNE' }
  )
  db = new DatabasePostgres(conf)
  await db.update(false)
  expect(await db.getUserAccessGroup('arseniy.khvorov@mh.org.au'))
    .toBe('melbourne')
  expect(await db.userExists('arseniy.khvorov@mh.org.au'))
    .toBe(true)
  expect(await db.userExists('nonexistent'))
    .toBe(false)

  await db.update(false)
  expect(await db.getUserAccessGroup('khvorov45@gmail.com'))
    .toBe('admin')

  // Update time is correctly stored
  expect((await db.getLastFill()).getTime())
    .toBeGreaterThan(firstFillTimestamp.getTime())

  await db.end()

  // Default initialisation (check that it doesn't fail but don't modify)
  db = await new DatabasePostgres().init()

  // Participant export
  let part = await db.getParticipants()
  let partAccessGroups = part.map(p => p.accessGroup)
  expect(partAccessGroups.includes('melbourne')).toBe(true)
  expect(partAccessGroups.includes('adelaide')).toBe(true)
  part = await db.getParticipants('melbourne')
  partAccessGroups = part.map(p => p.accessGroup)
  expect(partAccessGroups.includes('melbourne')).toBe(true)
  expect(partAccessGroups.includes('adelaide')).toBe(false)

  await db.end()
}, 10000)
