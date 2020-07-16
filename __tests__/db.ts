import { Postgres } from '../lib/db'
import { newconfig } from '../lib/config'
import bcrypt from 'bcrypt'

test('postgres', async () => {
  // Basic initialisation
  const conf = newconfig.db.postgres
  conf.users = newconfig.db.users
  // Local users should override redcap
  conf.database = 'hcwstudy-test'
  const db = new Postgres(conf)

  // Simulate connection to an empty database
  await db.removeTables()
  expect(await db.isEmpty()).toBe(true)
  await db.update(true)
  expect(await db.isEmpty()).toBe(false)
  const firstFillTimestamp = await db.getLastFill()

  // Check users
  expect(await db.getUserAccessGroup('khvorov45@gmail.com'))
    .toBe('admin')
  expect(await db.getUserAccessGroup('arseniy.khvorov@mh.org.au'))
    .toBe('melbourne')
  expect(await db.userExists('ARSENIY.khvorov@mh.org.au')).toBe(true)
  expect(await db.userExists('nonexistent')).toBe(false)
  let user = await db.getUser('KHVOROV45@gmail.com')
  expect(user.accessGroup)
    .toBe(await db.getUserAccessGroup('khvorov45@GMAIL.com'))

  // Tokenhash should be persistent across soft updates
  await db.storeUserToken('khvorov45@gmail.com', '123')
  let storedHash = await db.getUserTokenHash('khvorov45@gmail.com')
  expect(await bcrypt.compare('123', storedHash)).toBe(true)
  await db.update(false)
  user = await db.getUser('KHVOrov45@gmail.COM')
  storedHash = await db.getUserTokenHash('khvorov45@Gmail.com')
  expect(await bcrypt.compare('123', storedHash)).toBe(true)
  expect(user.tokenhash).toBe(storedHash)

  // Check authorisation
  expect(await db.authoriseUser('khvorov45@gmail.com', '123')).toBe(true)
  expect(await db.authoriseUser('khvorov45@gmail.com', '1234')).toBe(false)
  expect(await db.authoriseUser('arseniy.khvorov@mh.org.au', '123')).toBe(false)
  expect(await db.authoriseUser('khvorov45@gmail.com', null)).toBe(null)

  // Tokenhash should not be persistent across hard updates
  await db.update(true)
  expect(await db.getUserTokenHash('khvorov45@gmail.com')).toBe(null)

  // Update time is correctly stored
  expect((await db.getLastFill()).getTime())
    .toBeGreaterThan(firstFillTimestamp.getTime())

  // Participant export
  let part = await db.getParticipants('unrestricted')
  let partAccessGroups = part.map(p => p.accessGroup)
  expect(partAccessGroups.includes('melbourne')).toBe(true)
  expect(partAccessGroups.includes('adelaide')).toBe(true)
  part = await db.getParticipants('melbourne')
  partAccessGroups = part.map(p => p.accessGroup)
  expect(partAccessGroups.includes('melbourne')).toBe(true)
  expect(partAccessGroups.includes('adelaide')).toBe(false)

  // Baseline export
  const baseline = await db.getParticipantsBaseline('unrestricted')
  expect(typeof baseline[0].age).toBe('number')

  await db.end()
}, 25000)
