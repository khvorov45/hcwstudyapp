import { Request, Response } from "express"
import Router from "express-promise-router"
import * as t from "io-ts"
import StatusCodes from "http-status-codes"
import {
  getUsers,
  DB,
  getLastParticipantUpdate,
  insertUsers,
  deleteUser,
  getUserByToken,
  insertParticipants,
  getParticipantsSubset,
  deleteParticipant,
  syncRedcapUsers,
  syncRedcapParticipants,
  getLastUserUpdate,
  getVaccinationSubset,
  getRedcapIdSubset,
  getWithdrawnSubset,
  getScheduleSubset,
  getWeeklySurveySubset,
  insertTokens,
  refreshSessionToken,
  deleteUserTokens,
  deleteToken,
  updateUser,
  insertSerology,
  insertViruses,
  getViruses,
  getSerologySubset,
  deleteAllViruses,
  deleteAllSerology,
  reset,
} from "./db"
import {
  ParticipantV,
  SerologyV,
  TokenTypeV,
  User,
  UserV,
  VirusV,
} from "./data"
import { decode } from "./io"
import { createToken } from "./auth"
import { RedcapConfig } from "./redcap"
import { emailApiToken, Emailer, emailLoginLink } from "./email"
import { BooleanFromString } from "io-ts-types"

export function getRoutes(
  db: () => Promise<DB>,
  redcapConfig: RedcapConfig,
  emailConfig: {
    emailer: Emailer
    frontendRoot: string
  },
  {
    tokenDaysToLive,
    firstAdminEmail,
    firstAdminToken,
  }: {
    tokenDaysToLive: number
    firstAdminEmail: string
    firstAdminToken: string
  }
) {
  const routes = Router()

  // Routes

  // Reset
  routes.delete("/reset", async (req: Request, res: Response) => {
    await validateAdmin(req, await db())
    await reset(await db(), redcapConfig, {
      restoreTokens: decode(BooleanFromString, req.query.restoreTokens),
      tokenDaysToLive,
      firstAdmin: { email: firstAdminEmail, token: firstAdminToken },
    })
    res.status(StatusCodes.NO_CONTENT).end()
  })

  // Users
  routes.get("/users", async (req: Request, res: Response) => {
    await validateAdmin(req, await db())
    res.json(await getUsers(await db()))
  })
  routes.post("/users", async (req: Request, res: Response) => {
    await validateAdmin(req, await db())
    const us = decode(t.array(UserV), req.body)
    await insertUsers(await db(), us)
    res.status(StatusCodes.NO_CONTENT).end()
  })
  routes.delete("/users", async (req: Request, res: Response) => {
    await validateAdmin(req, await db())
    await deleteUser(await db(), decode(t.string, req.query.email))
    res.status(StatusCodes.NO_CONTENT).end()
  })
  routes.put("/users", async (req: Request, res: Response) => {
    await validateAdmin(req, await db())
    await updateUser(await db(), decode(UserV, req.body))
    res.status(StatusCodes.NO_CONTENT).end()
  })
  routes.put("/users/redcap/sync", async (req: Request, res: Response) => {
    await validateAdmin(req, await db())
    await syncRedcapUsers(await db(), redcapConfig)
    res.status(StatusCodes.NO_CONTENT).end()
  })
  routes.get("/users/redcap/sync", async (req: Request, res: Response) => {
    res.json(await getLastUserUpdate(await db()))
  })

  // Auth
  routes.post("/auth/token/send", async (req: Request, res: Response) => {
    const email = decode(t.string, req.query.email)
    const type = decode(TokenTypeV, req.query.type)
    const token = createToken(email, tokenDaysToLive, type)
    await insertTokens(await db(), [token])
    if (type === "session") {
      await emailLoginLink(emailConfig.emailer, {
        email,
        token: token.token,
        frontendRoot: emailConfig.frontendRoot,
      })
    } else {
      await emailApiToken(emailConfig.emailer, { email, token: token.token })
    }
    res.status(StatusCodes.NO_CONTENT).end()
  })
  routes.get("/auth/token/verify", async (req: Request, res: Response) => {
    const u = await validateUser(req, await db())
    res.json({ email: u.email, accessGroup: u.accessGroup })
  })
  routes.put("/auth/token", async (req: Request, res: Response) => {
    res.json(
      await refreshSessionToken(await db(), extractToken(req), tokenDaysToLive)
    )
  })
  routes.delete("/auth/token", async (req: Request, res: Response) => {
    await deleteToken(await db(), extractToken(req))
    res.status(StatusCodes.NO_CONTENT).end()
  })
  routes.delete(
    "/auth/token/user/session",
    async (req: Request, res: Response) => {
      await deleteUserTokens(await db(), extractToken(req))
      res.status(StatusCodes.NO_CONTENT).end()
    }
  )

  // Participants
  routes.get("/participants", async (req: Request, res: Response) => {
    const u = await validateUser(req, await db())
    res.json(await getParticipantsSubset(await db(), u.accessGroup))
  })
  routes.post("/participants", async (req: Request, res: Response) => {
    const u = await validateUser(req, await db())
    await insertParticipants(
      await db(),
      decode(t.array(ParticipantV), req.body),
      u.accessGroup
    )
    res.status(StatusCodes.NO_CONTENT).end()
  })
  routes.delete("/participants", async (req: Request, res: Response) => {
    const u = await validateUser(req, await db())
    await deleteParticipant(
      await db(),
      decode(t.string, req.query.pid),
      u.accessGroup
    )
    res.status(StatusCodes.NO_CONTENT).end()
  })
  routes.put(
    "/participants/redcap/sync",
    async (req: Request, res: Response) => {
      await validateUser(req, await db())
      await syncRedcapParticipants(await db(), redcapConfig)
      res.status(StatusCodes.NO_CONTENT).end()
    }
  )
  routes.get(
    "/participants/redcap/sync",
    async (req: Request, res: Response) => {
      res.json(await getLastParticipantUpdate(await db()))
    }
  )

  // Redcap IDs
  routes.get("/redcap-id", async (req: Request, res: Response) => {
    const u = await validateUser(req, await db())
    res.json(await getRedcapIdSubset(await db(), u.accessGroup))
  })

  // Withdrawn
  routes.get("/withdrawn", async (req: Request, res: Response) => {
    const u = await validateUser(req, await db())
    res.json(await getWithdrawnSubset(await db(), u.accessGroup))
  })

  // Vaccination history
  routes.get("/vaccination", async (req: Request, res: Response) => {
    const u = await validateUser(req, await db())
    res.json(await getVaccinationSubset(await db(), u.accessGroup))
  })

  // Schedule
  routes.get("/schedule", async (req: Request, res: Response) => {
    const u = await validateUser(req, await db())
    res.json(await getScheduleSubset(await db(), u.accessGroup))
  })

  // Weekly survey
  routes.get("/weekly-survey", async (req: Request, res: Response) => {
    const u = await validateUser(req, await db())
    res.json(await getWeeklySurveySubset(await db(), u.accessGroup))
  })

  // Viruses
  routes.get("/virus", async (req: Request, res: Response) => {
    await validateUser(req, await db())
    res.json(await getViruses(await db()))
  })
  routes.post("/virus", async (req: Request, res: Response) => {
    await validateUnrestricted(req, await db())
    await insertViruses(await db(), decode(t.array(VirusV), req.body))
    res.status(StatusCodes.NO_CONTENT).end()
  })
  routes.delete("/virus/all", async (req: Request, res: Response) => {
    await validateUnrestricted(req, await db())
    await deleteAllViruses(await db())
    res.status(StatusCodes.NO_CONTENT).end()
  })

  // Serology
  routes.get("/serology", async (req: Request, res: Response) => {
    const u = await validateUser(req, await db())
    res.json(await getSerologySubset(await db(), u.accessGroup))
  })
  routes.post("/serology", async (req: Request, res: Response) => {
    await validateUnrestricted(req, await db())
    await insertSerology(await db(), decode(t.array(SerologyV), req.body))
    res.status(StatusCodes.NO_CONTENT).end()
  })
  routes.delete("/serology/all", async (req: Request, res: Response) => {
    await validateUnrestricted(req, await db())
    await deleteAllSerology(await db())
    res.status(StatusCodes.NO_CONTENT).end()
  })

  // Errors
  routes.use((err: Error, req: Request, res: Response, _next: any) => {
    if (err.message.startsWith("UNAUTHORIZED")) {
      res.status(StatusCodes.UNAUTHORIZED).json(err.message)
    } else if (err.message.startsWith("NOT FOUND")) {
      res.status(StatusCodes.NOT_FOUND).json(err.message)
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(err.message)
    }
  })
  return routes
}

function extractToken(req: Request): string {
  let token: string
  try {
    const header = decode(t.string, req.header("Authorization")).split(" ")
    token = decode(t.string, header[1])
  } catch (e) {
    throw Error("UNAUTHORIZED: failed to parse auth header")
  }
  return token
}

async function validateUser(req: Request, db: DB): Promise<User> {
  const token = extractToken(req)
  let u: User
  try {
    u = await getUserByToken(db, token)
  } catch (e) {
    if (e.message === "No data returned from the query.") {
      throw Error("UNAUTHORIZED: no user with the supplied valid token")
    }
    throw Error("UNAUTHORIZED: " + e.message)
  }
  return u
}

async function validateAdmin(req: Request, db: DB): Promise<User> {
  const u = await validateUser(req, db)
  if (u.accessGroup !== "admin") {
    throw Error("UNAUTHORIZED: insufficient access")
  }
  return u
}

async function validateUnrestricted(req: Request, db: DB): Promise<User> {
  const u = await validateUser(req, db)
  if (!["admin", "unrestricted"].includes(u.accessGroup)) {
    throw Error("UNAUTHORIZED: insufficient access")
  }
  return u
}
