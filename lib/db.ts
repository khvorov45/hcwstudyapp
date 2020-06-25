import path from 'path'
import fs from 'fs'
import { Pool, PoolConfig } from 'pg'
import sqlite from 'sqlite3'
import config from './config'
import { exportParticipants, exportUsers } from './redcap'
import { readFile } from './readfile'

/** Base class to interact with local databases */
export class Database {
  dbFilePath: string
  initTablesSqlFilePath: string
  db: sqlite.Database
  newFile: boolean

  /** Creates uninitialised database. Call `init()` to initialise. */
  constructor (dbFilePath: string, initTablesSqlFilePath: string) {
    this.dbFilePath = dbFilePath
    this.initTablesSqlFilePath = initTablesSqlFilePath
  }

  /** Creates the connection to the database. If the database file does not
   * exist, it will be created then initialised with tables specified by
   * `initTablesSqlFileName`
   */
  async init (): Promise<this> {
    await this.connect()
    if (this.newFile) {
      await this.initTables()
      await this.fill(false)
      this.setLastUpdate(new Date())
    }
    return this
  }

  /** Updates all tables with backup */
  async update (): Promise<void> {
    await this.wipe(true)
    await this.fill(true)
    this.setLastUpdate(new Date())
  }

  /** Resets all tables, i.e. updates with no backup */
  async reset (): Promise<void> {
    await this.wipe(false)
    await this.fill(false)
    this.setLastUpdate(new Date())
  }

  /** Supposed to wipe all tables */
  async wipe (_backup: boolean): Promise<void> {}

  /** Supposed to refill all tables */
  async fill (_backup: boolean): Promise<void> {}

  /** Creates a connection to the file */
  async connect (): Promise<boolean> {
    this.newFile = true
    if (fs.existsSync(this.dbFilePath)) this.newFile = false
    return new Promise(
      (resolve, reject) => {
        this.db = new sqlite.Database(
          this.dbFilePath,
          (error: Error) => {
            if (error) reject(error)
            else resolve(true)
          }
        )
      }
    )
  }

  /** Executes the SQL file to initialise the tables */
  async initTables (): Promise<void> {
    const sql = await readFile(this.initTablesSqlFilePath, 'utf8')
    await this.executeAll(sql)
    await this.executeAll(
      `CREATE TABLE "Meta" (
        "key" TEXT NOT NULL PRIMARY KEY UNIQUE,
        "value" TEXT NOT NULL
      );
      INSERT INTO Meta (key, value)
      VALUES ('lastUpdate', '${new Date().toString()}')`
    )
  }

  async setLastUpdate (date: Date): Promise<void> {
    await this.execute(
      'UPDATE Meta SET value = $date WHERE key = \'lastUpdate\'',
      { $date: date.toString() }
    )
  }

  async getLastUpdate (): Promise<Date> {
    const dateString = await this.getRow<{value: string}>(
      'SELECT value FROM Meta WHERE key = \'lastUpdate\''
    )
    return new Date(dateString.value)
  }

  async getRow<T> (sql: string, params?: any): Promise<T> {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, data: T) => {
        if (err) reject(err)
        else resolve(data)
      })
    })
  }

  /** Returns  an array of all rows retruned by the query
   *
   * @param sql SQL to run
   * @param params Parameters to pass to `sqlite3` `all` method
   */
  async getAllRows<T> (sql: string, params?: any): Promise<T[]> {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, data: T[]) => {
        if (err) reject(err)
        else resolve(data)
      })
    })
  }

  /** Returns an array of values within one column retruned by the query
   *
   * @param sql SQL to run
   * @param column Column name
   * @param params Parameters to pass to `sqlite3` `all` method
   */
  async getColumn<T, C>
  (sql: string, column: string, params?: any):
  Promise<C[]> {
    const rows = await this.getAllRows<T>(sql, params)
    return rows.map(row => row[column])
  }

  /** Execute a query
   *
   * @param sql SQL to run
   * @param params Parameters to pass to `sqlite3` `run` method
   */
  async execute (sql: string, params?: any): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, (error) => {
        if (error) reject(error)
        else resolve()
      })
    })
  }

  /** Execute all queries in a string
   *
   * @param sql SQL to run
   * @param params Parameters to pass to `sqlite3` `exec` method
   */
  async executeAll (sql: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.exec(sql, (error) => {
        if (error) reject(error)
        else resolve()
      })
    })
  }
}

export interface User {
  email: string,
  accessGroup: string,
  tokenhash: string,
}

/** Actual database with users and participants */
export class UserDB extends Database {
  getExtraUsers: () => Promise<any>
  getExtraAccessGroups: () => Promise<string[]>
  userBackup: User[]

  constructor (
    dbFilePath?: string,
    initTablesSqlFilePath?: string,
    getExtraUsers?: () => Promise<any>,
    getExtraAccessGroups?: () => Promise<string[]>
  ) {
    super(
      dbFilePath || path.join(process.cwd(), 'db', 'user.sqlite3'),
      initTablesSqlFilePath ||
      path.join(process.cwd(), 'db', 'init-tables-user.sql')
    )
    this.getExtraUsers = getExtraUsers || config.getExtraUsers
    this.getExtraAccessGroups = getExtraAccessGroups ||
    config.getExtraAccessGroups
  }

  async wipe (backup: boolean): Promise<void> {
    await this.removeAccessGroups()
    await Promise.all([this.removeUsers(backup), this.removeParticipants()])
  }

  async fill (backup: boolean): Promise<void> {
    await this.fillAccessGroup()
    await Promise.all([this.fillUser(backup), this.fillParticipant()])
  }

  // AccessGroup table

  async fillAccessGroup (): Promise<void> {
    await this.addAccessGroups(await this.getExtraAccessGroups())
  }

  async addAccessGroups (accessGroups: string[]): Promise<void[]> {
    return Promise.all(
      accessGroups.map(accessGroup => this.addAccessGroup(accessGroup))
    )
  }

  async addAccessGroup (accessGroup: string): Promise<void> {
    return await this.execute(
      'INSERT INTO AccessGroup (name) VALUES ($name);',
      { $name: accessGroup }
    )
  }

  async getAccessGroups (): Promise<string[]> {
    return await this.getColumn<{name: string}, string>(
      'SELECT name FROM AccessGroup;', 'name'
    )
  }

  async removeAccessGroups (): Promise<void> {
    return await this.execute('DELETE FROM AccessGroup')
  }

  async removeAccessGroup (accessGroup: string): Promise<void> {
    return await this.execute(
      'DELETE FROM AccessGroup WHERE name = $accessGroup;',
      { $accessGroup: accessGroup }
    )
  }

  // User table

  async fillUser (backup: boolean): Promise<void> {
    const extraUsers = await this.getExtraUsers()
    const extraUserEmails = extraUsers.map(u => u.email.toLowerCase())
    const exportedUsers = (await exportUsers())
      .filter(u => !extraUserEmails.includes(u.email.toLowerCase()))
    await Promise.all([
      this.addUsers(extraUsers),
      this.addUsers(exportedUsers)
    ])
    if (backup) {
      this.userBackup
        .filter(u => u.tokenhash !== null)
        .map(u => this.storeTokenHash(u.tokenhash, u.email))
    }
  }

  async addUsers (users: {email: string, accessGroup: string}[]):
  Promise<void[]> {
    return Promise.all(users.map(user => this.addUser(user)))
  }

  async addUser (user: {email: string, accessGroup: string}): Promise<void> {
    return await this.execute(
      'INSERT INTO User (email, accessGroup) VALUES ($email, $accessGroup)',
      {
        $email: user.email.toLowerCase(),
        $accessGroup: user.accessGroup.toLowerCase()
      }
    )
  }

  async removeUsers (backup: boolean): Promise<void> {
    if (backup) {
      this.userBackup = await this.getUsers()
    }
    await this.execute('DELETE FROM User;')
  }

  async removeUser (email: string): Promise<void> {
    return await this.execute(
      'DELETE FROM USER WHERE email = $email;',
      { $email: email.toLowerCase() }
    )
  }

  async getUsers (): Promise<User[]> {
    const query = 'SELECT email, accessGroup, tokenhash FROM User;'
    return await this.getAllRows<User>(query)
  }

  async getUser (email: string): Promise<User> {
    return await this.getRow(
      'SELECT email, accessGroup, tokenhash ' +
      'FROM User WHERE email = $email;',
      { $email: email.toLowerCase() }
    )
  }

  async getUserEmails (): Promise<string[]> {
    return await this.getColumn<{email: string}, string>(
      'SELECT email FROM User;', 'email'
    )
  }

  async storeTokenHash (hash: string, email: string): Promise<void> {
    return await this.execute(
      'UPDATE User SET tokenhash = $hash WHERE email = $email',
      { $hash: hash, $email: email.toLowerCase() }
    )
  }

  async changeUserAccessGroup (email: string, newAccessGroup: string):
  Promise<void> {
    return await this.execute(
      'UPDATE User SET accessGroup = $newAccessGroup WHERE email = $email',
      { $newAccessGroup: newAccessGroup, $email: email.toLowerCase() }
    )
  }

  // Participant table

  async fillParticipant (): Promise<void> {
    await this.addParticipants(await exportParticipants())
  }

  async addParticipants (participants): Promise<void[]> {
    return Promise.all(participants.map(p => this.addParticipant(p)))
  }

  async addParticipant (participant): Promise<void> {
    // Not a participant
    if (participant.pid === '') {
      return
    }
    return await this.execute(
      'INSERT INTO Participant ' +
      '(redcapRecordId, pid, accessGroup, site, dob, dateScreening) ' +
      'VALUES ' +
      '($redcapRecordId, $pid, $accessGroup, $site, $dob, $dateScreening);',
      {
        $redcapRecordId: participant.record_id,
        $pid: participant.pid,
        $accessGroup: participant.redcap_data_access_group.toLowerCase(),
        $site: participant.site_name,
        $dob: participant.a2_dob,
        $dateScreening: participant.date_screening
      }
    )
  }

  async getParticipants (accessGroup?: string): Promise<any[]> {
    let query =
    `SELECT redcapRecordId, pid, accessGroup, site,
    dob, dateScreening
    FROM Participant`
    let params = {}
    if (accessGroup && !['unrestricted', 'admin'].includes(accessGroup)) {
      query += ' WHERE accessGroup = $accessGroup'
      params = { $accessGroup: accessGroup }
    }
    query += ';'
    return await this.getAllRows<any>(query, params)
  }

  async getParticipantIds (): Promise<string[]> {
    return await this.getColumn<{redcapRecordId: string}, string>(
      'SELECT redcapRecordId FROM Participant;', 'redcapRecordId'
    )
  }

  async removeParticipants (): Promise<void> {
    return await this.execute('DELETE FROM Participant;')
  }
}

export default new UserDB().init()

export class DatabasePostgres {
  pool: Pool

  constructor (con?: PoolConfig) {
    this.pool = new Pool(con || config.postgresCredentials)
  }

  async end (): Promise<void> {
    return await this.pool.end()
  }

  async placeholder (): Promise<number> {
    console.log(await this.pool.query('SELECT NOW();'))
    return 1
  }
}
