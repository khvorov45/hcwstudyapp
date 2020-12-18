import {
  createStyles,
  IconButton,
  makeStyles,
  TextField,
  Theme,
} from "@material-ui/core"
import Send from "@material-ui/icons/Send"
import React, { useState } from "react"
import { apiReq } from "../lib/api"
import * as t from "io-ts"
import StatusCodes from "http-status-codes"
import { useAsyncCallback } from "react-async-hook"

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    getLink: {
      display: "flex",
      flexDirection: "column",
      padding: 20,
      fontSize: "large",
      "&>*": {
        padding: 10,
        display: "flex",
        justifyContent: "center",
      },
    },
  })
)

export default function GetLink({ token }: { token: string | null }) {
  const [email, setEmail] = useState("")

  const sendEmail = useAsyncCallback(async () => {
    return await apiReq({
      method: "POST",
      path: `auth/token/send`,
      query: { email: email },
      token: token,
      success: StatusCodes.OK,
      failure: [],
      validator: t.unknown,
    })
  })

  const classes = useStyles()
  return (
    <div className={classes.getLink}>
      <div>Please use the given link for access</div>
      <div>
        If you don't have a link, enter your email below and a new one will be
        sent to you
      </div>
      <form>
        <TextField
          label="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          placeholder="name@example.org"
          id="email"
        />
        <IconButton
          onClick={(e) => {
            e.preventDefault()
            sendEmail.execute()
          }}
          type="submit"
          disabled={email.length === 0}
        >
          <Send />
        </IconButton>
      </form>
    </div>
  )
}
