import { makeStyles, Theme, createStyles } from "@material-ui/core"
import { ReactNode } from "react"

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    buttonArray: {
      display: "flex",
      alignItems: "center",
    },
  })
)

export function ButtonArray({ children }: { children: ReactNode }) {
  const classes = useStyles()
  return <div className={classes.buttonArray}>{children}</div>
}
