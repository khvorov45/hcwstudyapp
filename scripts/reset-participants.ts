import { Postgres } from '../lib/db'

test('reset-participants', async () => {
  const db = new Postgres()
  await db.resetParticipantTable()
  expect(await db.isEmpty()).toBe(false)
  await db.end()
})
