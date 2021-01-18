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
  Task,
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
  db: DB,
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
    await transaction(db, async (db) => {
      await validateAdmin(req, db)
      await reset(db, redcapConfig, {
        restoreTokens: decode(BooleanFromString, req.query.restoreTokens),
        tokenDaysToLive,
        firstAdmin: { email: firstAdminEmail, token: firstAdminToken },
      })
    })
    res.status(StatusCodes.NO_CONTENT).end()
  })

  // Users
  routes.get("/users", async (req: Request, res: Response) => {
    const us = await transaction(db, async (db) => {
      await validateAdmin(req, db)
      return await getUsers(db)
    })
    res.json(us)
  })
  routes.post("/users", async (req: Request, res: Response) => {
    await transaction(db, async (db) => {
      await validateAdmin(req, db)
      const us = decode(t.array(UserV), req.body)
      await insertUsers(db, us)
    })
    res.status(StatusCodes.NO_CONTENT).end()
  })
  routes.delete("/users", async (req: Request, res: Response) => {
    await transaction(db, async (db) => {
      await validateAdmin(req, db)
      await deleteUser(db, decode(t.string, req.query.email))
    })
    res.status(StatusCodes.NO_CONTENT).end()
  })
  routes.put("/users", async (req: Request, res: Response) => {
    await transaction(db, async (db) => {
      await validateAdmin(req, db)
      await updateUser(db, decode(UserV, req.body))
    })

    res.status(StatusCodes.NO_CONTENT).end()
  })
  routes.put("/users/redcap/sync", async (req: Request, res: Response) => {
    await transaction(db, async (db) => {
      await validateAdmin(req, db)
      await syncRedcapUsers(db, redcapConfig)
    })

    res.status(StatusCodes.NO_CONTENT).end()
  })
  routes.get("/users/redcap/sync", async (req: Request, res: Response) => {
    res.json(await transaction(db, getLastUserUpdate))
  })

  // Auth
  routes.post("/auth/token/send", async (req: Request, res: Response) => {
    const email = decode(t.string, req.query.email)
    const type = decode(TokenTypeV, req.query.type)
    const token = createToken(email, tokenDaysToLive, type)
    await transaction(db, async (db) => await insertTokens(db, [token]))
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
    const u = await transaction(db, async (db) => await validateUser(req, db))
    res.json(u)
  })
  routes.put("/auth/token", async (req: Request, res: Response) => {
    const tok = await transaction(
      db,
      async (db) =>
        await refreshSessionToken(db, extractToken(req), tokenDaysToLive)
    )
    res.json(tok)
  })
  routes.delete("/auth/token", async (req: Request, res: Response) => {
    await transaction(
      db,
      async (db) => await deleteToken(db, extractToken(req))
    )
    res.status(StatusCodes.NO_CONTENT).end()
  })
  routes.delete(
    "/auth/token/user/session",
    async (req: Request, res: Response) => {
      await transaction(
        db,
        async (db) => await deleteUserTokens(db, extractToken(req))
      )
      res.status(StatusCodes.NO_CONTENT).end()
    }
  )

  // Participants
  routes.get("/participants", async (req: Request, res: Response) => {
    const parts = await transaction(db, async (db) => {
      const u = await validateUser(req, db)
      return await getParticipantsSubset(db, u.accessGroup)
    })
    res.json(parts)
  })
  routes.post("/participants", async (req: Request, res: Response) => {
    await transaction(db, async (db) => {
      const u = await validateUser(req, db)
      await insertParticipants(
        db,
        decode(t.array(ParticipantV), req.body),
        u.accessGroup
      )
    })
    res.status(StatusCodes.NO_CONTENT).end()
  })
  routes.delete("/participants", async (req: Request, res: Response) => {
    await transaction(db, async (db) => {
      const u = await validateUser(req, db)
      await deleteParticipant(
        db,
        decode(t.string, req.query.pid),
        u.accessGroup
      )
    })
    res.status(StatusCodes.NO_CONTENT).end()
  })
  routes.put(
    "/participants/redcap/sync",
    async (req: Request, res: Response) => {
      await transaction(db, async (db) => {
        await validateUser(req, db)
        await syncRedcapParticipants(db, redcapConfig)
      })
      res.status(StatusCodes.NO_CONTENT).end()
    }
  )
  routes.get(
    "/participants/redcap/sync",
    async (req: Request, res: Response) => {
      res.json(await transaction(db, getLastParticipantUpdate))
    }
  )

  // Redcap IDs
  routes.get("/redcap-id", async (req: Request, res: Response) => {
    const ids = await transaction(db, async (db) => {
      const u = await validateUser(req, db)
      return await getRedcapIdSubset(db, u.accessGroup)
    })
    res.json(ids)
  })

  // Withdrawn
  routes.get("/withdrawn", async (req: Request, res: Response) => {
    const withdrawns = await transaction(db, async (db) => {
      const u = await validateUser(req, db)
      return await getWithdrawnSubset(db, u.accessGroup)
    })
    res.json(withdrawns)
  })

  // Vaccination history
  routes.get("/vaccination", async (req: Request, res: Response) => {
    const vacs = await transaction(db, async (db) => {
      const u = await validateUser(req, db)
      return await getVaccinationSubset(db, u.accessGroup)
    })
    res.json(vacs)
  })

  // Schedule
  routes.get("/schedule", async (req: Request, res: Response) => {
    const scheds = await transaction(db, async (db) => {
      const u = await validateUser(req, db)
      return await getScheduleSubset(db, u.accessGroup)
    })
    res.json(scheds)
  })

  // Weekly survey
  routes.get("/weekly-survey", async (req: Request, res: Response) => {
    const weeklySurveys = await transaction(db, async (db) => {
      const u = await validateUser(req, db)
      return await getWeeklySurveySubset(db, u.accessGroup)
    })
    res.json(weeklySurveys)
  })

  // Viruses
  routes.get("/virus", async (req: Request, res: Response) => {
    const viruses = await transaction(db, async (db) => {
      await validateUser(req, db)
      return await getViruses(db)
    })
    res.json(viruses)
  })
  routes.post("/virus", async (req: Request, res: Response) => {
    await transaction(db, async (db) => {
      await validateUnrestricted(req, db)
      await insertViruses(db, decode(t.array(VirusV), req.body))
    })
    res.status(StatusCodes.NO_CONTENT).end()
  })
  routes.delete("/virus/all", async (req: Request, res: Response) => {
    await transaction(db, async (db) => {
      await validateUnrestricted(req, db)
      await deleteAllViruses(db)
    })
    res.status(StatusCodes.NO_CONTENT).end()
  })

  // Serology
  routes.get("/serology", async (req: Request, res: Response) => {
    const serology = await transaction(db, async (db) => {
      const u = await validateUser(req, db)
      return await getSerologySubset(db, u.accessGroup)
    })
    res.json(serology)
  })
  routes.post("/serology", async (req: Request, res: Response) => {
    await transaction(db, async (db) => {
      await validateUnrestricted(req, db)
      await insertSerology(db, decode(t.array(SerologyV), req.body))
    })
    res.status(StatusCodes.NO_CONTENT).end()
  })
  routes.delete("/serology/all", async (req: Request, res: Response) => {
    await transaction(db, async (db) => {
      await validateUnrestricted(req, db)
      await deleteAllSerology(db)
    })
    res.status(StatusCodes.NO_CONTENT).end()
  })

  // Errors
  routes.use((err: Error, req: Request, res: Response, _next: any) => {
    if (err.message.startsWith("UNAUTHORIZED")) {
      res.status(StatusCodes.UNAUTHORIZED).json(err.message)
    } else if (err.message.startsWith("NOT FOUND")) {
      res.status(StatusCodes.NOT_FOUND).json(err.message)
    } else if (err.message.startsWith("connect ECONNREFUSED")) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json("DB connection failed")
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

async function validateUser(req: Request, db: Task): Promise<User> {
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

async function validateAdmin(req: Request, db: Task): Promise<User> {
  const u = await validateUser(req, db)
  if (u.accessGroup !== "admin") {
    throw Error("UNAUTHORIZED: insufficient access")
  }
  return u
}

async function validateUnrestricted(req: Request, db: Task): Promise<User> {
  const u = await validateUser(req, db)
  if (!["admin", "unrestricted"].includes(u.accessGroup)) {
    throw Error("UNAUTHORIZED: insufficient access")
  }
  return u
}

async function transaction<T>(db: DB, cb: (t: Task) => T): Promise<T> {
  return await db.tx(cb)
}
