import { Router, Request, Response } from "express"

export function getRoutes() {
  const routes = Router()
  routes.get("/update", (req: Request, res: Response) => {
    res.send("update")
  })
  return routes
}
