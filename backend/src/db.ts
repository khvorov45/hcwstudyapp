import pgp from "pg-promise"
import pg from "pg-promise/typescript/pg-subset"
import {
  AccessGroup,
  AccessGroupV,
  GenderV,
  isSite,
  OccupationV,
  Participant,
  RedcapId,
  RegistrationOfInterest,
  RegistrationOfInterestV,
  Schedule,
  Serology,
  SerologyV,
  SiteV,
  Token,
  TokenType,
  User,
  UserToInsert,
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
import { retryAsync } from "ts-retry"

const pgpInit = pgp()

const INIT_SQL = new pgp.QueryFile("../sql/init.sql")

export type DB = pgp.IDatabase<{}, pg.IClient>
export type Task = pgp.ITask<{}>

type EmailToken = { email: string; token: string }

export async function create({
  dbConnectionString,
  clean,
  firstAdminEmail,
  firstAdminToken,
  tokenDaysToLive,
  firstConnectionRetryDelayMs,
  firstConnectionRetryMaxAttempts,
}: {
  dbConnectionString: string
  clean: boolean
  firstAdminEmail: string
  firstAdminToken: string
  tokenDaysToLive: number
  firstConnectionRetryDelayMs: number
  firstConnectionRetryMaxAttempts: number
}): Promise<DB> {
  console.log(`db url: ${dbConnectionString}`)
  const db = pgpInit(dbConnectionString)
  const firstAdmin: EmailToken = {
    email: firstAdminEmail,
    token: firstAdminToken,
  }
  const initLoaded = async (t: Task) =>
    await init(t, firstAdmin, tokenDaysToLive)
  async function onFirstConnection() {
    db.tx(async (t) => {
      if (clean) {
        console.log("attempting db clean")
        await resetSchema(t)
        console.log("clean successful")
        await initLoaded(t)
      } else if (await isEmpty(t)) {
        console.log("database empty")
        await initLoaded(t)
      }
    })
  }
  await retryAsync(onFirstConnection, {
    delay: firstConnectionRetryDelayMs,
    maxTry: firstConnectionRetryMaxAttempts,
  })
  return db
}

async function getTableNames(db: Task): Promise<string[]> {
  return await db.map(
    "SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public';",
    [],
    (r) => r.tablename
  )
}

async function isEmpty(db: Task): Promise<boolean> {
  return (await getTableNames(db)).length === 0
}

async function init(
  db: Task,
  firstAdmin: EmailToken,
  tokenDaysToLive: number
): Promise<void> {
  console.log("attempting db initialization")
  await db.any(INIT_SQL, {
    accessGroupValues: Object.keys(AccessGroupV.keys),
    genders: Object.keys(GenderV.keys),
    firstAdminEmail: firstAdmin.email,
    firstAdminTokenHash: hash(firstAdmin.token),
    firstAdminTokenExpires: addDays(new Date(), tokenDaysToLive),
    sites: Object.keys(SiteV.keys),
    occupations: Object.keys(OccupationV.keys),
  })
  console.log("initialization successful")
}

async function resetSchema(db: Task): Promise<void> {
  await db.any('DROP SCHEMA "public" CASCADE;')
  await db.any('CREATE SCHEMA "public";')
}

export async function reset(
  db: Task,
  {
    firstAdmin,
    tokenDaysToLive,
  }: {
    firstAdmin: EmailToken
    tokenDaysToLive: number
  }
) {
  const data = await getAllData(db)

  const [lastParticipantUpdate, lastUserUpdate] = await Promise.all([
    getLastParticipantUpdate(db),
    getLastUserUpdate(db),
  ])

  // The reset
  await resetSchema(db)
  await init(db, firstAdmin, tokenDaysToLive)

  // The restoration
  await db.any('DELETE FROM "User"')
  await Promise.all([
    insertIntoTable(db, data.users, "User"),
    insertIntoTable(db, data.participants, "Participant"),
    insertIntoTable(db, data.viruses, "Virus"),
    insertIntoTable(db, data.roi, "RegistrationOfInterest"),
  ])
  await Promise.all([
    insertIntoTable(db, data.tokens, "Token"),
    insertIntoTable(db, data.redcapIds, "RedcapId"),
    insertIntoTable(db, data.withdrawn, "Withdrawn"),
    insertIntoTable(db, data.vaccinations, "Vaccination"),
    insertIntoTable(db, data.schedules, "Schedule"),
    insertIntoTable(db, data.weeklySurveys, "WeeklySurvey"),
    insertIntoTable(db, data.serology, "Serology"),
  ])
  await Promise.all([
    setLastParticipantUpdate(db, lastParticipantUpdate),
    setLastUserUpdate(db, lastUserUpdate),
  ])
}

async function getAllData(db: Task) {
  const users = getUsers(db)
  const tokens = getTokens(db)
  const participants = getParticipantsSubset(db, "admin")
  const redcapIds = getRedcapIdSubset(db, "admin")
  const withdrawn = getWithdrawnSubset(db, "admin")
  const vaccinations = getVaccinationSubset(db, "admin")
  const schedules = getScheduleSubset(db, "admin")
  const weeklySurveys = getWeeklySurveySubset(db, "admin")
  const viruses = getViruses(db)
  const serology = getSerologySubset(db, "admin")
  const roi = getRegistrationOfInterestSubset(db, "admin")
  return {
    users: await users,
    tokens: await tokens,
    participants: await participants,
    redcapIds: await redcapIds,
    withdrawn: await withdrawn,
    vaccinations: await vaccinations,
    schedules: await schedules,
    weeklySurveys: await weeklySurveys,
    viruses: await viruses,
    serology: await serology,
    roi: await roi,
  }
}

/** Get site subset for tables with PID as FK */
async function getTableSubset(
  db: Task,
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
  db: Task,
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
    | "RegistrationOfInterest"
) {
  if (e.length === 0) {
    return
  }
  const cols: Record<typeof t, string[]> = {
    User: ["email", "accessGroup", "kind", "deidentifiedExport"],
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
      "heightCM",
      "weightKG",
      "occupation",
    ],
    Virus: Object.keys(VirusV.props),
    Serology: Object.keys(SerologyV.props),
    RegistrationOfInterest: Object.keys(RegistrationOfInterestV.props),
  }
  await db.any(pgpInit.helpers.insert(e, cols[t], t))
}

// Users ======================================================================

export async function getUsers(db: Task): Promise<User[]> {
  return await db.any('SELECT * FROM "User"')
}

export async function getUsersManual(db: Task): Promise<User[]> {
  return await db.any(`SELECT * FROM "User" WHERE "kind" = 'manual'`)
}

export async function getUserByEmail(db: Task, email: string): Promise<User> {
  return await db.one('SELECT * FROM "User" WHERE "email"=$1', [
    email.toLowerCase(),
  ])
}

export async function getUserByToken(db: Task, token: string): Promise<User> {
  return await db.one(
    `SELECT * FROM "User" WHERE "email" =
    (SELECT "user" FROM "Token"
    WHERE "hash" = $1 AND ("expires" > now() OR "type" = 'api'))`,
    [hash(token)]
  )
}

export async function insertUsers(db: Task, us: User[]): Promise<void> {
  await insertIntoTable(
    db,
    us.map((u) => ({ ...u, email: u.email.toLowerCase() })),
    "User"
  )
}

export async function deleteUser(db: Task, email: string): Promise<void> {
  await db.any('DELETE FROM "User" WHERE email=$1', [email.toLowerCase()])
}

export async function deleteUsers(db: Task, emails: string[]): Promise<void> {
  await db.any('DELETE FROM "User" WHERE email IN ($1:csv)', [
    emails.map((e) => e.toLowerCase()),
  ])
}

export async function updateUser(db: Task, u: UserToInsert): Promise<void> {
  const res = await db.result(
    pgpInit.helpers.update(u, ["accessGroup", "deidentifiedExport"], "User") +
      " WHERE email = $1",
    [u.email.toLowerCase()]
  )
  if (res.rowCount === 0) {
    throw Error("no such user email: " + u.email)
  }
}

/** Will not touch the manually created users,
 * drop everyone else and replace with redcap users
 */
export async function syncRedcapUsers(
  db: Task,
  redcapConfig: RedcapConfig
): Promise<void> {
  const [redcapUsers, dbUsers, tokens] = await Promise.all([
    exportUsers(redcapConfig),
    getUsers(db),
    getTokens(db),
  ])
  const dbRedcapEmails = dbUsers
    .filter((u) => u.kind === "redcap")
    .map((u) => u.email)
  const dbManualEmails = dbUsers
    .filter((u) => u.kind === "manual")
    .map((u) => u.email)
  if (dbRedcapEmails.length > 0) {
    await deleteUsers(db, dbRedcapEmails)
  }

  const redcapUsersToInsert = redcapUsers.filter(
    (u) => !dbManualEmails.includes(u.email)
  )
  await insertUsers(db, redcapUsersToInsert)

  // Restore tokens
  const insertedEmails = redcapUsersToInsert.map((r) => r.email)
  await insertIntoTable(
    db,
    tokens.filter((t) => insertedEmails.includes(t.user)),
    "Token"
  )

  await db.any('UPDATE "LastRedcapSync" SET "user" = $1', [new Date()])
}

export async function getLastUserUpdate(db: Task): Promise<Date | null> {
  return await db.one('SELECT "user" FROM "LastRedcapSync";', [], (v) => v.user)
}

export async function setLastUserUpdate(
  db: Task,
  d: Date | null
): Promise<void> {
  await db.any('UPDATE "LastRedcapSync" SET "user" = $1', [d])
}

// Tokens =====================================================================

async function getTokens(
  db: Task
): Promise<{ user: string; hash: string; expires: Date; type: TokenType }[]> {
  return await db.any('SELECT * FROM "Token"')
}

export async function insertTokens(db: Task, tokens: Token[]) {
  const tokensHashed = tokens.map((t) => ({
    user: t.user.toLowerCase(),
    hash: hash(t.token),
    type: t.type,
    expires: t.expires,
  }))
  try {
    await insertIntoTable(db, tokensHashed, "Token")
  } catch (e) {
    if (e.message.includes("violates foreign key constraint")) {
      throw Error("CONFLICT: no such email(s)")
    } else {
      throw e
    }
  }
}

export async function deleteToken(db: Task, token: string) {
  await db.any('DELETE FROM "Token" WHERE "hash" = $1', [hash(token)])
}

/**Will only update a valid token */
export async function refreshSessionToken(
  db: Task,
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

export async function deleteUserTokens(db: Task, token: string): Promise<void> {
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
  db: Task,
  a: AccessGroup
): Promise<Participant[]> {
  return isSite(a)
    ? await db.any('SELECT * FROM "Participant" WHERE "site" = $1', [a])
    : await db.any('SELECT * FROM "Participant"')
}

export async function getParticipantsDeidentifiedSubset(
  db: Task,
  a: AccessGroup
): Promise<Participant[]> {
  const cols = [
    "pid",
    "site",
    "dateScreening",
    "addBleed",
    "dob",
    "gender",
    "baselineQuestComplete",
    "heightCM",
    "weightKG",
    "occupation",
  ]
    .map((x) => `"${x}"`)
    .join(",")
  return isSite(a)
    ? await db.any(`SELECT ${cols} FROM "Participant" WHERE "site" = $1`, [a])
    : await db.any(`SELECT ${cols} FROM "Participant"`)
}

export async function insertParticipants(
  db: Task,
  ps: Participant[],
  a: AccessGroup
): Promise<void> {
  if (isSite(a) && ps.find((p) => p.site !== a)) {
    throw Error("UNAUTHORIZED: participants with invalid site")
  }
  await insertIntoTable(db, ps, "Participant")
}

export async function deleteParticipant(
  db: Task,
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
  db: Task,
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
    serology,
  ] = await Promise.all([
    exportParticipants(redcapConfig),
    exportRedcapIds(redcapConfig),
    exportWithdrawn(redcapConfig),
    exportVaccination(redcapConfig),
    exportSchedule(redcapConfig),
    exportWeeklySurvey(redcapConfig),
    getSerologySubset(db, "admin"),
  ])
  const redcapParticipantIds = redcapParticipants.map((r) => r.pid)

  // This will also wipe all the tables that depend on participant
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
    insertSerology(db, serology.filter(isInParticipant)),
  ])
  await setLastParticipantUpdate(db, new Date())
}

export async function getLastParticipantUpdate(db: Task): Promise<Date | null> {
  return await db.one(
    'SELECT "participant" FROM "LastRedcapSync";',
    [],
    (v) => v.participant
  )
}

async function setLastParticipantUpdate(
  db: Task,
  d: Date | null
): Promise<void> {
  await db.any('UPDATE "LastRedcapSync" SET "participant" = $1', [d])
}

// Redcap ids =================================================================

export async function getRedcapIdSubset(
  db: Task,
  a: AccessGroup
): Promise<RedcapId[]> {
  return await getTableSubset(db, a, "RedcapId")
}

async function insertRedcapIds(db: Task, ids: RedcapId[]): Promise<void> {
  await insertIntoTable(db, ids, "RedcapId")
}

// Withdrawn =================================================================

export async function getWithdrawnSubset(
  db: Task,
  a: AccessGroup
): Promise<RedcapId[]> {
  return await getTableSubset(db, a, "Withdrawn")
}

async function insertWithdrawn(db: Task, w: Withdrawn[]): Promise<void> {
  await insertIntoTable(db, w, "Withdrawn")
}

// Vaccination history ========================================================

export async function getVaccinationSubset(
  db: Task,
  a: AccessGroup
): Promise<Vaccination[]> {
  return await getTableSubset(db, a, "Vaccination")
}

async function insertVaccination(db: Task, v: Vaccination[]): Promise<void> {
  await insertIntoTable(db, v, "Vaccination")
}

// Schedule ===================================================================

export async function getScheduleSubset(
  db: Task,
  a: AccessGroup
): Promise<Schedule[]> {
  return await getTableSubset(db, a, "Schedule")
}

async function insertSchedule(db: Task, v: Schedule[]): Promise<void> {
  await insertIntoTable(db, v, "Schedule")
}

// Weekly survey ==============================================================

export async function getWeeklySurveySubset(
  db: Task,
  a: AccessGroup
): Promise<Schedule[]> {
  return await getTableSubset(db, a, "WeeklySurvey")
}

async function insertWeeklySurvey(db: Task, s: WeeklySurvey[]): Promise<void> {
  await insertIntoTable(db, s, "WeeklySurvey")
}

// Viruses ====================================================================

export async function getViruses(db: Task): Promise<Virus[]> {
  return await db.any('SELECT * FROM "Virus"')
}

export async function insertViruses(db: Task, vs: Virus[]): Promise<void> {
  await insertIntoTable(db, vs, "Virus")
}

export async function deleteAllViruses(db: Task): Promise<void> {
  await db.any('DELETE FROM "Virus"')
}

// Serology ===================================================================

export async function getSerologySubset(
  db: Task,
  a: AccessGroup
): Promise<Serology[]> {
  return await getTableSubset(db, a, "Serology")
}

export async function insertSerology(db: Task, ss: Serology[]): Promise<void> {
  await insertIntoTable(db, ss, "Serology")
}

export async function deleteAllSerology(db: Task): Promise<void> {
  await db.any('DELETE FROM "Serology"')
}

// Registration of interest ===================================================

export async function getRegistrationOfInterestSubset(
  db: Task,
  a: AccessGroup
): Promise<RegistrationOfInterest[]> {
  if (!isSite(a)) {
    return await db.any(`SELECT * FROM "RegistrationOfInterest"`)
  }
  return await db.any(
    `SELECT * FROM "RegistrationOfInterest" WHERE "site" = $1`,
    [a]
  )
}

export async function insertRegistrationOfInterest(
  db: Task,
  ss: RegistrationOfInterest[]
): Promise<void> {
  await insertIntoTable(db, ss, "RegistrationOfInterest")
}
