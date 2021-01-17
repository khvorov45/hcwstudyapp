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
  Serology,
  SerologyV,
  SiteV,
  Token,
  TokenType,
  User,
  Vaccination,
  Virus,
  VirusV,
  WeeklySurvey,
  Withdrawn,
} from "./data"
import { generateToken, hash } from "./auth"
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
import { addDays } from "./util"

const pgpInit = pgp()

export type DB = pgp.IDatabase<{}, pg.IClient>

type EmailToken = { email: string; token: string }

export function create({
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
}): () => Promise<DB> {
  console.log(`connecting to ${dbConnectionString}`)
  const db = pgpInit(dbConnectionString)
  const firstAdmin: EmailToken = {
    email: firstAdminEmail,
    token: firstAdminToken,
  }
  let firstConnection = true
  async function connect() {
    try {
      await db.connect()
      console.log(`connected successfully to ${dbConnectionString}`)
    } catch (e) {
      throw Error(`could not connect to ${dbConnectionString}: ${e.message}`)
    }
    if (!firstConnection) {
      return db
    }
    if (clean) {
      console.log("cleaning db")
      await resetSchema(db)
      await init(db, firstAdmin, tokenDaysToLive)
    } else if (await isEmpty(db)) {
      console.log("database empty, initializing")
      await init(db, firstAdmin, tokenDaysToLive)
    }
    firstConnection = false
    return db
  }
  return connect
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

export async function reset(
  db: DB,
  redcapConfig: RedcapConfig,
  {
    restoreTokens,
    firstAdmin,
    tokenDaysToLive,
  }: { restoreTokens: boolean; firstAdmin: EmailToken; tokenDaysToLive: number }
) {
  const tokens = restoreTokens ? await getTokens(db) : []
  await resetSchema(db)
  await init(db, firstAdmin, tokenDaysToLive)
  if (restoreTokens) {
    await db.any('DELETE FROM "Token"')
    await syncRedcapUsers(db, redcapConfig)
    const users = await getUsers(db)
    const emails = users.map((u) => u.email)
    await insertIntoTable(
      db,
      tokens.filter((tok) => emails.includes(tok.user)),
      "Token"
    )
  }
}

/** Get site subset for tables with PID as FK */
async function getTableSubset(
  db: DB,
  a: AccessGroup,
  t:
    | "Vaccination"
    | "RedcapId"
    | "Withdrawn"
    | "Schedule"
    | "WeeklySurvey"
    | "Serology"
) {
  return isSite(a)
    ? await db.any(
        `SELECT * FROM "${t}" WHERE "pid" IN
        (SELECT "pid" FROM "Participant" WHERE "site" = $1)`,
        [a]
      )
    : await db.any(`SELECT * FROM "${t}"`)
}

async function insertIntoTable<T>(
  db: DB,
  e: T[],
  t:
    | "User"
    | "Token"
    | "Vaccination"
    | "RedcapId"
    | "Withdrawn"
    | "Schedule"
    | "WeeklySurvey"
    | "Participant"
    | "Virus"
    | "Serology"
) {
  if (e.length === 0) {
    return
  }
  const cols: Record<typeof t, string[]> = {
    User: ["email", "accessGroup"],
    Token: ["user", "hash", "type", "expires"],
    Vaccination: ["pid", "year", "status"],
    RedcapId: ["pid", "redcapRecordId", "redcapProjectYear"],
    Withdrawn: ["pid", "date"],
    Schedule: ["pid", "day", "redcapProjectYear", "date"],
    WeeklySurvey: [
      "pid",
      "index",
      "redcapProjectYear",
      "date",
      "ari",
      "swabCollection",
    ],
    Participant: [
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
    Virus: Object.keys(VirusV.props),
    Serology: Object.keys(SerologyV.props),
  }
  await db.any(pgpInit.helpers.insert(e, cols[t], t))
}

// Users ======================================================================

export async function getUsers(db: DB): Promise<User[]> {
  return await db.any('SELECT * FROM "User"')
}

export async function getUserByEmail(db: DB, email: string): Promise<User> {
  return await db.one('SELECT * FROM "User" WHERE "email"=$1', [email])
}

export async function getUserByToken(db: DB, token: string): Promise<User> {
  return await db.one(
    `SELECT * FROM "User" WHERE "email" =
    (SELECT "user" FROM "Token"
    WHERE "hash" = $1 AND ("expires" > now() OR "type" = 'api'))`,
    [hash(token)]
  )
}

export async function insertUsers(db: DB, us: User[]): Promise<void> {
  await insertIntoTable(db, us, "User")
}

export async function deleteUser(db: DB, email: string): Promise<void> {
  await db.any('DELETE FROM "User" WHERE email=$1', [email])
}

export async function deleteUsers(db: DB, emails: string[]): Promise<void> {
  await db.any('DELETE FROM "User" WHERE email IN ($1:csv)', [emails])
}

export async function updateUser(db: DB, u: User): Promise<void> {
  const res = await db.result(
    pgpInit.helpers.update(u, ["accessGroup"], "User") + " WHERE email = $1",
    [u.email]
  )
  if (res.rowCount === 0) {
    throw Error("no such user email: " + u.email)
  }
}

/** Will not touch the admins, drop everyone else and replace with redcap users
 */
export async function syncRedcapUsers(
  db: DB,
  redcapConfig: RedcapConfig
): Promise<void> {
  const [redcapUsers, dbUsers, tokens] = await Promise.all([
    exportUsers(redcapConfig),
    getUsers(db),
    getTokens(db),
  ])
  const dbNonAdminEmails = dbUsers
    .filter((u) => u.accessGroup !== "admin")
    .map((u) => u.email)
  if (dbNonAdminEmails.length > 0) {
    await deleteUsers(db, dbNonAdminEmails)
  }
  await insertUsers(db, redcapUsers)
  // Restore tokens
  const redcapEmails = redcapUsers.map((r) => r.email)
  const dbAdminEmails = dbUsers
    .filter((u) => u.accessGroup === "admin")
    .map((u) => u.email)
  await insertIntoTable(
    db,
    tokens.filter(
      (t) => !dbAdminEmails.includes(t.user) && redcapEmails.includes(t.user)
    ),
    "Token"
  )
  await db.any('UPDATE "LastRedcapSync" SET "user" = $1', [new Date()])
}

export async function getLastUserUpdate(db: DB): Promise<Date | null> {
  return await db.one('SELECT "user" FROM "LastRedcapSync";', [], (v) => v.user)
}

// Tokens =====================================================================

async function getTokens(
  db: DB
): Promise<{ user: string; hash: string; expires: Date; type: TokenType }[]> {
  return await db.any('SELECT * FROM "Token"')
}

export async function insertTokens(db: DB, tokens: Token[]) {
  const tokensHashed = tokens.map((t) => ({
    user: t.user,
    hash: hash(t.token),
    type: t.type,
    expires: t.expires,
  }))
  await insertIntoTable(db, tokensHashed, "Token")
}

export async function deleteToken(db: DB, token: string) {
  await db.any('DELETE FROM "Token" WHERE "hash" = $1', [hash(token)])
}

/**Will only update a valid token */
export async function refreshSessionToken(
  db: DB,
  oldToken: string,
  tokenDayesToLive: number
): Promise<string> {
  const newToken = generateToken()
  const res = await db.result(
    `UPDATE "Token" SET "hash"=$(newHash), "expires"=$(newExpiration)
    WHERE hash = $(oldHash) AND "expires" > now() AND "type" = 'session'`,
    {
      newHash: hash(newToken),
      oldHash: hash(oldToken),
      newExpiration: addDays(new Date(), tokenDayesToLive),
    }
  )
  if (res.rowCount === 0) {
    throw Error("UNAUTHORIZED: valid token to be refreshed not found")
  }
  return newToken
}

export async function deleteUserTokens(db: DB, token: string): Promise<void> {
  const res = await db.result(
    `DELETE FROM "Token"
    WHERE "user" = (SELECT "user" FROM "Token" WHERE "hash" = $1)
    AND "type" = 'session'`,
    [hash(token)]
  )
  if (res.rowCount === 0) {
    throw Error("UNAUTHORIZED: no such token")
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
  await insertIntoTable(db, ps, "Participant")
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
  await insertIntoTable(db, ids, "RedcapId")
}

// Withdrawn =================================================================

export async function getWithdrawnSubset(
  db: DB,
  a: AccessGroup
): Promise<RedcapId[]> {
  return await getTableSubset(db, a, "Withdrawn")
}

async function insertWithdrawn(db: DB, w: Withdrawn[]): Promise<void> {
  await insertIntoTable(db, w, "Withdrawn")
}

// Vaccination history ========================================================

export async function getVaccinationSubset(
  db: DB,
  a: AccessGroup
): Promise<Vaccination[]> {
  return await getTableSubset(db, a, "Vaccination")
}

async function insertVaccination(db: DB, v: Vaccination[]): Promise<void> {
  await insertIntoTable(db, v, "Vaccination")
}

// Schedule ===================================================================

export async function getScheduleSubset(
  db: DB,
  a: AccessGroup
): Promise<Schedule[]> {
  return await getTableSubset(db, a, "Schedule")
}

async function insertSchedule(db: DB, v: Schedule[]): Promise<void> {
  await insertIntoTable(db, v, "Schedule")
}

// Weekly survey ==============================================================

export async function getWeeklySurveySubset(
  db: DB,
  a: AccessGroup
): Promise<Schedule[]> {
  return await getTableSubset(db, a, "WeeklySurvey")
}

async function insertWeeklySurvey(db: DB, s: WeeklySurvey[]): Promise<void> {
  await insertIntoTable(db, s, "WeeklySurvey")
}

// Viruses ====================================================================

export async function getViruses(db: DB): Promise<Virus[]> {
  return await db.any('SELECT * FROM "Virus"')
}

export async function insertViruses(db: DB, vs: Virus[]): Promise<void> {
  await insertIntoTable(db, vs, "Virus")
}

export async function deleteAllViruses(db: DB): Promise<void> {
  await db.any('DELETE FROM "Virus"')
}

// Serology ===================================================================

export async function getSerologySubset(
  db: DB,
  a: AccessGroup
): Promise<Serology[]> {
  return await getTableSubset(db, a, "Serology")
}

export async function insertSerology(db: DB, ss: Serology[]): Promise<void> {
  await insertIntoTable(db, ss, "Serology")
}

export async function deleteAllSerology(db: DB): Promise<void> {
  await db.any('DELETE FROM "Serology"')
}
