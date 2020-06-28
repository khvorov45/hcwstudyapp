import { Pool, PoolConfig } from 'pg'
import pgp from 'pg-promise'
import bcrypt from 'bcrypt'
import { newconfig } from './config'
import { exportParticipants, exportUsers } from './redcap'

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
    return col[0]
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
    await this.removeParticipantTable()
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
    await this.createParticipantTable()
  }

  async wipe (): Promise<void> {
    this.backup.user = await this.getRows(
      'SELECT "email", "accessGroup", "tokenhash" FROM "User" ' +
      'WHERE tokenhash IS NOT NULL'
    )
    await this.execute(`
      DELETE FROM "Meta";
      DELETE FROM "Participant";
      DELETE FROM "User";
      DELETE FROM "AccessGroup";
    `)
  }

  async fill (): Promise<void> {
    await this.fillAccessGroup()
    await this.fillUser()
    await this.fillParticipant()
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

  // Participant table interactions -------------------------------------------

  async resetParticipantTable (): Promise<void> {
    await this.removeParticipantTable()
    await this.createParticipantTable()
    await this.fillParticipant()
  }

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
          FOREIGN KEY ("accessGroup") REFERENCES "AccessGroup" ("name")
          ON UPDATE CASCADE ON DELETE CASCADE
      );
    `)
  }

  async removeParticipantTable (): Promise<void> {
    await this.execute('DROP TABLE IF EXISTS "Participant"')
  }

  async fillParticipant (): Promise<void> {
    const participants = await exportParticipants(true)
    await this.execute(pgp().helpers.insert(
      participants,
      [
        'redcapRecordId', 'pid', 'accessGroup', 'site', 'dob', 'dateScreening',
        'mobile', 'email'
      ],
      'Participant'
    ))
  }

  async getParticipants (accessGroup: string): Promise<any[]> {
    let query =
    `SELECT "redcapRecordId", "pid", "accessGroup", "site",
    "dateScreening", "email", "mobile" FROM "Participant"`
    let params = []
    if (!['unrestricted', 'admin'].includes(accessGroup)) {
      query += ' WHERE "accessGroup" = $1'
      params = [accessGroup.toLowerCase()]
    }
    query += ';'
    return await this.getRows<any>(query, params)
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
    return await this.getValue(
      'SELECT "accessGroup" FROM "User" WHERE "email" = $1',
      [email.toLowerCase()]
    )
  }
}

export default new Postgres()
