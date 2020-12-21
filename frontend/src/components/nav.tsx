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
import ArrowForwardIosIcon from "@material-ui/icons/ArrowForwardIos"
import ArrowBackIosIcon from "@material-ui/icons/ArrowBackIos"
import Send from "@material-ui/icons/Send"
import Update from "@material-ui/icons/Update"
import PowerSettingsNewIcon from "@material-ui/icons/PowerSettingsNew"
import React, { ReactNode, useState } from "react"
import { Link, useRouteMatch } from "react-router-dom"
import { User } from "../lib/data"
import { useWindowSize } from "../lib/hooks"

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
      height: 50,
      display: "flex",
      alignItems: "center",
      borderBottom: `1px solid ${theme.palette.divider}`,
      "&>*": {
        flexShrink: 0,
      },
      "& .forward": {
        marginLeft: "auto",
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
  token,
}: {
  togglePalette: () => void
  user: User | null | undefined
  token?: string
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

function getApproximateLinkWidth(linkText: string): number {
  return 16 + linkText.length * 10
}

function getApproximateTextNavWidth(
  links: { name: string; link: string }[]
): number {
  return links
    .map((l) => l.name)
    .map(getApproximateLinkWidth)
    .reduce((s, a) => s + a, 0)
}

function findEnd(
  links: { name: string; link: string }[],
  desiredWidth: number,
  start: number,
  end: number
): number {
  const fullNavWidth =
    getApproximateTextNavWidth(links.slice(start, end)) +
    (start > 0 ? 48 : 0) +
    (end < links.length ? 48 : 0)
  if (start === end - 1 || fullNavWidth < desiredWidth || desiredWidth === 0) {
    return end
  }
  return findEnd(links, desiredWidth, start, end - 1)
}

export function SimpleNav({
  links,
  active,
}: {
  links: { name: string; link: string }[]
  active: (name: string) => boolean
}) {
  const windowSize = useWindowSize()
  const [start, setStart] = useState(0)
  const end = findEnd(links, windowSize.width, start, links.length)
  if (
    end === links.length &&
    start > 0 &&
    findEnd(links, windowSize.width, start - 1, links.length) === links.length
  ) {
    setStart(start - 1)
  }
  const classes = useStyles()
  return (
    <div className={classes.simpleNav}>
      {start > 0 ? (
        <IconButton onClick={(_) => setStart(start - 1)}>
          <ArrowBackIosIcon />
        </IconButton>
      ) : (
        <></>
      )}
      {links.slice(start, end).map(({ name, link }) => (
        <Button
          key={name}
          component={Link}
          to={`${link}`}
          className={active(name) ? "active" : ""}
        >
          {name}
        </Button>
      ))}
      {end < links.length ? (
        <IconButton onClick={(_) => setStart(start + 1)} className="forward">
          <ArrowForwardIosIcon />
        </IconButton>
      ) : (
        <></>
      )}
    </div>
  )
}
