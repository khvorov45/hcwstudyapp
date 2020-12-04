import { Router, Request, Response } from "express"
import httpStatus from "http-status-codes"

export function getRoutes() {
  const routes = Router()
  routes.get("/update", (req: Request, res: Response) => {
    res.status(httpStatus.NO_CONTENT).end()
  })
  return routes
}
