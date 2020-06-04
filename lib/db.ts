import path from 'path'
import sqlite from 'sqlite3'
import cryptoRandomString from 'crypto-random-string'
import bcrypt from 'bcrypt'
import { getAllSites } from './sites'

class Database {
  db: sqlite.Database
  constructor (sites: Promise<string[]>) {
    const dbFilePath = path.join(process.cwd(), 'db', 'db.sqlite3')
    this.db = new sqlite.Database(
      dbFilePath,
      (error: Error) => {
        if (error) throw error
        console.log('Database opened successfully')
      }
    )
    this.writeSiteAccess(sites)
  }

  async writeSiteAccess (sites: Promise<string[]>) {
    this.db.exec(
      `CREATE TABLE IF NOT EXISTS "Site" (
        "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE,
        "name" TEXT NOT NULL UNIQUE,
        "tokenhash" TEXT NOT NULL
      );`
    )
    this.db.all(
      'SELECT name FROM Site;', async (error, rows) => {
        if (error) throw error
        const currentSites = []
        const neededSites = await sites
        for (const name of rows) {
          if (neededSites.includes(name.name)) {
            currentSites.push(name.name)
            continue
          }
          console.log(`will delete ${name.name}`)
          this.db.exec(
            `DELETE FROM Site WHERE name = "${name.name}"`
          )
        }
        for (const site of neededSites) {
          if (currentSites.includes(site)) continue
          const siteToken = cryptoRandomString(
            { length: 10, type: 'url-safe' }
          )
          const tokenHash = await bcrypt.hash(siteToken, 10)
          console.log(`will write ${site} with hashed ${siteToken}`)
          this.db.exec(
            `INSERT INTO Site (name, tokenhash)
            VALUES ("${site}", "${tokenHash}");`
          )
        }
      }
    )
  }

  temp () {
    console.log('db method')
  }
}

export default new Database(getAllSites())
