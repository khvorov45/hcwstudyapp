import express, { Request, Response } from "express"
import httpStatus from "http-status-codes"
import pgp from "pg-promise"
import { BACKEND_PORT, DB_CONNECTION_STRING } from "./config"
import { init, isEmpty } from "./db"

// Database connection

async function createDB() {
  console.log(`connecting to ${DB_CONNECTION_STRING}`)
  const db = pgp()(DB_CONNECTION_STRING)
  try {
    await db.connect()
    console.log(`connected successfully to ${DB_CONNECTION_STRING}`)
  } catch (e) {
    throw Error(`could not connect to ${DB_CONNECTION_STRING}: ${e.message}`)
  }
  if (await isEmpty(db)) {
    console.log("database empty, initializing")
    await init(db)
  }
  return db
}

async function main() {
  // Sort out the database connection
  let _db
  try {
    _db = await createDB()
  } catch (e) {
    console.error(e.message)
    return
  }

  // Create the server
  const app = express()

  app.get("/", (req: Request, res: Response) => {
    res.status(httpStatus.OK).send("Hello World!")
  })

  app.listen(BACKEND_PORT, () => {
    console.log(`server started on port ${BACKEND_PORT}`)
  })
}

main()
