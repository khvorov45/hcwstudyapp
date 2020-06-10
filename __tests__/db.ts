import { Database } from '../lib/db'
import fs from 'fs'
import path from 'path'

const testDbPath = path.join(process.cwd(), 'db', 'test-db.sqlite3')

test('Base database creation', async () => {
  if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath)
  const db = new Database('test-db', 'init-tables-test')
  expect(db.needFill).toBe(true)
})
