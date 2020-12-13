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
  getUserByTokenhash,
  insertParticipants,
  getParticipantsSubset,
  deleteParticipant,
  syncRedcapUsers,
  updateUserToken,
  syncRedcapParticipants,
  getLastUserUpdate,
  getVaccination,
} from "./db"
import { ParticipantV, User, UserV } from "./data"
import { decode } from "./io"
import { generateToken, hash } from "./auth"
import { RedcapConfig } from "./redcap"
import { Emailer, emailToken } from "./email"

export function getRoutes(
  db: DB,
  redcapConfig: RedcapConfig,
  emailConfig: {
    emailer: Emailer
    linkPrefix: string
  }
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
    const token = generateToken()
    await updateUserToken(db, { email, token })
    await emailToken(emailConfig.emailer, {
      email,
      token,
      linkPrefix: emailConfig.linkPrefix,
    })
    res.status(StatusCodes.NO_CONTENT).end()
  })
  routes.get("/auth/token/verify", async (req: Request, res: Response) => {
    const u = await validateUser(req, db)
    res.json({ email: u.email, accessGroup: u.accessGroup })
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
    await validateUser(req, db)
    await deleteParticipant(db, decode(t.string, req.query.redcapRecordId))
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

  // Vaccination history
  routes.get("/vaccination-history", async (req: Request, res: Response) => {
    await validateUser(req, db)
    res.json(await getVaccination(db))
  })

  // Errors
  routes.use((err: Error, req: Request, res: Response, _next: any) => {
    if (err.message.startsWith("UNAUTHORIZED")) {
      res.status(StatusCodes.UNAUTHORIZED).json(err.message)
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(err.message)
    }
  })
  return routes
}

async function validateUser(req: Request, db: DB): Promise<User> {
  let token: string
  try {
    const header = decode(t.string, req.header("Authorization")).split(" ")
    token = decode(t.string, header[1])
  } catch (e) {
    throw Error("UNAUTHORIZED: failed to parse auth header")
  }
  let u: User
  try {
    u = await getUserByTokenhash(db, hash(token))
  } catch (e) {
    if (e.message === "No data returned from the query.") {
      throw Error("UNAUTHORIZED: no user with the supplied token")
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
