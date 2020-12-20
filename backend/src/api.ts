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
  refreshToken,
} from "./db"
import { ParticipantV, Token, TokenHashed, User, UserV } from "./data"
import { decode } from "./io"
import { createToken, generateToken } from "./auth"
import { RedcapConfig } from "./redcap"
import { Emailer, emailToken } from "./email"

export function getRoutes(
  db: DB,
  redcapConfig: RedcapConfig,
  emailConfig: {
    emailer: Emailer
    linkPrefix: string
  },
  tokenDaysToLive: number
) {
  const routes = Router()

  // Routes

  // Users
  routes.get("/users", async (req: Request, res: Response) => {
    await validateAdmin(req, db)
    res.json(await getUsers(db))
  })
  routes.post("/users", async (req: Request, res: Response) => {
    await validateAdmin(req, db)
    const us = decode(t.array(UserV), req.body)
    await insertUsers(db, us)
    res.status(StatusCodes.NO_CONTENT).end()
  })
  routes.delete("/users", async (req: Request, res: Response) => {
    await validateAdmin(req, db)
    await deleteUser(db, decode(t.string, req.query.email))
    res.status(StatusCodes.NO_CONTENT).end()
  })
  routes.put("/users/redcap/sync", async (req: Request, res: Response) => {
    await validateAdmin(req, db)
    await syncRedcapUsers(db, redcapConfig)
    res.status(StatusCodes.NO_CONTENT).end()
  })
  routes.get("/users/redcap/sync", async (req: Request, res: Response) => {
    res.json(await getLastUserUpdate(db))
  })

  // Auth
  routes.post("/auth/token/send", async (req: Request, res: Response) => {
    const email = decode(t.string, req.query.email)
    const token = createToken(email, tokenDaysToLive)
    await insertTokens(db, [token])
    await emailToken(emailConfig.emailer, {
      email,
      token: token.token,
      linkPrefix: emailConfig.linkPrefix,
    })
    res.status(StatusCodes.NO_CONTENT).end()
  })
  routes.get("/auth/token/verify", async (req: Request, res: Response) => {
    const u = await validateUser(req, db)
    res.json({ email: u.email, accessGroup: u.accessGroup })
  })
  routes.put("/auth/token", async (req: Request, res: Response) => {
    await refreshToken(db, extractToken(req), tokenDaysToLive)
    res.status(StatusCodes.NO_CONTENT).end()
  })

  // Participants
  routes.get("/participants", async (req: Request, res: Response) => {
    const u = await validateUser(req, db)
    res.json(await getParticipantsSubset(db, u.accessGroup))
  })
  routes.post("/participants", async (req: Request, res: Response) => {
    const u = await validateUser(req, db)
    await insertParticipants(
      db,
      decode(t.array(ParticipantV), req.body),
      u.accessGroup
    )
    res.status(StatusCodes.NO_CONTENT).end()
  })
  routes.delete("/participants", async (req: Request, res: Response) => {
    const u = await validateUser(req, db)
    await deleteParticipant(db, decode(t.string, req.query.pid), u.accessGroup)
    res.status(StatusCodes.NO_CONTENT).end()
  })
  routes.put(
    "/participants/redcap/sync",
    async (req: Request, res: Response) => {
      await validateUser(req, db)
      await syncRedcapParticipants(db, redcapConfig)
      res.status(StatusCodes.NO_CONTENT).end()
    }
  )
  routes.get(
    "/participants/redcap/sync",
    async (req: Request, res: Response) => {
      res.json(await getLastParticipantUpdate(db))
    }
  )

  // Redcap IDs
  routes.get("/redcap-id", async (req: Request, res: Response) => {
    const u = await validateUser(req, db)
    res.json(await getRedcapIdSubset(db, u.accessGroup))
  })

  // Withdrawn
  routes.get("/withdrawn", async (req: Request, res: Response) => {
    const u = await validateUser(req, db)
    res.json(await getWithdrawnSubset(db, u.accessGroup))
  })

  // Vaccination history
  routes.get("/vaccination", async (req: Request, res: Response) => {
    const u = await validateUser(req, db)
    res.json(await getVaccinationSubset(db, u.accessGroup))
  })

  // Schedule
  routes.get("/schedule", async (req: Request, res: Response) => {
    const u = await validateUser(req, db)
    res.json(await getScheduleSubset(db, u.accessGroup))
  })

  // Weekly survey
  routes.get("/weekly-survey", async (req: Request, res: Response) => {
    const u = await validateUser(req, db)
    res.json(await getWeeklySurveySubset(db, u.accessGroup))
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
