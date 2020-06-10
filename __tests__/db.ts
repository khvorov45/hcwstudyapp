import { Database } from '../lib/db'
import fs from 'fs'
import path from 'path'

const testDbPath = path.join(process.cwd(), 'db', 'test-db.sqlite3')

class DatabaseTest extends Database {
  num = 0
  constructor () {
    super('test-db', 'init-tables-test')
  }

  setNum (num: number) {
    this.num = num
  }
}

test('Base database creation', async () => {
  if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath)
  let db = new Database('test-db', 'init-tables-test')
  expect(db.needFill).toBe(undefined)
  await db.init()
  expect(db.needFill).toBe(true)
  db = await new Database('test-db', 'init-tables-test').init()
  expect(db.needFill).toBe(false)
})

test('Resolving promised DBs multiple times', async () => {
  const dbTestPromise = new DatabaseTest().init()
  const dbTest = await dbTestPromise
  expect(dbTest.num).toBe(0)
  dbTest.setNum(42)
  const dbTest2 = await dbTestPromise
  expect(dbTest2.num).toBe(42)
})
