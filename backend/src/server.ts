import express, { Request, Response } from "express"
import httpStatus from "http-status-codes"
import { BACKEND_PORT } from "./config"

const app = express()

app.get("/", (req: Request, res: Response) => {
  res.status(httpStatus.OK).send("Hello World!")
})

app.listen(BACKEND_PORT, () => {
  console.log(`server started on port ${BACKEND_PORT}`)
})
