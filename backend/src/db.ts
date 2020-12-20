import pgp from "pg-promise"
import pg from "pg-promise/typescript/pg-subset"
import {
  AccessGroup,
  AccessGroupV,
  GenderV,
  isSite,
  Participant,
  RedcapId,
  Schedule,
  SiteV,
  User,
  Vaccination,
  WeeklySurvey,
  Withdrawn,
} from "./data"
import { hash } from "./auth"
import {
  exportUsers,
  RedcapConfig,
  exportParticipants,
  exportRedcapIds,
  exportWithdrawn,
  exportVaccination,
  exportSchedule,
  exportWeeklySurvey,
} from "./redcap"

const pgpInit = pgp()

export type DB = pgp.IDatabase<{}, pg.IClient>

type EmailToken = { email: string; token: string }

export async function create({
  dbConnectionString,
  clean,
  firstAdminEmail,
  firstAdminToken,
  tokenDaysToLive,
}: {
  dbConnectionString: string
  clean: boolean
  firstAdminEmail: string
  firstAdminToken: string
  tokenDaysToLive: number
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
    await init(db, firstAdmin, tokenDaysToLive)
  } else if (await isEmpty(db)) {
    console.log("database empty, initializing")
    await init(db, firstAdmin, tokenDaysToLive)
  }
  return db
}

function addDays(date: Date, days: number): Date {
  date.setDate(date.getDate() + days)
  return date
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

async function init(
  db: DB,
  firstAdmin: EmailToken,
  tokenDaysToLive: number
): Promise<void> {
  await db.any(new pgp.QueryFile("../sql/init.sql"), {
    accessGroupValues: Object.keys(AccessGroupV.keys),
    genders: Object.keys(GenderV.keys),
    firstAdminEmail: firstAdmin.email,
    firstAdminTokenHash: hash(firstAdmin.token),
    firstAdminTokenExpires: addDays(new Date(), tokenDaysToLive),
    sites: Object.keys(SiteV.keys),
  })
}

async function resetSchema(db: DB): Promise<void> {
  await db.any('DROP SCHEMA "public" CASCADE;')
  await db.any('CREATE SCHEMA "public";')
}

/** Get site subset for tables with PID as FK */
async function getTableSubset(
  db: DB,
  a: AccessGroup,
  t: "Vaccination" | "RedcapId" | "Withdrawn" | "Schedule" | "WeeklySurvey"
) {
  return isSite(a)
    ? await db.any(
        `SELECT * FROM "${t}" WHERE "pid" IN
        (SELECT "pid" FROM "Participant" WHERE "site" = $1)`,
        [a]
      )
    : await db.any(`SELECT * FROM "${t}"`)
}

// Users ======================================================================

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
  return await db.one(
    `SELECT * FROM "User" WHERE "email" =
    (SELECT "email" FROM "Token" WHERE "hash" = $1)`,
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
    getUsers(db),
  ])
  const dbNonAdminUsers = dbUsers.filter((u) => u.accessGroup !== "admin")
  const dbNonAdminEmails = dbNonAdminUsers.map((u) => u.email)
  if (dbNonAdminEmails.length > 0) {
    await deleteUsers(db, dbNonAdminEmails)
  }
  await insertUsers(db, redcapUsers)
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

// Particpants ================================================================

export async function getParticipantsSubset(
  db: DB,
  a: AccessGroup
): Promise<Participant[]> {
  return isSite(a)
    ? await db.any('SELECT * FROM "Participant" WHERE "site" = $1', [a])
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
  pid: string,
  a: AccessGroup
): Promise<void> {
  let p: Participant
  try {
    p = await db.one('SELECT * FROM "Participant" WHERE "pid" = $1', [pid])
  } catch (e) {
    if (e.message === "No data returned from the query.") {
      throw Error("NOT FOUND: no such pid")
    }
    throw Error(e.message)
  }
  if (isSite(a) && p.site !== a) {
    throw Error("UNAUTHORIZED: invalid participant site")
  }
  await db.any('DELETE FROM "Participant" WHERE "pid"=$1', [pid])
}

export async function syncRedcapParticipants(
  db: DB,
  redcapConfig: RedcapConfig
) {
  // Wait for this to succeed before doing anyting else
  const [
    redcapParticipants,
    redcapIds,
    withdrawn,
    vac,
    schedule,
    weeklySurvey,
  ] = await Promise.all([
    exportParticipants(redcapConfig),
    exportRedcapIds(redcapConfig),
    exportWithdrawn(redcapConfig),
    exportVaccination(redcapConfig),
    exportSchedule(redcapConfig),
    exportWeeklySurvey(redcapConfig),
  ])
  const redcapParticipantIds = redcapParticipants.map((r) => r.pid)

  await db.any('DELETE FROM "Participant"')
  await insertParticipants(db, redcapParticipants, "admin")

  function isInParticipant<T extends { pid: string }>(r: T) {
    return redcapParticipantIds.includes(r.pid)
  }

  function findPid<
    T extends { redcapRecordId: string; redcapProjectYear: number }
  >(r: T) {
    const pid = redcapIds.find(
      (id) =>
        id.redcapProjectYear === r.redcapProjectYear &&
        id.redcapRecordId === r.redcapRecordId
    )?.pid
    if (!pid) {
      throw Error(
        `PID not found for record ${r.redcapRecordId}
        in year ${r.redcapProjectYear}`
      )
    }
    return {
      pid,
      ...r,
    }
  }

  await Promise.all([
    insertRedcapIds(db, redcapIds.filter(isInParticipant)),
    insertWithdrawn(db, withdrawn.map(findPid).filter(isInParticipant)),
    insertVaccination(db, vac.filter(isInParticipant)),
    insertSchedule(db, schedule.filter(isInParticipant)),
    insertWeeklySurvey(db, weeklySurvey.map(findPid).filter(isInParticipant)),
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

export async function getRedcapIdSubset(
  db: DB,
  a: AccessGroup
): Promise<RedcapId[]> {
  return await getTableSubset(db, a, "RedcapId")
}

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

export async function getWithdrawnSubset(
  db: DB,
  a: AccessGroup
): Promise<RedcapId[]> {
  return await getTableSubset(db, a, "Withdrawn")
}

async function insertWithdrawn(db: DB, w: Withdrawn[]): Promise<void> {
  await db.any(pgpInit.helpers.insert(w, ["pid", "date"], "Withdrawn"))
}

// Vaccination history ========================================================

export async function getVaccinationSubset(
  db: DB,
  a: AccessGroup
): Promise<Vaccination[]> {
  return await getTableSubset(db, a, "Vaccination")
}

async function insertVaccination(db: DB, v: Vaccination[]): Promise<void> {
  await db.any(
    pgpInit.helpers.insert(v, ["pid", "year", "status"], "Vaccination")
  )
}

// Schedule ===================================================================

export async function getScheduleSubset(
  db: DB,
  a: AccessGroup
): Promise<Schedule[]> {
  return await getTableSubset(db, a, "Schedule")
}

async function insertSchedule(db: DB, v: Schedule[]): Promise<void> {
  await db.any(
    pgpInit.helpers.insert(
      v,
      ["pid", "day", "redcapProjectYear", "date"],
      "Schedule"
    )
  )
}

// Weekly survey ==============================================================

export async function getWeeklySurveySubset(
  db: DB,
  a: AccessGroup
): Promise<Schedule[]> {
  return await getTableSubset(db, a, "WeeklySurvey")
}

async function insertWeeklySurvey(db: DB, s: WeeklySurvey[]): Promise<void> {
  await db.any(
    pgpInit.helpers.insert(
      s,
      ["pid", "index", "date", "redcapProjectYear", "ari", "swabCollection"],
      "WeeklySurvey"
    )
  )
}
