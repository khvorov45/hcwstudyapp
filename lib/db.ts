import path from 'path'
import fs from 'fs'
import sqlite from 'sqlite3'
import { readDelimited, readLines } from './readfile'
import { exportParticipants } from './redcap'

export class Database {
  dbDirPath = path.join(process.cwd(), 'db')
  configDirPath = path.join(process.cwd(), 'config')
  db: sqlite.Database
  needFill: boolean

  /** Creates the connection to the database. If the database file does not
   * exist, it will be created then initialised with tables specified by
   * `initTablesSqlFilePath`
   */
  constructor (name: string, initTablesSqlFilePath: string) {
    this.needFill = false
    if (this.createdb(path.join(this.dbDirPath, `${name}.sqlite3`))) {
      this.initTables(path.join(this.dbDirPath, `${initTablesSqlFilePath}.sql`))
      this.needFill = true
    }
  }

  /** Creates a connection to `dbFilePath`.
   * Returns `true` when the connection is to a newly created file and `false`
   * otherwise
   */
  createdb (dbFilePath: string): boolean {
    let needToInit = true
    if (fs.existsSync(dbFilePath)) needToInit = false
    this.db = new sqlite.Database(
      dbFilePath,
      (error: Error) => {
        if (error) throw error
        console.log('Database opened successfully')
      }
    )
    return needToInit
  }

  /** Executes the SQL file found at `initTablesSqlFilePath` that's supposed
   * initialise the database tables and leave them empty
   */
  initTables (initTablesSqlFilePath: string) {
    this.db.exec(fs.readFileSync(initTablesSqlFilePath, 'utf8'))
  }
}

class UserDB extends Database {
  constructor () {
    super('user', 'init-tables-user')
    if (this.needFill) {
      this.initFillAccessGroup()
      this.initFillUser()
    }
  }

  async initFillUser () {
    const neededUsers = await readDelimited(
      path.join(this.configDirPath, 'user.txt'), ' ', ['email', 'accessGroup']
    )
    this.addUsers(neededUsers)
  }

  async addUsers (users: {email: string, accessGroup: string}[]) {
    for (const user of users) {
      await this.addUser(user)
    }
  }

  addUser (user: {email: string, accessGroup: string}) {
    return new Promise(
      (resolve, reject) => {
        this.db.exec(
          `INSERT INTO User (email, accessGroup) VALUES
          ("${user.email}", "${user.accessGroup}");`,
          (error) => {
            if (error) reject(error)
            else resolve()
          }
        )
      }
    )
  }

  getUsers (): Promise<{
    id: number, email: string, accessGroup: string, tokenhash: string
  }[]> {
    return new Promise(
      (resolve, reject) => {
        this.db.all('SELECT * FROM User;', (err, data) => {
          if (err) reject(err)
          else {
            resolve(data)
          }
        })
      }
    )
  }

  storeTokenHash (hash: string, id: number) {
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

  async initFillAccessGroup () {
    const neededAccessGroups = await readLines(
      path.join(this.configDirPath, 'sites.txt')
    )
    if (!neededAccessGroups.includes('admin')) {
      neededAccessGroups.push('admin')
    }
    this.addAccessGroups(neededAccessGroups)
  }

  getAccessGroups (): Promise<string[]> {
    return new Promise(
      (resolve, reject) => {
        this.db.all('SELECT * FROM AccessGroup;', (err, data) => {
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

  removeAccessGroup (accessGroup: string) {
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

  async addAccessGroups (AccessGroups: string[]) {
    for (const accessGroup of AccessGroups) {
      await this.addAccessGroup(accessGroup)
    }
  }

  addAccessGroup (accessGroup: string) {
    return new Promise(
      (resolve, reject) => {
        this.db.exec(
          `INSERT INTO AccessGroup (name) VALUES ("${accessGroup}")`,
          (error) => {
            if (error) reject(error)
            else resolve()
          }
        )
      }
    )
  }
}

class StudyDB extends Database {
  constructor () {
    super('study', 'init-tables-study')
    if (this.needFill) {
      this.initFillParticipant()
    }
  }

  async initFillParticipant () {
    return await this.addParticipants(await exportParticipants())
  }

  async update () {
    const participants = await exportParticipants()
    this.updateParticipants(participants)
  }

  async updateParticipants (participants) {
    const currentParticipantIds: string[] = await this.getParticipantIds()
    console.log(currentParticipantIds)
    for (const participant of participants) {
      if (currentParticipantIds.includes(participant.record_id)) continue
      await this.addParticipant(participant)
    }
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

  async getParticipants (): Promise<Object[]> {
    return new Promise(
      (resolve, reject) => {
        this.db.all('SELECT * FROM Participant;', (err, data) => {
          if (err) reject(err)
          else resolve(data)
        })
      }
    )
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
          `INSERT INTO Participant (redcapRecordId, pid, site) VALUES
          (
            "${participant.record_id}", "${participant.pid}",
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
}

export default {
  user: new UserDB(),
  study: new StudyDB()
}
