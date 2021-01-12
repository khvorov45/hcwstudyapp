import {
  Button,
  createStyles,
  Dialog,
  Divider,
  IconButton,
  makeStyles,
  Popover,
  Theme,
} from "@material-ui/core"
import BrightnessMediumIcon from "@material-ui/icons/BrightnessMedium"
import People from "@material-ui/icons/People"
import Home from "@material-ui/icons/Home"
import GitHubIcon from "@material-ui/icons/GitHub"
import Send from "@material-ui/icons/Send"
import SettingsIcon from "@material-ui/icons/Settings"
import PowerSettingsNewIcon from "@material-ui/icons/PowerSettingsNew"
import { Icon } from "@iconify/react"
import apiIcon from "@iconify/icons-mdi/api"
import tableOutlined from "@iconify/icons-ant-design/table-outlined"
import bxBarChart from "@iconify/icons-bx/bx-bar-chart"
import React, { useRef, useState } from "react"
import { Link, useRouteMatch } from "react-router-dom"
import { User } from "../lib/data"
import { AuthOnly } from "./auth"
import Settings from "./settings"

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
      alignItems: "flex-start",
      borderBottom: `1px solid ${theme.palette.divider}`,
      scrollBehavior: "smooth",
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
    logout: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      "& .title": {
        fontSize: "medium",
        fontWeight: "bold",
      },
      "& .button": {
        backgroundColor: theme.palette.error[theme.palette.type],
      },
      "&>*": {
        margin: 5,
      },
    },
  })
)

export default function Nav({
  togglePalette,
  user,
  thisDeviceLogout,
  allDevicesLogout,
  token,
  withdrawn,
  onWithdrawnChange,
}: {
  togglePalette: () => void
  user?: User
  thisDeviceLogout: () => Promise<void>
  allDevicesLogout: () => Promise<void>
  token?: string
  withdrawn: "yes" | "no" | "any"
  onWithdrawnChange: (a: "yes" | "no" | "any") => void
}) {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [logoutAnchor, setLogoutAnchor] = useState<HTMLButtonElement | null>(
    null
  )
  const classes = useStyles()
  const matchRes = useRouteMatch<{ location: string }>({ path: "/:location" })
  return (
    <div className={classes.nav}>
      {/* LEFT */}
      <div>
        <AuthOnly user={user}>
          <a href="https://hcwflustudy.com">
            <IconButton component={Link} to={`/`}>
              <Home />
            </IconButton>
          </a>
          <IconButton
            component={Link}
            to={`/tables`}
            className={matchRes?.params.location === "tables" ? "active" : ""}
          >
            <Icon icon={tableOutlined} />
          </IconButton>
          <IconButton
            component={Link}
            to={`/plots`}
            className={matchRes?.params.location === "plots" ? "active" : ""}
          >
            <Icon icon={bxBarChart} />
          </IconButton>
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
        <IconButton
          component={Link}
          to={`/email`}
          className={matchRes?.params.location === "email" ? "active" : ""}
        >
          <Send />
        </IconButton>
        <IconButton
          component={Link}
          to={`/api-spec`}
          className={matchRes?.params.location === "api-spec" ? "active" : ""}
        >
          <Icon icon={apiIcon} />
        </IconButton>
        <Divider orientation="vertical" flexItem className={classes.divider} />
        <AuthOnly user={user}>
          <IconButton
            onClick={() => setSettingsOpen((old) => !old)}
            className={matchRes?.params.location === "settings" ? "active" : ""}
          >
            <SettingsIcon />
          </IconButton>
        </AuthOnly>
        <AuthOnly user={user}>
          <IconButton
            aria-describedby="logout"
            onClick={(e) => setLogoutAnchor(e.currentTarget)}
          >
            <PowerSettingsNewIcon />
          </IconButton>
          <Popover
            id="logout"
            open={logoutAnchor !== null}
            onClose={() => setLogoutAnchor(null)}
            anchorEl={logoutAnchor}
            anchorOrigin={{
              vertical: "bottom",
              horizontal: "center",
            }}
            transformOrigin={{
              vertical: "top",
              horizontal: "center",
            }}
          >
            <Logout
              thisDeviceLogout={thisDeviceLogout}
              allDevicesLogout={allDevicesLogout}
            />
          </Popover>
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
      <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)}>
        <Settings
          token={token}
          user={user}
          withdrawn={withdrawn}
          onWithdrawnChange={onWithdrawnChange}
        />
      </Dialog>
    </div>
  )
}

export function SimpleNav({
  links,
  active,
  className,
}: {
  links: { name: string; link: string }[]
  active: (link: { name: string; link: string }) => boolean
  className?: string
}) {
  const classes = useStyles()
  return (
    <div className={`${classes.simpleNav} ${className ?? ""}`}>
      {links.map((l) => (
        <ButtonLink
          key={l.name}
          name={l.name}
          link={l.link}
          className={active(l) ? "active" : ""}
        />
      ))}
    </div>
  )
}

function ButtonLink({
  name,
  link,
  className,
}: {
  name: string
  link: string
  className: string
}) {
  const ref = useRef<HTMLAnchorElement | null>(null)
  return (
    <Button
      ref={ref}
      key={name}
      component={Link}
      to={link}
      className={className}
      onClick={() => ref.current?.scrollIntoView()}
    >
      {name}
    </Button>
  )
}

function Logout({
  thisDeviceLogout,
  allDevicesLogout,
}: {
  thisDeviceLogout: () => void
  allDevicesLogout: () => void
}) {
  const classes = useStyles()
  return (
    <div className={classes.logout}>
      <div className="title">Logout</div>
      <Button className="button" onClick={thisDeviceLogout}>
        This device
      </Button>
      <Button className="button" onClick={allDevicesLogout}>
        All devices
      </Button>
    </div>
  )
}
