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
import { TokenType } from "../lib/data"
import ScreenHeight from "./screen-height"

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    emailForm: {
      display: "flex",
      flexDirection: "column",
      padding: 20,
      fontSize: "large",
      "&>*": {
        padding: 10,
        display: "flex",
      },
    },
    info: {
      maxWidth: 500,
      fontSize: "medium",
    },
  })
)

export default function Email() {
  return (
    <ScreenHeight heightTaken={50}>
      <div style={{ display: "flex", flexWrap: "wrap" }}>
        <EmailForm tokenType="session" />
        <EmailForm tokenType="api" />
      </div>
    </ScreenHeight>
  )
}

function EmailForm({ tokenType }: { tokenType: TokenType }) {
  const [email, setEmail] = useState("")

  const sendEmail = useAsyncCallback(async () => {
    return await apiReq({
      method: "POST",
      path: `auth/token/send`,
      query: { email: email, type: tokenType },
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
    <div className={classes.emailForm}>
      <div>
        Enter email below to generate{" "}
        {tokenType === "session" ? "access link" : "API token"}
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
      <div className={classes.info}>
        {tokenType === "session"
          ? `Access links are single-use. They log you in on one device. You can
          generate multiple links for multiple devices and stay logged in on all
          of them.`
          : "API Tokens don't expire."}
      </div>
    </div>
  )
}
