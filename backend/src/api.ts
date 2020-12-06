import { Router, Request, Response } from "express"
import httpStatus from "http-status-codes"
import { getUsers, DB } from "./db"

export function getRoutes(db: DB) {
  const routes = Router()
  routes.get("/update", (req: Request, res: Response) => {
    res.status(httpStatus.NO_CONTENT).end()
  })
  routes.get("/users", async (req: Request, res: Response) => {
    res.json(await getUsers(db))
  })
  return routes
}
