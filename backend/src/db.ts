import pgp from "pg-promise"
import pg from "pg-promise/typescript/pg-subset"

type DB = pgp.IDatabase<{}, pg.IClient>

export async function isEmpty(db: DB) {
  const allTableNames = await db.each(
    "SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public';",
    [],
    (row) => row[0]
  )
  console.log("found table names: ", JSON.stringify(allTableNames))
  return allTableNames.length === 0
}
