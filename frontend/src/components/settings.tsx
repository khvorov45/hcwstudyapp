import {
  makeStyles,
  Theme,
  createStyles,
  Button,
  FormHelperText,
  ButtonGroup,
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
    settings: {
      display: "flex",
      flexDirection: "column",
      marginLeft: 10,
      marginTop: 10,
      "&>*": {
        marginBottom: 10,
      },
    },
    selector: {
      width: 200,
      display: "flex",
      flexDirection: "column",
      "& .active": {
        background: theme.palette.primary[theme.palette.type],
      },
    },
    update: {
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      flexWrap: "wrap",
    },
    updateCards: {
      display: "flex",
      "&>*": {
        paddingRight: 20,
      },
    },
    updateCard: {
      display: "flex",
      flexDirection: "column",
      "& .syncButton": {
        marginTop: 5,
        width: 110,
        height: 40,
      },
    },
    title: {
      fontWeight: "bold",
      fontSize: "large",
    },
    subtitle: {
      fontWeight: "bold",
      fontSize: "medium",
    },
  })
)

export default function Settings({
  token,
  user,
  withdrawn,
  onWithdrawnChange,
}: {
  token?: string
  user?: User
  withdrawn: "yes" | "no" | "any"
  onWithdrawnChange: (n: "yes" | "no" | "any") => void
}) {
  const classes = useStyles()
  return (
    <div className={classes.settings}>
      <Update token={token} user={user} />
      <Selector
        title="Withdrawn"
        value={withdrawn}
        opts={["yes", "no", "any"]}
        onChange={onWithdrawnChange}
      />
    </div>
  )
}

function Selector<T extends string>({
  title,
  value,
  opts,
  onChange,
}: {
  title: string
  value: T
  opts: T[]
  onChange: (a: T) => void
}) {
  const classes = useStyles()
  return (
    <div className={classes.selector}>
      <div className={classes.subtitle}>{title}</div>
      <ButtonGroup>
        {opts.map((o) => (
          <Button
            key={o}
            className={value === o ? "active" : ""}
            onClick={(_) => onChange(o)}
          >
            {o}
          </Button>
        ))}
      </ButtonGroup>
    </div>
  )
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
      <div className={classes.title}>REDCap sync</div>
      <div className={classes.updateCards}>
        <UpdateCard
          title="Participants"
          token={token}
          timestampFetcher={async () => await updateTimeFetcher("participants")}
          syncFunction={async () => await dataSync("participants")}
        />
        <AuthOnly admin user={user}>
          <UpdateCard
            title="Users"
            token={token}
            timestampFetcher={async () => await updateTimeFetcher("users")}
            syncFunction={async () => await dataSync("users")}
          />
        </AuthOnly>
      </div>
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
      <div className={classes.subtitle}>{title}</div>
      <div>{"Last: " + formatDate(lastUpdateTimestamp.result)}</div>
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
