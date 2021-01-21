import { Link as LinkRouter } from "react-router-dom"
import {
  createStyles,
  makeStyles,
  Theme,
  Link as LinkMaterial,
} from "@material-ui/core"
import { ReactNode } from "react"

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    link: {
      color:
        theme.palette.primary[theme.palette.type === "dark" ? "light" : "dark"],
    },
  })
)

export function LinkInternal({
  to,
  children,
}: {
  to: string
  children: ReactNode
}) {
  const classes = useStyles()
  return (
    <LinkMaterial className={classes.link} component={LinkRouter} to={to}>
      {children}
    </LinkMaterial>
  )
}

export function LinkExternal({
  href,
  children,
}: {
  href: string
  children: ReactNode
}) {
  const classes = useStyles()
  return (
    <LinkMaterial className={classes.link} href={href}>
      {children}
    </LinkMaterial>
  )
}
