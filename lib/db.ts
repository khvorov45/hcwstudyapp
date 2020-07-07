import { Pool, PoolConfig } from 'pg'
import pgp from 'pg-promise'
import bcrypt from 'bcrypt'
import { newconfig } from './config'
import {
  exportParticipants, exportUsers, exportVaccinationHistory,
  exportSchedule, exportWeeklySurveys
} from './redcap'

interface MyPostgresConfig extends PoolConfig {
  users?: {email: string, accessGroup: string}[]
  accessGroups?: string[]
}

interface User {
  email: string,
  accessGroup: string,
  tokenhash: string,
}

export class Postgres {
  pool: Pool
  users: {email: string, accessGroup: string}[]
  accessGroups: {name: string}[]
  backup: any

  constructor (con?: MyPostgresConfig) {
    this.backup = {}
    const thisConfig = con || newconfig.db.postgres
    this.pool = new Pool(thisConfig)
    const users = con ? con.users || newconfig.db.users : newconfig.db.users
    this.users = users.map(u => {
      u.email = u.email.toLowerCase()
      u.accessGroup = u.accessGroup.toLowerCase()
      return u
    })
    const accessGroups = con ? con.accessGroups || newconfig.db.accessGroups
      : newconfig.db.accessGroups
    this.accessGroups = accessGroups.map(
      ag => { return { name: ag.toLowerCase() } }
    )
  }

  async end (): Promise<void> {
    return await this.pool.end()
  }

  async getColumn<T> (sql: string, values?: Array<any>): Promise<T[]> {
    const query = {
      text: sql,
      values: values,
      rowMode: 'array'
    }
    const queryResult = await this.pool.query(query)
    return queryResult.rows.flat()
  }

  async getValue<T> (sql: string, values?: Array<any>): Promise<T> {
    const col = await this.getColumn<T>(sql, values)
    return col[0] || null
  }

  async getRows<T> (sql: string, values?: Array<any>): Promise<T[]> {
    const queryResult = await this.pool.query(sql, values)
    return queryResult.rows
  }

  async getRow<T> (sql: string, values?: Array<any>): Promise<T> {
    const rows = await this.getRows<T>(sql, values)
    return rows[0]
  }

  async execute<T> (sql: string, values?: T[]): Promise<void> {
    await this.pool.query(sql, values)
  }

  async isEmpty (): Promise<boolean> {
    const tables = await this.getColumn<string>(
      'SELECT tablename FROM pg_catalog.pg_tables ' +
      'WHERE schemaname != \'pg_catalog\'' +
      'AND schemaname != \'information_schema\';'
    )
    return tables.length === 0
  }

  async update (hard: boolean): Promise<void> {
    hard ? await this.reset() : await this.wipe()
    await this.fill()
  }

  async reset (): Promise<void> {
    this.backup = {}
    await this.removeTables()
    await this.addTables()
  }

  async removeTables (): Promise<void> {
    await this.execute(`
      DROP TABLE IF EXISTS "Meta";
      DROP TABLE IF EXISTS "User";
    `)
    await this.removeAllParticipantTables()
    await this.execute('DROP TABLE IF EXISTS "AccessGroup"')
  }

  async addTables (): Promise<void> {
    await this.execute(`
      CREATE TABLE "Meta" (
        "key" TEXT NOT NULL PRIMARY KEY UNIQUE,
        "value" TEXT
      );
      CREATE TABLE "AccessGroup" ("name" TEXT NOT NULL PRIMARY KEY UNIQUE);
      CREATE TABLE "User" (
          "email" TEXT NOT NULL PRIMARY KEY UNIQUE,
          "accessGroup" TEXT NOT NULL,
          "tokenhash" TEXT,
          FOREIGN KEY ("accessGroup") REFERENCES "AccessGroup" ("name")
          ON UPDATE CASCADE ON DELETE CASCADE
      );
    `)
    await this.createAllParticipantTables()
  }

  async wipe (): Promise<void> {
    this.backup.user = await this.getRows(
      'SELECT "email", "accessGroup", "tokenhash" FROM "User" ' +
      'WHERE tokenhash IS NOT NULL'
    )
    await this.execute('DELETE FROM "Meta";')
    await this.wipeAllParticipant()
    await this.execute(`
      DELETE FROM "User";
      DELETE FROM "AccessGroup";
    `)
  }

  async fill (): Promise<void> {
    await this.fillAccessGroup()
    await this.fillUser()
    await this.fillAllParticipant()
    await this.execute(
      `INSERT INTO "Meta" ("key", "value")
      VALUES ('lastFill', '${new Date().toString()}');`
    )
  }

  async fillAccessGroup (): Promise<void> {
    await this.execute(pgp().helpers.insert(
      this.accessGroups, ['name'], 'AccessGroup'
    ))
  }

  async getLastFill (): Promise<Date> {
    const dateString = await this.getValue<string>(
      'SELECT "value" FROM "Meta" WHERE key = \'lastFill\''
    )
    return new Date(dateString)
  }

  // All participant-related tables interactions ------------------------------

  async resetAllParticipantTables (): Promise<void> {
    await this.removeAllParticipantTables()
    await this.createAllParticipantTables()
    await this.fillAllParticipant()
  }

  async removeAllParticipantTables (): Promise<void> {
    await this.removeVachisTable()
    await this.removeSchedule()
    await this.removeWeeklySurvey()
    await this.removeParticipantTable()
  }

  async createAllParticipantTables (): Promise<void> {
    await this.createParticipantTable()
    await this.createVachisTable()
    await this.createSchedule()
    await this.createWeeklySurvey()
  }

  async wipeAllParticipant (): Promise<void> {
    await this.execute(`
      DELETE FROM "Participant";
      DELETE FROM "VaccinationHistory";
      DELETE FROM "Schedule";
      DELETE FROM "WeeklySurvey";
    `)
  }

  async fillAllParticipant (): Promise<void> {
    await this.fillParticipant()
    await this.fillVachis()
    await this.fillSchedule()
    await this.fillWeeklySurvey()
  }

  async getParticipants (
    accessGroup: string, prequery?: string
  ): Promise<any[]> {
    let query = prequery || 'SELECT * FROM "Participant"'
    let params = []
    if (!['unrestricted', 'admin'].includes(accessGroup)) {
      query += ' WHERE "accessGroup" = $1'
      params = [accessGroup.toLowerCase()]
    }
    query += ';'
    return await this.getRows<any>(query, params)
  }

  async getParticipantsContact (accessGroup: string): Promise<any[]> {
    const query =
    `SELECT "redcapRecordId", "pid", "email", "mobile",
    "accessGroup", "site" FROM "Participant"`
    return await this.getParticipants(accessGroup, query)
  }

  async getParticipantsBaseline (accessGroup: string): Promise<any[]> {
    const query =
`SELECT "pid", "gender", "dob",
    ROUND((
      EXTRACT(EPOCH FROM AGE("dob")) /
      EXTRACT(EPOCH FROM INTERVAL '1 year')
    )::numeric, 1)::double precision as age,
    "numSeasVac",
    "dateScreening",
    "email", "mobile", "Participant"."redcapRecordId",
    "accessGroup", "site"
FROM "Participant" INNER JOIN
      (SELECT "redcapRecordId", SUM("status"::int)::int as "numSeasVac"
      FROM "VaccinationHistory"
      GROUP BY "redcapRecordId") AS "Vachissum"
      ON "Vachissum"."redcapRecordId" = "Participant"."redcapRecordId"`
    return await this.getParticipants(accessGroup, query)
  }

  async getParticipantsSchedule (
    accessGroup: string, wide: boolean
  ): Promise<any[]> {
    const query =
`SELECT "pid",
    "Schedule"."day", "Schedule"."date",
    "email", "mobile", "Participant"."redcapRecordId",
    "accessGroup", "site"
FROM "Participant" INNER JOIN
      (SELECT "redcapRecordId", "day", "date"
      FROM "Schedule") AS "Schedule"
      ON "Schedule"."redcapRecordId" = "Participant"."redcapRecordId"
      ${wide ? 'ORDER BY "redcapRecordId"' : ''}`
    const res = await this.getParticipants(accessGroup, query)
    if (!wide) return res
    const resWide = []
    function createEntry (row) {
      return {
        pid: row.pid,
        day0: null,
        day7: null,
        day14: null,
        day280: null,
        email: row.email,
        mobile: row.mobile,
        redcapRecordId: row.redcapRecordId,
        accessGroup: row.accessGroup,
        site: row.site
      }
    }
    let curEntry = createEntry(res[0])
    res.map(row => {
      if (curEntry.redcapRecordId !== row.redcapRecordId) {
        resWide.push(curEntry)
        curEntry = createEntry(row)
      }
      curEntry['day' + row.day] = row.date
    })
    return resWide
  }

  async getParticipantsWeeklySurveys (accessGroup: string): Promise<any[]> {
    const query =
`SELECT "Participant"."pid",
    "index",
    "date",
    "ari", "Participant"."mobile", "Participant"."redcapRecordId",
    "Participant"."accessGroup", "Participant"."site"
FROM "WeeklySurvey" INNER JOIN "Participant"
      ON "WeeklySurvey"."redcapRecordId" = "Participant"."redcapRecordId"`
    return await this.getParticipants(accessGroup, query)
  }

  // Participant table interactions -------------------------------------------

  async createParticipantTable (): Promise<void> {
    await this.execute(`
      CREATE TABLE "Participant" (
          "redcapRecordId" TEXT NOT NULL PRIMARY KEY UNIQUE,
          "pid" TEXT NOT NULL UNIQUE,
          "accessGroup" TEXT NOT NULL,
          "site" TEXT NOT NULL,
          "dateScreening" TIMESTAMPTZ,
          "email" TEXT,
          "mobile" TEXT,
          "dob" TIMESTAMPTZ,
          "gender" TEXT,
          FOREIGN KEY ("accessGroup") REFERENCES "AccessGroup" ("name")
          ON UPDATE CASCADE ON DELETE CASCADE
      );
    `)
  }

  async removeParticipantTable (): Promise<void> {
    await this.execute('DROP TABLE IF EXISTS "Participant"')
  }

  async fillParticipant (): Promise<void> {
    const participants = await exportParticipants()
    await this.execute(pgp().helpers.insert(
      participants,
      [
        'redcapRecordId', 'pid', 'accessGroup', 'site', 'dob', 'dateScreening',
        'mobile', 'email', 'gender'
      ],
      'Participant'
    ))
  }

  // Vaccination history table interactions -----------------------------------

  async createVachisTable (): Promise<void> {
    await this.execute(`
      CREATE TABLE "VaccinationHistory" (
          "redcapRecordId" TEXT NOT NULL,
          "year" INTEGER NOT NULL,
          "status" BOOLEAN,
          PRIMARY KEY ("redcapRecordId", "year"),
          FOREIGN KEY ("redcapRecordId")
          REFERENCES "Participant" ("redcapRecordId")
          ON UPDATE CASCADE ON DELETE CASCADE
      );
    `)
  }

  async removeVachisTable (): Promise<void> {
    await this.execute('DROP TABLE IF EXISTS "VaccinationHistory"')
  }

  async fillVachis (): Promise<void> {
    const vachis = await exportVaccinationHistory()
    await this.execute(pgp().helpers.insert(
      vachis,
      ['redcapRecordId', 'year', 'status'],
      'VaccinationHistory'
    ))
  }

  async getVachis (accessGroup: string): Promise<any[]> {
    let query = 'SELECT * FROM "VaccinationHistory"'
    let params = []
    if (!['unrestricted', 'admin'].includes(accessGroup)) {
      query += ' WHERE "redcapRecordId IN ' +
        '(SELECT redcapRecordId FROM Participant WHERE "accessGroup" = $1)'
      params = [accessGroup.toLowerCase()]
    }
    query += ';'
    return await this.getRows<any>(query, params)
  }

  // Schedule history table interactions --------------------------------------

  async createSchedule () {
    await this.execute(`
      CREATE TABLE "Schedule" (
          "redcapRecordId" TEXT NOT NULL,
          "day" INTEGER NOT NULL,
          "date" TIMESTAMPTZ,
          PRIMARY KEY ("redcapRecordId", "day"),
          FOREIGN KEY ("redcapRecordId")
          REFERENCES "Participant" ("redcapRecordId")
          ON UPDATE CASCADE ON DELETE CASCADE
      );
    `)
  }

  async removeSchedule () {
    await this.execute('DROP TABLE IF EXISTS "Schedule"')
  }

  async fillSchedule () {
    const schedule = await exportSchedule()
    await this.execute(pgp().helpers.insert(
      schedule,
      ['redcapRecordId', 'day', 'date'],
      'Schedule'
    ))
  }

  // Weekly survey table interactions -----------------------------------------

  async createWeeklySurvey () {
    await this.execute(`
      CREATE TABLE "WeeklySurvey" (
          "redcapRecordId" TEXT NOT NULL,
          "index" INTEGER NOT NULL,
          "date" TIMESTAMPTZ,
          "ari" BOOLEAN NOT NULL,
          PRIMARY KEY ("redcapRecordId", "index"),
          FOREIGN KEY ("redcapRecordId")
          REFERENCES "Participant" ("redcapRecordId")
          ON UPDATE CASCADE ON DELETE CASCADE
      );
    `)
  }

  async removeWeeklySurvey () {
    await this.execute('DROP TABLE IF EXISTS "WeeklySurvey"')
  }

  async fillWeeklySurvey () {
    const surveys = await exportWeeklySurveys()
    await this.execute(pgp().helpers.insert(
      surveys,
      ['redcapRecordId', 'index', 'date', 'ari'],
      'WeeklySurvey'
    ))
  }

  // User table interactions --------------------------------------------------

  async fillUser (): Promise<void> {
    const redcapUsers = await exportUsers()
    const backupUsers = this.backup.user
    const configUserEmails = this.users.map(usr => usr.email)
    let allUsers = redcapUsers
      .filter(usr => !configUserEmails.includes(usr.email))
      .concat(this.users)
      .map(usr => { usr.tokenhash = null; return usr })
    if (backupUsers) {
      const backupUserEmails = backupUsers.map(usr => usr.email)
      allUsers = allUsers
        .filter(usr => !backupUserEmails.includes(usr.email))
        .concat(backupUsers)
    }
    await this.execute(pgp().helpers.insert(
      allUsers, ['email', 'accessGroup', 'tokenhash'], 'User')
    )
  }

  async getUser (email: string): Promise<User> {
    return await this.getRow<User>(
      'SELECT "email", "accessGroup", "tokenhash" ' +
      'FROM "User" WHERE "email" = $1',
      [email.toLowerCase()]
    )
  }

  async userExists (email: string): Promise<boolean> {
    const user = await this.getRow(
      'SELECT "email" FROM "User" WHERE "email" = $1',
      [email.toLowerCase()]
    )
    return !!user
  }

  async authoriseUser (email: string, token: string): Promise<boolean> {
    if (!email || !token) return null
    const tokenhash = await this.getUserTokenHash(email)
    if (!tokenhash) return false
    return await bcrypt.compare(token, tokenhash)
  }

  async storeUserToken (email: string, token: string): Promise<void> {
    await this.execute(
      'UPDATE "User" SET "tokenhash" = $1 WHERE "email" = $2',
      [await bcrypt.hash(token, 10), email.toLowerCase()]
    )
  }

  async getUserTokenHash (email: string): Promise<string> {
    return await this.getValue(
      'SELECT "tokenhash" FROM "User" WHERE "email" = $1',
      [email.toLowerCase()]
    )
  }

  async getUserAccessGroup (email: string): Promise<string> {
    if (!email) return null
    return await this.getValue(
      'SELECT "accessGroup" FROM "User" WHERE "email" = $1',
      [email.toLowerCase()]
    )
  }
}

export default new Postgres()
