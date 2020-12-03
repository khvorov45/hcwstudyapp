import express, { Request, Response } from "express"
import httpStatus from "http-status-codes"
import pgp from "pg-promise"
import { BACKEND_PORT, DB_CONNECTION_STRING } from "./config"

// Database connection

async function createDB() {
  console.log(`connecting to ${DB_CONNECTION_STRING}`)
  const pg = pgp()(DB_CONNECTION_STRING)
  try {
    await pg.connect()
    console.log(`connected successfully to ${DB_CONNECTION_STRING}`)
  } catch (e) {
    throw Error(`could not connect to ${DB_CONNECTION_STRING}: ${e.message}`)
  }
  return pg
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
