import path from 'path'
import fs from 'fs'
import sqlite from 'sqlite3'
import { getAllSites } from './sites'

class Database {
  dbDirPath = path.join(process.cwd(), 'db')
  db: sqlite.Database

  constructor (name: string, initTablesSqlFilePath: string) {
    if (this.createdb(path.join(this.dbDirPath, `${name}.sqlite3`))) {
      this.initTables(path.join(this.dbDirPath, `${initTablesSqlFilePath}.sql`))
    }
    this.updateAccessGroup()
  }

  /** Creates a connection to `dbFilePath`.
   * Returns `true` when the connection is to a newly created file and `false`
   * otherwise */
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

  initTables (initTablesSqlFilePath: string) {
    this.db.exec(fs.readFileSync(initTablesSqlFilePath, 'utf8'))
  }

  async updateAccessGroup () {
    const currentAccessGroups = await this.getCurrentAccessGroups()
    const neededAccessGroups = await getAllSites()
    if (!neededAccessGroups.includes('admin')) {
      neededAccessGroups.push('admin')
    }
    this.removeUnnededAccessGroups(neededAccessGroups, currentAccessGroups)
    this.addAccessGroups(neededAccessGroups, currentAccessGroups)
  }

  getCurrentAccessGroups (): Promise<string[]> {
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

  async removeUnnededAccessGroups (
    neededAccessGroups: string[], currentAccessGroups: string[]
  ) {
    for (const accessGroup of currentAccessGroups) {
      if (neededAccessGroups.includes(accessGroup)) continue
      await this.removeAccessGroup(accessGroup)
    }
  }

  async removeAccessGroup (accessGroup: string) {
    return new Promise(
      (resolve, reject) => {
        this.db.exec(
          `DELETE FROM AccessGroup WHERE name = "${accessGroup}"`,
          (error) => {
            if (error) reject(error)
            else resolve()
          }
        )
      }
    )
  }

  async addAccessGroups (
    neededAccessGroups: string[], currentAccessGroups: string[]
  ) {
    for (const accessGroup of neededAccessGroups) {
      if (currentAccessGroups.includes(accessGroup)) continue
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

  temp () {
    console.log('db method')
  }
}

export default new Database('user', 'init-tables-user')
