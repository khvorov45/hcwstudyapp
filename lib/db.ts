import path from 'path'
import fs from 'fs'
import sqlite from 'sqlite3'
import config from './config'
import { exportParticipants, exportUsers } from './redcap'

export class Database {
  dbDirPath = path.join(process.cwd(), 'db')
  dbFilePath: string
  initTablesSqlFilePath: string
  db: sqlite.Database
  needFill: boolean

  /** Creates uninitialised database. Call `init()` to initialise. */
  constructor (name: string, initTablesSqlFileName: string) {
    this.dbFilePath = path.join(this.dbDirPath, `${name}.sqlite3`)
    this.initTablesSqlFilePath = path.join(
      this.dbDirPath, `${initTablesSqlFileName}.sql`
    )
  }

  /** Creates the connection to the database. If the database file does not
   * exist, it will be created then initialised with tables specified by
   * `initTablesSqlFileName`
   */
  async init (): Promise<this> {
    await this.connect()
    if (this.needFill) {
      await this.initTables()
    }
    return this
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

class UserDB extends Database {
  constructor () {
    super('user', 'init-tables-user')
  }

  async init (): Promise<this> {
    await super.init()
    if (this.needFill) {
      await this.initFillAccessGroup()
      await Promise.all([this.initFillUser(), this.initFillParticipant()])
    }
    return this
  }

  // User table

  async initFillUser () {
    const allUsers = await exportUsers()
    const neededUsers = []
    for (const user of allUsers) {
      neededUsers.push({
        email: user.email,
        accessGroup: user.data_access_group === '' ? 'unrestricted'
          : user.data_access_group
      })
    }
    Promise.all([
      this.addUsers(neededUsers), this.addUsers(await config.additionalUsers)
    ])
  }

  async addUsers (users: {email: string, accessGroup: string}[]) {
    for (const user of users) {
      await this.addUser(user)
    }
  }

  async addUser (user: {email: string, accessGroup: string}) {
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

  async getUsers (ids?: number[]): Promise<{
    id: number, email: string, accessGroup: string, tokenhash: string
  }[]> {
    let query = 'SELECT id, email, accessGroup, tokenhash FROM User'
    if (ids) {
      query = `${query} WHERE id IN (${ids})`
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

  async getUser (id: number): Promise<{
    id: number, email: string, accessGroup: string, tokenhash: string
  }> {
    return new Promise(
      (resolve, reject) => {
        this.db.get(
          `SELECT id, email, accessGroup, tokenhash
          FROM User WHERE id = ${id};`,
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

  async storeTokenHash (hash: string, id: number) {
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

  // AccessGroup table

  async initFillAccessGroup () {
    this.addAccessGroups(await config.accessGroups)
  }

  async addAccessGroups (AccessGroups: string[]) {
    for (const accessGroup of AccessGroups) {
      await this.addAccessGroup(accessGroup)
    }
  }

  async addAccessGroup (accessGroup: string) {
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
            const accessGroupNames: string[] = []
            for (const row of data) {
              accessGroupNames.push(row.name)
            }
            resolve(accessGroupNames)
          }
        })
      }
    )
  }

  async removeAccessGroups (AccessGroups: string[]) {
    for (const accessGroup of AccessGroups) {
      await this.removeAccessGroup(accessGroup)
    }
  }

  async removeAccessGroup (accessGroup: string) {
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

  // Participant table

  async initFillParticipant () {
    return await this.addParticipants(await exportParticipants())
  }

  async updateParticipants (participants) {
    const currentParticipantIds: string[] = await this.getParticipantIds()
    const participnatsToAdd = []
    for (const participant of participants) {
      if (currentParticipantIds.includes(participant.record_id)) continue
      participnatsToAdd.push(participant)
    }
    return await this.addParticipants(participnatsToAdd)
  }

  async addParticipants (participants): Promise<boolean[]> {
    return Promise.all(participants.map((p) => { this.addParticipant(p) }))
  }

  async addParticipant (participant): Promise<boolean> {
    // Not a participant
    if (participant.pid === '') {
      return false
    }
    return new Promise(
      (resolve, reject) => {
        this.db.exec(
          `INSERT INTO Participant (redcapRecordId, pid, accessGroup, site)
          VALUES (
            "${participant.record_id}", "${participant.pid}",
            "${participant.redcap_data_access_group.toLowerCase()}",
            "${participant.site_name}"
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
    if (accessGroup && accessGroup !== 'unrestricted') {
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
}

export default new UserDB().init()
