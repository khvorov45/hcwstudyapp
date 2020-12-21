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
      "linkPrefix",
    ])
    .boolean(["clean", "cors"])
    .number(["backendPort", "tokenDaysToLive"])
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
    .default("linkPrefix", "https://reports.hcwflustudy.com/?token=")
    .default("clean", false)
    .default("cors", false)
    .default("tokenDaysToLive", 30)
    .default("backendPort", 7001).argv

  // Create the server
  const app = express()
  app.use(express.json())
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
        linkPrefix: args.linkPrefix,
      },
      args.tokenDaysToLive
    )
  )

  app.listen(args.backendPort, () => {
    console.log(`server started on port ${args.backendPort}`)
  })
}

main().catch((e) => console.error(e.message))
