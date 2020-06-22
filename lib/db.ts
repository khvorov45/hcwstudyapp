import path from 'path'
import fs from 'fs'
import sqlite from 'sqlite3'
import config from './config'
import { exportParticipants, exportUsers } from './redcap'

// TODO: string escaping

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
    return new Promise(
      (resolve, reject) => {
        this.db.exec(
          `INSERT INTO AccessGroup (name)
          VALUES ("${accessGroup.toLowerCase()}");`,
          (error) => {
            if (error) reject(error)
            else resolve()
          }
        )
      }
    )
  }

  async getAccessGroups (): Promise<string[]> {
    return new Promise(
      (resolve, reject) => {
        this.db.all('SELECT name FROM AccessGroup;', (err, data) => {
          if (err) reject(err)
          else {
            resolve(data.map(row => row.name))
          }
        })
      }
    )
  }

  async removeAccessGroups (accessGroups: string[]): Promise<void[]> {
    return Promise.all(
      accessGroups.map(accessGroup => this.removeAccessGroup(accessGroup))
    )
  }

  async removeAccessGroup (accessGroup: string): Promise<void> {
    return new Promise(
      (resolve, reject) => {
        this.db.exec(
          `DELETE FROM AccessGroup WHERE name = "${accessGroup}";`,
          (error) => {
            if (error) reject(error)
            else resolve()
          }
        )
      }
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
    return new Promise(
      (resolve, reject) => {
        this.db.exec(
          `INSERT INTO User (email, accessGroup) VALUES
          ("${user.email.toLowerCase()}",
          "${user.accessGroup.toLowerCase()}");`,
          (error) => {
            if (error) reject(error)
            else resolve()
          }
        )
      }
    )
  }

  async removeUsers (emails: string[]): Promise<void[]> {
    return Promise.all(emails.map(email => this.removeUser(email)))
  }

  async removeUser (email: string): Promise<void> {
    return new Promise(
      (resolve, reject) => {
        this.db.exec(
          `DELETE FROM USER WHERE email = "${email}";`,
          (error) => {
            if (error) reject(error)
            else resolve()
          }
        )
      }
    )
  }

  async getUsers (ids?: number[]): Promise<User[]> {
    let query = 'SELECT id, email, accessGroup, tokenhash FROM User'
    if (ids) {
      query = `${query} WHERE id IN (${ids.toString()})`
    }
    query += ';'
    return new Promise(
      (resolve, reject) => {
        this.db.all(query, (err, data) => {
          if (err) reject(err)
          else {
            resolve(data)
          }
        })
      }
    )
  }

  async getUser (by: string, val: string | number): Promise<User> {
    return new Promise(
      (resolve, reject) => {
        if (!['id', 'email'].includes(by)) {
          reject(Error('disallowed by: ' + by))
        }
        this.db.get(
          `SELECT id, email, accessGroup, tokenhash
          FROM User WHERE ${by} = "${val}";`,
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
    return new Promise(
      (resolve, reject) => {
        this.db.all('SELECT email FROM User;', (err, users) => {
          if (err) reject(err)
          else {
            resolve(users.map(user => user.email))
          }
        })
      }
    )
  }

  async storeTokenHash (hash: string, id: number): Promise<void> {
    return new Promise(
      (resolve, reject) => {
        this.db.exec(
          `UPDATE User SET tokenhash = "${hash}" WHERE id = ${id}`,
          (error) => {
            if (error) reject(error)
            else resolve()
          }
        )
      }
    )
  }

  async changeUserAccessGroup (email: string, newAccessGroup: string):
  Promise<void> {
    return new Promise(
      (resolve, reject) => {
        this.db.exec(
          `UPDATE User SET accessGroup = "${newAccessGroup}"
          WHERE email = "${email.toLowerCase()}"`,
          (error) => {
            if (error) reject(error)
            else resolve()
          }
        )
      }
    )
  }

  // Participant table

  async initFillParticipant () {
    return await this.addParticipants(await exportParticipants())
  }

  async updateParticipants () {
    await this.removeParticipants()
    return await this.addParticipants(await exportParticipants())
  }

  async addParticipants (participants): Promise<boolean[]> {
    return Promise.all(participants.map(p => this.addParticipant(p)))
  }

  async addParticipant (participant): Promise<boolean> {
    // Not a participant
    if (participant.pid === '') {
      return false
    }
    return new Promise(
      (resolve, reject) => {
        this.db.exec(
          `INSERT INTO Participant
          (redcapRecordId, pid, accessGroup, site, dob, dateScreening)
          VALUES (
            "${participant.record_id}", "${participant.pid}",
            "${participant.redcap_data_access_group.toLowerCase()}",
            "${participant.site_name}", "${participant.a2_dob}",
            "${participant.date_screening}"
          );`,
          (error) => {
            if (error) reject(error)
            else resolve(true)
          }
        )
      }
    )
  }

  async getParticipants (accessGroup?: string): Promise<any[]> {
    let query = 'SELECT * FROM Participant'
    if (accessGroup && !['unrestricted', 'admin'].includes(accessGroup)) {
      query = `${query} WHERE accessGroup = '${accessGroup}'`
    }
    query += ';'
    return new Promise(
      (resolve, reject) => {
        this.db.all(query, (err, data) => {
          if (err) reject(err)
          else resolve(data)
        })
      }
    )
  }

  async getParticipantIds (): Promise<string[]> {
    return new Promise(
      (resolve, reject) => {
        this.db.all('SELECT redcapRecordId FROM Participant;', (err, data) => {
          if (err) reject(err)
          else {
            const redcapRecordIds: string[] = []
            for (const row of data) {
              redcapRecordIds.push(row.redcapRecordId)
            }
            resolve(redcapRecordIds)
          }
        })
      }
    )
  }

  async removeParticipants (): Promise<void> {
    return new Promise(
      (resolve, reject) => {
        this.db.exec('DELETE FROM Participant;', (err) => {
          if (err) reject(err)
          else {
            resolve()
          }
        })
      }
    )
  }
}

export default new UserDB().init()
