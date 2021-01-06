import {
  makeStyles,
  Theme,
  createStyles,
  Button,
  FormHelperText,
} from "@material-ui/core"
import { useAsync, useAsyncCallback } from "react-async-hook"
import * as t from "io-ts"
import { DateFromISOString } from "io-ts-types"
import StatusCodes from "http-status-codes"
import { apiReq } from "../lib/api"
import { BeatLoader } from "react-spinners"
import { AuthOnly } from "./auth"
import { User } from "../lib/data"

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    update: {
      padding: 20,
      fontSize: "large",
      display: "flex",
      justifyContent: "center",
      flexWrap: "wrap",
      "&>*": {
        margin: 10,
      },
    },
    updateCard: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      "& .syncButton": {
        marginTop: 5,
        width: 110,
        height: 40,
      },
    },
  })
)

export default function Settings({
  token,
  user,
}: {
  token?: string
  user?: User
}) {
  return <Update token={token} user={user} />
}

function Update({ token, user }: { token?: string; user?: User }) {
  const classes = useStyles()
  async function updateTimeFetcher(path: "participants" | "users") {
    return await apiReq({
      method: "GET",
      path:
        path === "participants"
          ? "participants/redcap/sync"
          : "users/redcap/sync",
      success: StatusCodes.OK,
      failure: [],
      validator: t.union([DateFromISOString, t.null]),
    })
  }
  async function dataSync(path: "participants" | "users") {
    return await apiReq({
      method: "PUT",
      path:
        path === "participants"
          ? "participants/redcap/sync"
          : "users/redcap/sync",
      token: token,
      success: StatusCodes.NO_CONTENT,
      failure: [StatusCodes.UNAUTHORIZED],
      validator: t.void,
    })
  }
  return (
    <div className={classes.update}>
      <UpdateCard
        title="Last REDCap participants sync"
        token={token}
        timestampFetcher={async () => await updateTimeFetcher("participants")}
        syncFunction={async () => await dataSync("participants")}
      />
      <AuthOnly admin user={user}>
        <UpdateCard
          title="Last REDCap users sync"
          token={token}
          timestampFetcher={async () => await updateTimeFetcher("users")}
          syncFunction={async () => await dataSync("users")}
        />
      </AuthOnly>
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
    function formatDoubleDigit(d: number): string {
      return d.toString().padStart(2, "0")
    }
    return `${d.getFullYear()}-${formatDoubleDigit(
      d.getMonth() + 1
    )}-${formatDoubleDigit(d.getDate())}
    ${formatDoubleDigit(d.getHours())}:${formatDoubleDigit(d.getMinutes())}`
  }
  return (
    <div className={classes.updateCard}>
      <div>{title}</div>
      <div>{formatDate(lastUpdateTimestamp.result)}</div>
      <FormHelperText error>
        {lastUpdateTimestamp.error?.message}
      </FormHelperText>
      <Button
        variant="outlined"
        onClick={() =>
          syncFunctionResult
            .execute()
            .then((_) => lastUpdateTimestamp.execute())
            // These errors should be on syncFunctionResult object, no need
            // to handle them here
            .catch((e) => {})
        }
        disabled={syncFunctionResult.loading}
        className="syncButton"
      >
        {syncFunctionResult.loading ? (
          <BeatLoader color="gray" css={"display: flex"} />
        ) : (
          "sync now"
        )}
      </Button>
      <FormHelperText error>{syncFunctionResult.error?.message}</FormHelperText>
    </div>
  )
}
