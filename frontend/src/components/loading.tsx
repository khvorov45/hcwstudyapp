import {
  CircularProgress,
  createStyles,
  makeStyles,
  Theme,
} from "@material-ui/core"
import Check from "@material-ui/icons/Check"
import { ReactNode } from "react"
import { AsyncStateStatus } from "react-async-hook"

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
