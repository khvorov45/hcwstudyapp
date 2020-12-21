import { makeStyles, Theme, createStyles, Button } from "@material-ui/core"
import { useAsync, useAsyncCallback } from "react-async-hook"
import * as t from "io-ts"
import { DateFromISOString } from "io-ts-types"
import StatusCodes from "http-status-codes"
import { apiReq } from "../lib/api"

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    update: {
      padding: 20,
      fontSize: "large",
      display: "flex",
      justifyContent: "center",
    },
    updateCard: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      "& .syncButton": {
        paddingTop: 5,
      },
    },
  })
)

export default function Update({ token }: { token?: string }) {
  const classes = useStyles()
  async function participantsUpdateTimeFetcher() {
    return await apiReq({
      method: "GET",
      path: "participants/redcap/sync",
      success: StatusCodes.OK,
      failure: [],
      validator: t.union([DateFromISOString, t.null]),
    })
  }
  async function participantsSync() {
    return await apiReq({
      method: "PUT",
      path: "participants/redcap/sync",
      token: token,
      success: StatusCodes.OK,
      failure: [StatusCodes.UNAUTHORIZED],
      validator: t.void,
    })
  }
  return (
    <div className={classes.update}>
      <UpdateCard
        title="Last REDCap participants sync"
        token={token}
        timestampFetcher={participantsUpdateTimeFetcher}
        syncFunction={participantsSync}
      />
    </div>
  )
}

function UpdateCard({
  title,
  timestampFetcher,
  syncFunction,
}: {
  token?: string
  title: string
  timestampFetcher: () => Promise<Date | null>
  syncFunction: () => Promise<void>
}) {
  const lastUpdateTimestamp = useAsync(timestampFetcher, [])
  const syncFunctionResult = useAsyncCallback(syncFunction)
  const classes = useStyles()
  function formatDate(d?: Date | null) {
    if (!d) {
      return "never"
    }
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}
    ${d.getHours()}:${d.getMinutes()}`
  }
  return (
    <div className={classes.updateCard}>
      <div>{title}</div>
      <div>{formatDate(lastUpdateTimestamp.result)}</div>
      <div className="syncButton">
        <Button
          variant="outlined"
          onClick={syncFunctionResult.execute}
          disabled={syncFunctionResult.loading}
        >
          sync
        </Button>
      </div>
    </div>
  )
}
