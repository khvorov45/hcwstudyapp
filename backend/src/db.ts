import pgp from "pg-promise"
import pg from "pg-promise/typescript/pg-subset"
import { AccessGroup, AccessGroupV, Participant, User } from "./data"
import { hash } from "./auth"
import { exportUsers, RedcapConfig, exportParticipants } from "./redcap"

const pgpInit = pgp()

export type DB = pgp.IDatabase<{}, pg.IClient>

type EmailToken = { email: string; token: string }

export async function create({
  dbConnectionString,
  clean,
  firstAdminEmail,
  firstAdminToken,
}: {
  dbConnectionString: string
  clean: boolean
  firstAdminEmail: string
  firstAdminToken: string
}): Promise<DB> {
  console.log(`connecting to ${dbConnectionString}`)
  const db = pgpInit(dbConnectionString)
  const firstAdmin: EmailToken = {
    email: firstAdminEmail,
    token: firstAdminToken,
  }
  try {
    await db.connect()
    console.log(`connected successfully to ${dbConnectionString}`)
  } catch (e) {
    throw Error(`could not connect to ${dbConnectionString}: ${e.message}`)
  }
  if (clean) {
    console.log("cleaning db")
    await resetSchema(db)
    await init(db, firstAdmin)
  } else if (await isEmpty(db)) {
    console.log("database empty, initializing")
    await init(db, firstAdmin)
  }
  return db
}

async function getTableNames(db: DB): Promise<string[]> {
  return await db.map(
    "SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public';",
    [],
    (r) => r.tablename
  )
}

async function isEmpty(db: DB): Promise<boolean> {
  return (await getTableNames(db)).length === 0
}

async function init(db: DB, firstAdmin: EmailToken): Promise<void> {
  await db.any(new pgp.QueryFile("../sql/init.sql"), {
    accessGroupValues: Object.keys(AccessGroupV.keys),
  })
  await insertUsers(db, [
    {
      email: firstAdmin.email,
      accessGroup: "admin",
    },
  ])
  await updateUserToken(db, firstAdmin)
  await db.any('INSERT INTO "LastRedcapSync" VALUES (NULL, NULL)')
}

async function resetSchema(db: DB): Promise<void> {
  await db.any('DROP SCHEMA "public" CASCADE;')
  await db.any('CREATE SCHEMA "public";')
}

export async function getLastUpdate(db: DB): Promise<Date> {
  return await db.one(
    'SELECT "lastUpdate" FROM "Meta";',
    [],
    (v) => v.lastUpdate
  )
}

export async function getUsers(db: DB): Promise<User[]> {
  return await db.any('SELECT * FROM "User"')
}

export async function getUserByEmail(db: DB, email: string): Promise<User> {
  return await db.one('SELECT * FROM "User" WHERE "email"=$1', [email])
}

export async function getUserByTokenhash(
  db: DB,
  tokenhash: string
): Promise<User> {
  return await db.one('SELECT * FROM "User" WHERE "tokenhash"=$1', [tokenhash])
}

export async function insertUsers(
  db: DB,
  us: { email: string; accessGroup: AccessGroup }[]
): Promise<void> {
  if (us.length === 0) {
    return
  }
  // Best not to use Object.keys here because there may be more fields in the
  // actual object that's passed
  await db.any(pgpInit.helpers.insert(us, ["email", "accessGroup"], "User"))
}

export async function deleteUser(db: DB, email: string): Promise<void> {
  await db.any('DELETE FROM "User" WHERE email=$1', [email])
}

export async function deleteUsers(db: DB, emails: string[]): Promise<void> {
  await db.any('DELETE FROM "User" WHERE email IN ($1:csv)', [emails])
}

/** Will not touch the admins, drop everyone else and replace with redcap users
 */
export async function syncRedcapUsers(
  db: DB,
  redcapConfig: RedcapConfig
): Promise<void> {
  const [redcapUsers, dbUsers] = await Promise.all([
    exportUsers(redcapConfig),
    getUsers(db),
  ])
  const dbNonAdminUsers = dbUsers.filter((u) => u.accessGroup !== "admin")
  const dbNonAdminEmails = dbNonAdminUsers.map((u) => u.email)
  if (dbNonAdminEmails.length > 0) {
    await deleteUsers(db, dbNonAdminEmails)
  }
  await insertUsers(db, redcapUsers)
  // Restore hashes
  await Promise.all(
    dbNonAdminUsers
      .filter((u) => u.tokenhash)
      .map((u) => restoreUserTokenHash(db, u))
  )
  await db.any('UPDATE "LastRedcapSync" SET "user" = $1', [new Date()])
}

export async function updateUserToken(db: DB, et: EmailToken) {
  const res = await db.result(
    'UPDATE "User" SET tokenhash = $1 WHERE email = $2',
    [hash(et.token), et.email]
  )
  if (res.rowCount === 0) {
    throw Error("NOT FOUND: no such email " + et.email)
  }
}

async function restoreUserTokenHash(db: DB, u: User): Promise<void> {
  await db.result('UPDATE "User" SET tokenhash = $1 WHERE email = $2', [
    u.tokenhash,
    u.email,
  ])
}

export async function getParticipants(db: DB): Promise<Participant[]> {
  return await db.any('SELECT * FROM "Participant"')
}

export async function insertParticipant(db: DB, p: Participant): Promise<void> {
  await db.any(pgpInit.helpers.insert(p, Object.keys(p), "Participant"))
}

export async function deleteParticipant(
  db: DB,
  redcapRecordId: string
): Promise<void> {
  await db.any('DELETE FROM "Participant" WHERE "redcapRecordId"=$1', [
    redcapRecordId,
  ])
}
