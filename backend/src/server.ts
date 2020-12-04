import express, { Request, Response } from "express"
import httpStatus from "http-status-codes"
import pgp from "pg-promise"
import yargs from "yargs"
import { dropSchema, init, isEmpty } from "./db"

// Database connection

async function createDB({
  connectionString,
  clean,
}: {
  connectionString: string
  clean: boolean
}) {
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
    await dropSchema(db)
    await init(db)
  } else if (await isEmpty(db)) {
    console.log("database empty, initializing")
    await init(db)
  }
  return db
}

async function main() {
  const args = yargs(process.argv)
    .string("connectionString")
    .boolean("clean")
    .number("backendPort")
    .default(
      "connectionString",
      "postgres://postgres:admin@localhost:7000/postgres"
    )
    .default("clean", false)
    .default("backendPort", 7001).argv

  // Sort out the database connection
  let _db
  try {
    _db = await createDB(args)
  } catch (e) {
    console.error(e.message)
    return
  }

  // Create the server
  const app = express()

  app.get("/", (req: Request, res: Response) => {
    res.status(httpStatus.OK).send("Hello World!")
  })

  app.listen(args.backendPort, () => {
    console.log(`server started on port ${args.backendPort}`)
  })
}

main()
