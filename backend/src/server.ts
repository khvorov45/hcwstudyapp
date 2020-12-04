import express, { Request, Response } from "express"
import httpStatus from "http-status-codes"
import yargs from "yargs"
import { create as createDB } from "./db"

// Database connection

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
