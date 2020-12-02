import express, { Request, Response } from "express"
import httpStatus from "http-status-codes"

const app = express()

app.get("/", (req: Request, res: Response) => {
  res.status(httpStatus.OK).send("Hello World!")
})

const PORT = 8000
app.listen(PORT, () => {
  console.log(`server started on port ${PORT}`)
})
