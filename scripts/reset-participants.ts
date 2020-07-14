import { Postgres } from '../lib/db'

test('reset-participants', async () => {
  const db = new Postgres()
  await db.resetAllParticipantTables()
  expect(await db.isEmpty()).toBe(false)
  await db.end()
})
