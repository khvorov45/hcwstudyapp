import db, { Database, UserDB } from '../lib/db'
import fs from 'fs'
import path from 'path'

const testDbPath = path.join(process.cwd(), 'db', 'test-db.sqlite3')
const userTestDbPath = path.join(process.cwd(), 'db', 'user-test.sqlite3')

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
  fs.unlinkSync(testDbPath)
})

test('Resolving promised DBs multiple times', async () => {
  const dbTestPromise = new DatabaseTest().init()
  const dbTest = await dbTestPromise
  expect(dbTest.num).toBe(0)
  dbTest.setNum(42)
  const dbTest2 = await dbTestPromise
  expect(dbTest2.num).toBe(42)
  fs.unlinkSync(testDbPath)
})

test('User export by id', async () => {
  const neededIds = [1, 2]
  const users = await (await db).getUsers(neededIds)
  for (const user of users) {
    expect(neededIds.includes(user.id)).toBe(true)
  }
  const user = await (await db).getUser(1)
  expect(user.id).toBe(1)
})

test('Participant export by access group', async () => {
  const accessGroup = 'melbourne'
  const participants = await (await db).getParticipants(accessGroup)
  for (const participant of participants) {
    expect(participant.accessGroup === accessGroup).toBe(true)
  }
})

test('User update', async () => {
  if (fs.existsSync(userTestDbPath)) fs.unlinkSync(userTestDbPath)
  let extraUsers = [
    { email: 'test@test.test', accessGroup: 'unrestricted' },
    { email: 'test-persisit@test.test', accessGroup: 'unrestricted' }
  ]
  const db = await new UserDB('user-test', async () => extraUsers).init()
  const allEmailsBefore = await db.getUserEmails()
  expect(allEmailsBefore.includes('test@test.test')).toBe(true)
  expect(allEmailsBefore.includes('test-persisit@test.test')).toBe(true)
  extraUsers = [
    { email: 'test2@test.test', accessGroup: 'unrestricted' },
    { email: 'test-persisit@test.test', accessGroup: 'unrestricted' }
  ]
  await db.updateUsers()
  const allEmailsAfter = await db.getUserEmails()
  expect(allEmailsAfter.includes('test@test.test')).toBe(false)
  expect(allEmailsAfter.includes('test2@test.test')).toBe(true)
  expect(allEmailsAfter.includes('test-persisit@test.test')).toBe(true)
  expect(allEmailsBefore.length).toBe(allEmailsAfter.length)
  fs.unlinkSync(userTestDbPath)
})
