import {
  Button,
  createStyles,
  IconButton,
  makeStyles,
  Theme,
} from "@material-ui/core"
import BrightnessMediumIcon from "@material-ui/icons/BrightnessMedium"
import People from "@material-ui/icons/People"
import Home from "@material-ui/icons/Home"
import React, { ReactNode } from "react"
import { Link } from "react-router-dom"
import { User } from "../lib/data"

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    nav: {
      height: 50,
      overflow: "auto",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      borderBottom: `1px solid ${theme.palette.divider}`,
    },
    simpleNav: {
      height: 40,
      display: "flex",
      alignItems: "center",
      borderBottom: `1px solid ${theme.palette.divider}`,
      "&>*": {
        flexShrink: 0,
      },
    },
  })
)

export default function Nav({
  togglePalette,
  user,
  token,
}: {
  togglePalette: () => void
  user: User | null | undefined
  token: string | null
}) {
  const classes = useStyles()
  return (
    <div className={classes.nav}>
      {/* LEFT */}
      <div>
        <AuthOnly user={user}>
          <IconButton component={Link} to={`/?token=${token}`}>
            <Home />
          </IconButton>
          <Button component={Link} to={`/tables?token=${token}`}>
            Tables
          </Button>
          <Button component={Link} to={`/plots?token=${token}`}>
            Plots
          </Button>
        </AuthOnly>
      </div>
      {/* CENTER */}
      <div></div>
      {/* RIGHT */}
      <div>
        <AuthOnly user={user} admin>
          <IconButton component={Link} to={`/users?token=${token}`}>
            <People />
          </IconButton>
        </AuthOnly>
        <IconButton onClick={(_) => togglePalette()}>
          <BrightnessMediumIcon />
        </IconButton>
      </div>
    </div>
  )
}

function AuthOnly({
  user,
  admin,
  children,
}: {
  user: User | null | undefined
  admin?: boolean
  children: ReactNode
}) {
  if (!user) {
    return <></>
  }
  if (admin && user.accessGroup !== "admin") {
    return <></>
  }
  return <>{children}</>
}

export function SimpleNav({
  links,
}: {
  links: { name: string; link: string }[]
}) {
  const classes = useStyles()
  return (
    <div className={classes.simpleNav}>
      {links.map(({ name, link }) => (
        <Button key={name} component={Link} to={`${link}`}>
          {name}
        </Button>
      ))}
    </div>
  )
}
