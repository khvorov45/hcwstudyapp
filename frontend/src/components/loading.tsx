import {
  CircularProgress,
  createStyles,
  makeStyles,
  Theme,
} from "@material-ui/core"
import Check from "@material-ui/icons/Check"
import { ReactNode } from "react"
import { AsyncStateStatus } from "react-async-hook"
import { BeatLoader } from "react-spinners"

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    iconButtonContainer: {
      width: 48,
      height: 48,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
  })
)

export function IconButtonContainer({
  status,
  repeatable,
  children,
}: {
  status: AsyncStateStatus
  repeatable?: boolean
  children: ReactNode
}) {
  let onDisplay
  if (status === "loading") {
    onDisplay = <CircularProgress />
  } else if (status === "success" && !repeatable) {
    onDisplay = <Check />
  } else {
    onDisplay = children
  }
  const classes = useStyles()
  return <div className={classes.iconButtonContainer}>{onDisplay}</div>
}

export function PageContainer({
  children,
  loading,
}: {
  children: ReactNode
  loading: boolean
}) {
  return (
    <div>
      {loading ? (
        <BeatLoader
          color="gray"
          css={"display: flex; justify-content: center; margin-top: 20px"}
          size={30}
        />
      ) : (
        children
      )}
    </div>
  )
}
