import path from 'path'
import fs from 'fs'
import sqlite from 'sqlite3'
import config from './config'
import { exportParticipants, exportUsers } from './redcap'

export class Database {
  dbFilePath: string
  initTablesSqlFilePath: string
  db: sqlite.Database
  needFill: boolean
  lastUpdate: Date

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
    this.lastUpdate = new Date()
    await this.connect()
    if (this.needFill) {
      await this.initTables()
    }
    return this
  }

  /** Updates all tables */
  async update (): Promise<void> {
    this.lastUpdate = new Date()
  }

  /** Creates a connection to the file */
  async connect (): Promise<boolean> {
    this.needFill = true
    if (fs.existsSync(this.dbFilePath)) this.needFill = false
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
  async initTables (): Promise<boolean> {
    return new Promise(
      (resolve, reject) => {
        this.db.exec(fs.readFileSync(this.initTablesSqlFilePath, 'utf8'),
          (error) => {
            if (error) reject(error)
            else resolve(true)
          }
        )
      }
    )
  }

  async getAllRows<T> (sql: string, params?: any): Promise<T[]> {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, data: T[]) => {
        if (err) reject(err)
        else resolve(data)
      })
    })
  }

  async getColumn<T, C>
  (sql: string, column: string, params?: any):
  Promise<C[]> {
    const rows = await this.getAllRows<T>(sql, params)
    return rows.map(row => row[column])
  }

  async execute (sql: string, params?: any): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, (error) => {
        if (error) reject(error)
        else resolve()
      })
    })
  }
}

export interface User {
  id: number,
  email: string,
  accessGroup: string,
  tokenhash: string,
}

export class UserDB extends Database {
  getExtraUsers: () => Promise<any>
  getExtraAccessGroups: () => Promise<string[]>

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

  async init (): Promise<this> {
    await super.init()
    if (this.needFill) {
      await this.initFillAccessGroup()
      await Promise.all([this.initFillUser(), this.initFillParticipant()])
    }
    return this
  }

  async update (): Promise<any> {
    super.update()
    await this.updateAccessGroup()
    return Promise.all([this.updateUsers(), this.updateParticipants()])
  }

  // AccessGroup table

  async initFillAccessGroup (): Promise<void> {
    this.addAccessGroups(await this.getExtraAccessGroups())
  }

  async updateAccessGroup (): Promise<[void[], void[]]> {
    const currentAccessGroups = await this.getAccessGroups()
    const neededAccessGroups = await this.getExtraAccessGroups()
    const groupAdd = this.addAccessGroups(
      neededAccessGroups.filter(
        accessGroup => !currentAccessGroups.includes(accessGroup)
      )
    )
    const groupRemove = this.removeAccessGroups(
      currentAccessGroups.filter(
        accessGroup => !neededAccessGroups.includes(accessGroup)
      )
    )
    return Promise.all([groupAdd, groupRemove])
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

  async removeAccessGroups (accessGroups: string[]): Promise<void[]> {
    return Promise.all(
      accessGroups.map(accessGroup => this.removeAccessGroup(accessGroup))
    )
  }

  async removeAccessGroup (accessGroup: string): Promise<void> {
    return await this.execute(
      'DELETE FROM AccessGroup WHERE name = $accessGroup;',
      { $accessGroup: accessGroup }
    )
  }

  // User table

  async initFillUser (): Promise<[void[], void[]]> {
    return Promise.all([
      this.addUsers(await exportUsers()),
      this.addUsers(await this.getExtraUsers())
    ])
  }

  async updateUsers (): Promise<[void[], void[], void[]]> {
    const redcapUsers = await exportUsers()
    const extraUsers = await this.getExtraUsers()
    const currentUserEmails = await this.getUserEmails()
    const allWantedUsers = extraUsers.concat(redcapUsers.filter(
      redcapUser => !extraUsers.map(extraUser => extraUser.email.toLowerCase())
        .includes(redcapUser.email.toLowerCase())
    ))
    const usersToAdd = []
    const neededEmails = []
    const userChange: Promise<void>[] = []
    for (const user of allWantedUsers) {
      neededEmails.push(user.email.toLowerCase())
      if (currentUserEmails.includes(user.email.toLowerCase())) {
        if (user.accessGroup !== (await this.getUser(
          'email', user.email.toLowerCase()
        )).accessGroup) {
          userChange.push(
            this.changeUserAccessGroup(
              user.email.toLowerCase(), user.accessGroup
            )
          )
        }
        continue
      }
      usersToAdd.push(user)
    }
    const userAddition = this.addUsers(usersToAdd)
    const userRemoval = this.removeUsers(currentUserEmails.filter(
      currentEmail => !neededEmails.includes(currentEmail))
    )
    return Promise.all([userAddition, userRemoval, Promise.all(userChange)])
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

  async removeUsers (emails: string[]): Promise<void[]> {
    return Promise.all(emails.map(email => this.removeUser(email)))
  }

  async removeUser (email: string): Promise<void> {
    return await this.execute(
      'DELETE FROM USER WHERE email = $email;',
      { $email: email }
    )
  }

  async getUsers (ids?: number[]): Promise<User[]> {
    let query = 'SELECT id, email, accessGroup, tokenhash FROM User'
    if (ids) {
      query += ' WHERE id IN ($ids)'
    }
    query += ';'
    return await this.getAllRows<User>(query, { $ids: ids })
  }

  async getUser (by: string, val: string | number): Promise<User> {
    return new Promise(
      (resolve, reject) => {
        if (!['id', 'email'].includes(by)) {
          reject(Error('disallowed by: ' + by))
        }
        this.db.get(
          `SELECT id, email, accessGroup, tokenhash
          FROM User WHERE ${by} = $val;`,
          { $val: val },
          (err, data) => {
            if (err) reject(err)
            else {
              resolve(data)
            }
          }
        )
      }
    )
  }

  async getUserEmails (): Promise<string[]> {
    return await this.getColumn<{email: string}, string>(
      'SELECT email FROM User;', 'email'
    )
  }

  async storeTokenHash (hash: string, id: number): Promise<void> {
    return await this.execute(
      'UPDATE User SET tokenhash = $hash WHERE id = $id',
      { $hash: hash, $id: id }
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

  async initFillParticipant (): Promise<void[]> {
    return await this.addParticipants(await exportParticipants())
  }

  async updateParticipants (): Promise<void[]> {
    await this.removeParticipants()
    return await this.addParticipants(await exportParticipants())
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
    let query = 'SELECT * FROM Participant'
    if (accessGroup && !['unrestricted', 'admin'].includes(accessGroup)) {
      query += ' WHERE accessGroup = $accessGroup'
    }
    query += ';'
    return await this.getAllRows<any>(query, { $accessGroup: accessGroup })
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
