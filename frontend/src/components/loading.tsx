import { createStyles, makeStyles, Theme } from "@material-ui/core"
import { ReactNode } from "react"

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    iconButtonContainer: {
      width: 48,
      height: 48,
    },
  })
)

export function IconButtonContainer({ children }: { children: ReactNode }) {
  const classes = useStyles()
  return <div className={classes.iconButtonContainer}>{children}</div>
}
