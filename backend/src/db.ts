import pgp from "pg-promise"
import pg from "pg-promise/typescript/pg-subset"
import { User } from "./data"

type DB = pgp.IDatabase<{}, pg.IClient>

export async function create({
  connectionString,
  clean,
}: {
  connectionString: string
  clean: boolean
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
    await init(db)
  } else if (await isEmpty(db)) {
    console.log("database empty, initializing")
    await init(db)
  }
  return db
}

export async function getTableNames(db: DB): Promise<string[]> {
  return (
    await db.any(
      "SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public';"
    )
  ).map((r) => r.tablename)
}

export async function isEmpty(db: DB) {
  return (await getTableNames(db)).length === 0
}

export async function init(db: DB) {
  await db.any(`
  DROP TYPE IF EXISTS hfs_access_group;
  CREATE TYPE hfs_access_group AS ENUM ('admin', 'unrestricted');
  CREATE TABLE "Meta" (
    "key" TEXT NOT NULL PRIMARY KEY UNIQUE,
    "value" TEXT
  );
  CREATE TABLE "User" (
      "email" TEXT NOT NULL PRIMARY KEY UNIQUE,
      "accessGroup" TEXT NOT NULL,
      "tokenhash" TEXT
  );
`)
}

export async function resetSchema(db: DB) {
  await db.any('DROP SCHEMA "public" CASCADE;')
  await db.any('CREATE SCHEMA "public";')
}

export async function getUsers(db: DB): Promise<User[]> {
  return await db.any('SELECT * FROM "User"')
}
