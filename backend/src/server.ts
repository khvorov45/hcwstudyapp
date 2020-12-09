import express from "express"
import yargs from "yargs"
import { getRoutes } from "./api"
import { create as createDB } from "./db"
import { createTransport } from "./email"

async function main() {
  const args = yargs(process.argv)
    .config()
    .string([
      "dbConnectionString",
      "prefix",
      "firstAdminEmail",
      "firstAdminToken",
      "redcapUrl",
      "redcapToken2020",
      "redcapToken2021",
      "emailConnectionString",
    ])
    .boolean("clean")
    .number("backendPort")
    .default("config", "hsa-config.json")
    .default(
      "dbConnectionString",
      "postgres://postgres:admin@localhost:7000/postgres"
    )
    .default("firstAdminEmail", "admin@example.com")
    .default("firstAdminToken", "admin")
    // THE TRAILING SLASH IS IMPORTANT CARL IT WILL FAIL OTHERWISE
    .default("redcapUrl", "https://biredcap.mh.org.au/api/")
    .default("redcapToken2020", "")
    .default("redcapToken2021", "")
    .default("emailConnectionString", "smtp://user:password@smtp.hostname.com")
    .default("prefix", "")
    .default("clean", false)
    .default("backendPort", 7001).argv

  // Create the server
  const app = express()
  app.use(express.json())
  app.use(
    `/${args.prefix}`,
    getRoutes(
      await createDB(args),
      {
        url: args.redcapUrl,
        token2020: args.redcapToken2020,
        token2021: args.redcapToken2021,
      },
      createTransport(args.emailConnectionString)
    )
  )

  app.listen(args.backendPort, () => {
    console.log(`server started on port ${args.backendPort}`)
  })
}

main().catch((e) => console.error(e.message))
