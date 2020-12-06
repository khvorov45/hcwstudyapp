import { Router, Request, Response } from "express"
import randomString from "crypto-random-string"
import SHA512 from "crypto-js/sha512"
import * as t from "io-ts"
import StatusCodes from "http-status-codes"
import { getUsers, DB, getLastUpdate, insertUser, deleteUser } from "./db"
import { UserV } from "./data"
import { decode } from "./io"

export function getRoutes(db: DB) {
  const routes = Router()
  routes.get("/update", async (req: Request, res: Response) => {
    res.json(await getLastUpdate(db))
  })
  routes.get("/users", async (req: Request, res: Response) => {
    res.json(await getUsers(db))
  })
  routes.post("/users", async (req: Request, res: Response) => {
    const token = generateToken()
    const u = decode(UserV, {
      email: req.body.email,
      accessGroup: req.body.accessGroup,
      tokenhash: hash(token),
    })
    await insertUser(db, u)
    res.json(token)
  })
  routes.delete("/users", async (req: Request, res: Response) => {
    await deleteUser(db, decode(t.string, req.query.email))
    res.status(StatusCodes.NO_CONTENT).end()
  })
  return routes
}

function generateToken(): string {
  return randomString({ length: 40, type: "url-safe" })
}

function hash(s: string): string {
  return SHA512(s).toString()
}
