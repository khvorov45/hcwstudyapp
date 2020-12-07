import pgp from "pg-promise"
import pg from "pg-promise/typescript/pg-subset"
import * as t from "io-ts"
import { date } from "io-ts-types"
import { User, UserV } from "./data"
import { decode } from "./io"
import { hash } from "./auth"

export type DB = pgp.IDatabase<{}, pg.IClient>

export async function create({
  connectionString,
  clean,
  firstAdminToken,
}: {
  connectionString: string
  clean: boolean
  firstAdminToken: string
}): Promise<DB> {
  console.log(`connecting to ${connectionString}`)
  const db = pgp()(connectionString)
  try {
    await db.connect()
    console.log(`connected successfully to ${connectionString}`)
  } catch (e) {
    throw Error(`could not connect to ${connectionString}: ${e.message}`)
  }
  if (clean) {
    console.log("cleaning db")
    await resetSchema(db)
    await init(db, firstAdminToken)
  } else if (await isEmpty(db)) {
    console.log("database empty, initializing")
    await init(db, firstAdminToken)
  }
  return db
}

async function getTableNames(db: DB): Promise<string[]> {
  return decode(
    t.array(t.string),
    await db.map(
      "SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public';",
      [],
      (r) => r.tablename
    )
  )
}

async function isEmpty(db: DB): Promise<boolean> {
  return (await getTableNames(db)).length === 0
}

async function init(db: DB, tok: string) {
  await db.any(`
  DROP TYPE IF EXISTS hfs_access_group;
  CREATE TYPE hfs_access_group AS ENUM ('admin', 'unrestricted', 'melbourne');
  CREATE TABLE "Meta" (
    "lastUpdate" TIMESTAMPTZ
  );
  CREATE TABLE "User" (
      "email" TEXT NOT NULL PRIMARY KEY UNIQUE,
      "accessGroup" hfs_access_group NOT NULL,
      "tokenhash" TEXT UNIQUE
  );
  CREATE TABLE "Participant" (
      "redcapRecordId" TEXT NOT NULL PRIMARY KEY UNIQUE,
      "pid" TEXT NOT NULL UNIQUE,
      "accessGroup" hfs_access_group NOT NULL,
      "site" TEXT NOT NULL,
      "dateScreening" TIMESTAMPTZ,
      "email" TEXT,
      "mobile" TEXT,
      "addBleed" BOOLEAN,
      "dob" TIMESTAMPTZ,
      "gender" TEXT,
      "withdrawn" BOOLEAN NOT NULL,
      "baselineQuestComplete" BOOLEAN NOT NULL
  );
`)
  await db.any('INSERT INTO "Meta" ("lastUpdate") VALUES ($1)', [new Date()])
  await insertUser(db, {
    email: "khvorov45@gmail.com",
    accessGroup: "admin",
    tokenhash: hash(tok),
  })
  return tok
}

async function resetSchema(db: DB) {
  await db.any('DROP SCHEMA "public" CASCADE;')
  await db.any('CREATE SCHEMA "public";')
}

export async function getLastUpdate(db: DB): Promise<Date> {
  return decode(
    date,
    await db.one('SELECT "lastUpdate" FROM "Meta";', [], (v) => v.lastUpdate)
  )
}

export async function getUsers(db: DB): Promise<User[]> {
  return decode(t.array(UserV), await db.any('SELECT * FROM "User"'))
}

export async function getUserByEmail(db: DB, email: string): Promise<User> {
  return decode(
    UserV,
    await db.one('SELECT * FROM "User" WHERE "email"=$1', [email])
  )
}

export async function getUserByTokenhash(
  db: DB,
  tokenhash: string
): Promise<User> {
  return decode(
    UserV,
    await db.one('SELECT * FROM "User" WHERE "tokenhash"=$1', [tokenhash])
  )
}

export async function insertUser(db: DB, u: User) {
  await db.any(
    `INSERT INTO "User" ("email", "accessGroup", "tokenhash") VALUES
    ($(email), $(accessGroup), $(tokenhash))`,
    { email: u.email, accessGroup: u.accessGroup, tokenhash: u.tokenhash }
  )
}

export async function deleteUser(db: DB, email: string) {
  await db.any('DELETE FROM "User" WHERE email=$1', [email])
}
