import {
  Button,
  createStyles,
  Divider,
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
      "& .active": {
        backgroundColor: theme.palette.primary[theme.palette.type],
      },
    },
    simpleNav: {
      height: 50,
      display: "flex",
      alignItems: "center",
      borderBottom: `1px solid ${theme.palette.divider}`,
      "&>*": {
        flexShrink: 0,
      },
      "& .active": {
        backgroundColor: theme.palette.primary[theme.palette.type],
      },
    },
    divider: {
      marginLeft: 5,
      color: theme.palette.divider,
      width: 2,
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
          <IconButton
            component={Link}
            to={`/`}
            className={matchRes === null ? "active" : ""}
          >
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
          <IconButton
            component={Link}
            to={`/users`}
            className={matchRes?.params.location === "users" ? "active" : ""}
          >
            <People />
          </IconButton>
        </AuthOnly>
        <AuthOnly user={user}>
          <IconButton
            component={Link}
            to={`/update`}
            className={matchRes?.params.location === "update" ? "active" : ""}
          >
            <Update />
          </IconButton>
        </AuthOnly>
        <IconButton
          component={Link}
          to={`/get-link`}
          className={matchRes?.params.location === "get-link" ? "active" : ""}
        >
          <Send />
        </IconButton>
        <Divider orientation="vertical" flexItem className={classes.divider} />
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
  className,
}: {
  links: { name: string; link: string }[]
  active: (name: string) => boolean
  className?: string
}) {
  const classes = useStyles()
  return (
    <div className={`${classes.simpleNav} ${className ?? ""}`}>
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
