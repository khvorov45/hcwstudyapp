import { Router, Request, Response } from "express"
import { getUsers, DB, getLastUpdate } from "./db"

export function getRoutes(db: DB) {
  const routes = Router()
  routes.get("/update", async (req: Request, res: Response) => {
    res.json(await getLastUpdate(db))
  })
  routes.get("/users", async (req: Request, res: Response) => {
    res.json(await getUsers(db))
  })
  return routes
}
