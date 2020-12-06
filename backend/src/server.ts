import express from "express"
import yargs from "yargs"
import { getRoutes } from "./api"
import { create as createDB } from "./db"

async function main() {
  const args = yargs(process.argv)
    .string(["connectionString", "prefix"])
    .boolean("clean")
    .number("backendPort")
    .default(
      "connectionString",
      "postgres://postgres:admin@localhost:7000/postgres"
    )
    .default("prefix", "")
    .default("clean", false)
    .default("backendPort", 7001).argv

  // Sort out the database connection
  let db
  try {
    db = await createDB(args)
  } catch (e) {
    console.error(e.message)
    return
  }

  // Create the server
  const app = express()
  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))
  app.use(`/${args.prefix}`, getRoutes(db))

  app.listen(args.backendPort, () => {
    console.log(`server started on port ${args.backendPort}`)
  })
}

main()
