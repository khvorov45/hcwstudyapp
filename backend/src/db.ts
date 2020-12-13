import pgp from "pg-promise"
import pg from "pg-promise/typescript/pg-subset"
import {
  AccessGroup,
  AccessGroupV,
  GenderV,
  isSite,
  Participant,
  RedcapId,
  SiteV,
  User,
  Vaccination,
  Withdrawn,
} from "./data"
import { hash } from "./auth"
import {
  exportUsers,
  RedcapConfig,
  exportParticipants,
  exportRedcapIds,
  exportWithdrawn,
} from "./redcap"

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
    genders: Object.keys(GenderV.keys),
    firstAdminEmail: firstAdmin.email,
    firstAdminTokenHash: hash(firstAdmin.token),
    sites: Object.keys(SiteV.keys),
  })
}

async function resetSchema(db: DB): Promise<void> {
  await db.any('DROP SCHEMA "public" CASCADE;')
  await db.any('CREATE SCHEMA "public";')
}

// Users ======================================================================

export async function getUsers(db: DB): Promise<User[]> {
  return await db.any('SELECT "email", "accessGroup" FROM "User"')
}

export async function getUserByEmail(db: DB, email: string): Promise<User> {
  return await db.one(
    'SELECT "email", "accessGroup" FROM "User" WHERE "email"=$1',
    [email]
  )
}

export async function getUserByTokenhash(
  db: DB,
  tokenhash: string
): Promise<User> {
  return await db.one(
    'SELECT "email", "accessGroup" FROM "User" WHERE "tokenhash"=$1',
    [tokenhash]
  )
}

export async function insertUsers(db: DB, us: User[]): Promise<void> {
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
    await db.any('SELECT * FROM "User"'),
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

export async function getLastUserUpdate(db: DB): Promise<Date | null> {
  return await db.one('SELECT "user" FROM "LastRedcapSync";', [], (v) => v.user)
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

// Particpants ================================================================

export async function getParticipantsSubset(
  db: DB,
  a: AccessGroup
): Promise<Participant[]> {
  return isSite(a)
    ? await db.any('SELECT * FROM "Participant" WHERE "accessGroup" = $1', [a])
    : await db.any('SELECT * FROM "Participant"')
}

export async function insertParticipants(
  db: DB,
  ps: Participant[],
  a: AccessGroup
): Promise<void> {
  if (isSite(a) && ps.find((p) => p.site !== a)) {
    throw Error("UNAUTHORIZED: participants with invalid site")
  }
  await db.any(
    pgpInit.helpers.insert(
      ps,
      [
        "pid",
        "site",
        "dateScreening",
        "email",
        "mobile",
        "addBleed",
        "dob",
        "gender",
        "baselineQuestComplete",
      ],
      "Participant"
    )
  )
}

export async function deleteParticipant(
  db: DB,
  redcapRecordId: string
): Promise<void> {
  await db.any('DELETE FROM "Participant" WHERE "redcapRecordId"=$1', [
    redcapRecordId,
  ])
}

export async function syncRedcapParticipants(
  db: DB,
  redcapConfig: RedcapConfig
) {
  // Wait for this to succeed before doing anyting else
  const [redcapParticipants, redcapIds, withdrawn] = await Promise.all([
    exportParticipants(redcapConfig),
    exportRedcapIds(redcapConfig),
    exportWithdrawn(redcapConfig),
  ])
  const redcapParticipantIds = redcapParticipants.map((r) => r.pid)

  await db.any('DELETE FROM "Participant"')
  await insertParticipants(db, redcapParticipants, "admin")
  await Promise.all([
    insertRedcapIds(
      db,
      redcapIds.filter((r) => redcapParticipantIds.includes(r.pid))
    ),
    insertWithdrawn(
      db,
      withdrawn.map((w) => {
        const pid = redcapIds.find(
          (r) =>
            r.redcapProjectYear === w.redcapProjectYear &&
            r.redcapRecordId === w.redcapRecordId
        )?.pid
        if (!pid) {
          throw Error(
            `PID not found for withdrawn record ${w.redcapRecordId}
            in year ${w.redcapProjectYear}`
          )
        }
        return {
          date: w.date,
          pid,
        }
      })
    ),
  ])
  await db.any('UPDATE "LastRedcapSync" SET "participant" = $1', [new Date()])
}

export async function getLastParticipantUpdate(db: DB): Promise<Date | null> {
  return await db.one(
    'SELECT "participant" FROM "LastRedcapSync";',
    [],
    (v) => v.participant
  )
}

// Redcap ids =================================================================

async function insertRedcapIds(db: DB, ids: RedcapId[]): Promise<void> {
  await db.any(
    pgpInit.helpers.insert(
      ids,
      ["redcapRecordId", "redcapProjectYear", "pid"],
      "RedcapId"
    )
  )
}

// Withdrawn =================================================================

async function insertWithdrawn(db: DB, w: Withdrawn[]): Promise<void> {
  await db.any(pgpInit.helpers.insert(w, ["pid", "date"], "Withdrawn"))
}

// Vaccination history ========================================================

export async function getVaccination(db: DB): Promise<Vaccination[]> {
  return await db.any('SELECT * FROM "Vaccination"')
}
