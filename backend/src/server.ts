import express from "express"
import yargs from "yargs"
import cors from "cors"
import { getRoutes } from "./api"
import { create as createDB } from "./db"
import { createTransport } from "./email"
import morgan from "morgan"

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
      "frontendRoot",
    ])
    .boolean(["clean", "cors"])
    .number([
      "backendPort",
      "tokenDaysToLive",
      "firstConnectionRetryDelayMs",
      "firstConnectionRetryMaxAttempts",
    ])
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
    .default("frontendRoot", "http://localhost:3000")
    .default("clean", false)
    .default("cors", false)
    .default("tokenDaysToLive", 30)
    .default("firstConnectionRetryDelayMs", 1000)
    .default("firstConnectionRetryMaxAttempts", 5)
    .default("backendPort", 7001).argv

  // Make sure first admin email is lowercased
  args.firstAdminEmail = args.firstAdminEmail.toLowerCase()

  // Create the server
  const app = express()
  app.use(express.json({ limit: "100mb" }))
  app.use(morgan("tiny"))
  if (args.cors) {
    app.use(cors())
  }
  app.use(
    `/${args.prefix}`,
    getRoutes(
      await createDB(args),
      {
        url: args.redcapUrl,
        token2020: args.redcapToken2020,
        token2021: args.redcapToken2021,
      },
      {
        emailer: createTransport(args.emailConnectionString),
        frontendRoot: args.frontendRoot,
      },
      args
    )
  )

  app.listen(args.backendPort, () => {
    console.log(`server started on port ${args.backendPort}`)
  })
}

main().catch((e) => console.error(e.message))
