import db, { Database, UserDB } from '../lib/db'
import config from '../lib/config'
import fs from 'fs'
import path from 'path'

const testsDir = path.join(process.cwd(), '__tests__')
const testDbPath = path.join(testsDir, 'test-db.sqlite3')
const userTestDbPath = path.join(testsDir, 'user-test.sqlite3')
const userSql = path.join(process.cwd(), 'db', 'init-tables-user.sql')

class DatabaseTest extends Database {
  num = 0
  constructor () {
    super(testDbPath, userSql)
  }

  setNum (num: number) {
    this.num = num
  }
}

test('Base database creation', async () => {
  if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath)
  let db = new Database(testDbPath, userSql)
  expect(db.newFile).toBe(undefined)
  await db.init()
  expect(db.newFile).toBe(true)
  db = await new Database(testDbPath, userSql).init()
  expect(db.newFile).toBe(false)
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

test('User export', async () => {
  let user = await (await db).getUser('id', 1)
  expect(user.id).toBe(1)
  user = await (await db).getUser('email', 'khvorov45@gmail.com')
  expect(user.email).toBe('khvorov45@gmail.com')
  // I mostly need to know that this doesn't fail
  const allUsers = await (await db).getUsers()
  expect(allUsers.length > 1).toBe(true)
})

test('Participant export', async () => {
  const accessGroup = 'melbourne'
  const participants = await (await db).getParticipants(accessGroup)
  expect(participants.length).toBeGreaterThan(0)
  for (const participant of participants) {
    expect(participant.accessGroup === accessGroup).toBe(true)
  }
  const allParticipants = await (await db).getParticipants()
  expect(allParticipants.length).toBeGreaterThan(0)
})

test('Update', async () => {
  if (fs.existsSync(userTestDbPath)) fs.unlinkSync(userTestDbPath)

  let extraAccessGroups = ['test-access-group', 'temp-access-group']
  let extraUsers = [
    { email: 'test@test.test', accessGroup: 'unrestricted' },
    { email: 'test-persist@test.test', accessGroup: 'unrestricted' }
  ]

  const db = await new UserDB(
    userTestDbPath,
    userSql,
    async () => extraUsers,
    async () => (await config.getExtraAccessGroups()).concat(extraAccessGroups)
  ).init()

  const accesGroupsBefore = await db.getAccessGroups()
  expect(accesGroupsBefore.includes('test-access-group')).toBe(true)
  expect(accesGroupsBefore.includes('temp-access-group')).toBe(true)
  const allEmailsBefore = await db.getUserEmails()
  expect(allEmailsBefore.includes('test@test.test')).toBe(true)
  expect(allEmailsBefore.includes('test-persist@test.test')).toBe(true)
  expect((await db.getUser('email', 'test-persist@test.test')).accessGroup)
    .toBe('unrestricted')

  extraAccessGroups = ['test-access-group', 'temp2-access-group']
  extraUsers = [
    { email: 'test2@test.test', accessGroup: 'unrestricted' },
    { email: 'test-persist@test.test', accessGroup: 'admin' },
    { email: 'arseniy.khvorov@mh.org.au', accessGroup: 'unrestricted' }
  ]

  await db.update()

  const accessGroupsAfter = await db.getAccessGroups()
  expect(accessGroupsAfter.includes('test-access-group')).toBe(true)
  expect(accessGroupsAfter.includes('temp-access-group')).toBe(false)
  expect(accessGroupsAfter.includes('temp2-access-group')).toBe(true)
  const allEmailsAfter = await db.getUserEmails()
  expect(allEmailsAfter.includes('test@test.test')).toBe(false)
  expect(allEmailsAfter.includes('test2@test.test')).toBe(true)
  expect(allEmailsAfter.includes('test-persist@test.test')).toBe(true)
  expect(allEmailsBefore.length).toBe(allEmailsAfter.length)
  expect((await db.getUser('email', 'test-persist@test.test')).accessGroup)
    .toBe('admin')
  expect((await db.getUser('email', 'arseniy.khvorov@mh.org.au')).accessGroup)
    .toBe('unrestricted')

  extraUsers = [
    { email: 'arseniy.khvorov@mh.org.au', accessGroup: 'admin' }
  ]

  await db.update()

  expect((await db.getUser('email', 'arseniy.khvorov@mh.org.au')).accessGroup)
    .toBe('admin')

  await db.storeTokenHash('123', 1)

  await db.update()

  expect((await db.getUser('id', 1)).tokenhash).toBe('123')

  await db.reset()

  expect((await db.getUser('id', 1)).tokenhash).toBe(null)

  fs.unlinkSync(userTestDbPath)
}, 15000)
