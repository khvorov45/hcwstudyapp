import pgp from "pg-promise"
import pg from "pg-promise/typescript/pg-subset"

type DB = pgp.IDatabase<{}, pg.IClient>

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
}

export async function dropSchema(db: DB) {
  await db.any('DROP SCHEMA "public" CASCADE;')
  await db.any('CREATE SCHEMA "public";')
}
