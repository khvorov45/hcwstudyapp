import { Postgres } from '../lib/db'

test('reset-default-db', async () => {
  // Default initialisation (check that it doesn't fail but don't modify)
  const db = new Postgres()
  await db.update(true)
  expect(await db.isEmpty()).toBe(false)
  await db.end()
})
