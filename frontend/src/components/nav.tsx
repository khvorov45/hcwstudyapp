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
import GitHubIcon from "@material-ui/icons/GitHub"
import Send from "@material-ui/icons/Send"
import Update from "@material-ui/icons/Update"
import PowerSettingsNewIcon from "@material-ui/icons/PowerSettingsNew"
import React, { ReactNode } from "react"
import { Link, useRouteMatch } from "react-router-dom"
import { User } from "../lib/data"

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    nav: {
      height: 50,
      overflowX: "scroll",
      overflowY: "hidden",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      borderBottom: `1px solid ${theme.palette.divider}`,
      "&>div": {
        display: "flex",
        alignItems: "center",
      },
    },
    simpleNav: {
      overflowX: "scroll",
      overflowY: "hidden",
      height: 50,
      display: "flex",
      alignItems: "end",
      borderBottom: `1px solid ${theme.palette.divider}`,
      "&>*": {
        flexShrink: 0,
      },
      "& .active": {
        backgroundColor: theme.palette.primary[theme.palette.type],
      },
    },
  })
)

export default function Nav({
  togglePalette,
  user,
}: {
  togglePalette: () => void
  user: User | null | undefined
}) {
  const classes = useStyles()
  const matchRes = useRouteMatch<{ location: string }>({ path: "/:location" })
  return (
    <div className={classes.nav}>
      {/* LEFT */}
      <div>
        <AuthOnly user={user}>
          <IconButton component={Link} to={`/`}>
            <Home />
          </IconButton>
          <SimpleNav
            links={["tables", "plots"].map((l) => ({
              name: l,
              link: `/${l}`,
            }))}
            active={(l) => matchRes?.params.location === l}
          />
        </AuthOnly>
      </div>
      {/* CENTER */}
      <div></div>
      {/* RIGHT */}
      <div>
        <AuthOnly user={user} admin>
          <IconButton component={Link} to={`/users`}>
            <People />
          </IconButton>
        </AuthOnly>
        <AuthOnly user={user}>
          <IconButton component={Link} to={`/update`}>
            <Update />
          </IconButton>
        </AuthOnly>
        <IconButton component={Link} to={`/get-link`}>
          <Send />
        </IconButton>
        <AuthOnly user={user}>
          <IconButton>
            <PowerSettingsNewIcon />
          </IconButton>
        </AuthOnly>
        <a href="https://github.com/khvorov45/hcwstudyapp">
          <IconButton>
            <GitHubIcon />
          </IconButton>
        </a>
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
  active,
}: {
  links: { name: string; link: string }[]
  active: (name: string) => boolean
}) {
  const classes = useStyles()
  return (
    <div className={classes.simpleNav}>
      {links.map(({ name, link }) => (
        <Button
          key={name}
          component={Link}
          to={`${link}`}
          className={active(name) ? "active" : ""}
        >
          {name}
        </Button>
      ))}
    </div>
  )
}
