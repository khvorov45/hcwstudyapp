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
import { IconButtonContainer } from "./loading"

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

export default function GetLink() {
  const [email, setEmail] = useState("")

  const sendEmail = useAsyncCallback(async () => {
    return await apiReq({
      method: "POST",
      path: `auth/token/send`,
      query: { email: email },
      success: StatusCodes.NO_CONTENT,
      failure: [StatusCodes.NOT_FOUND],
      validator: t.unknown,
    })
  })

  let errMsg = sendEmail.error?.message
  if (errMsg?.startsWith("NOT FOUND")) {
    errMsg = `No user with the given email.
    Make sure it's the one associated with the REDCap account`
  }

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
          onChange={(e) => {
            setEmail(e.target.value)
            sendEmail.reset()
          }}
          type="email"
          placeholder="name@example.org"
          id="email"
          error={sendEmail.status === "error"}
          helperText={errMsg}
        />
        <IconButtonContainer status={sendEmail.status}>
          <IconButton
            onClick={(e) => {
              e.preventDefault()
              sendEmail.execute()
            }}
            type="submit"
            disabled={email.length === 0 || sendEmail.loading}
          >
            <Send />
          </IconButton>
        </IconButtonContainer>
      </form>
    </div>
  )
}
