import {
  Button,
  createStyles,
  Dialog,
  Divider,
  IconButton,
  makeStyles,
  Popover,
  Theme,
  Tooltip,
  useTheme,
} from "@material-ui/core"
import People from "@material-ui/icons/People"
import Home from "@material-ui/icons/Home"
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
import reportIcon from "@iconify/icons-carbon/report"
import themeLightDark from "@iconify/icons-mdi/theme-light-dark"
import questionCircle from "@iconify/icons-bi/question-circle"
import closeOutline from "@iconify/icons-carbon/close-outline"
import { AsyncStateStatus } from "react-async-hook"

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
      "& .activeAlways": {
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
      marginRight: 5,
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
  onParticipantUpdate,
  onUserUpdate,
  authStatus,
}: {
  togglePalette: () => void
  user?: User
  thisDeviceLogout: () => Promise<void>
  allDevicesLogout: () => Promise<void>
  token?: string
  withdrawn: "yes" | "no" | "any"
  onWithdrawnChange: (a: "yes" | "no" | "any") => void
  onParticipantUpdate: () => void
  onUserUpdate: () => void
  authStatus: AsyncStateStatus
}) {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [logoutAnchor, setLogoutAnchor] = useState<HTMLButtonElement | null>(
    null
  )
  const classes = useStyles()
  const theme = useTheme()
  const matchRes = useRouteMatch<{ location: string }>({ path: "/:location" })
  function activeIf(page: string) {
    return matchRes?.params.location === page ? "active" : ""
  }
  return (
    <div className={classes.nav}>
      {/* LEFT */}
      <div>
        <AuthOnly user={user}>
          <Tooltip title="Main study site">
            <a href="https://hcwflustudy.com">
              <IconButton>
                <Home />
              </IconButton>
            </a>
          </Tooltip>
          <Tooltip title="Main page (redirects to about)">
            <IconButton component={Link} to="/" className="activeAlways">
              <Icon icon={reportIcon} />
            </IconButton>
          </Tooltip>

          <NavDivider />

          <Tooltip title="About">
            <IconButton
              component={Link}
              to="/about"
              className={activeIf("about")}
            >
              <Icon icon={questionCircle} />
            </IconButton>
          </Tooltip>

          <Tooltip title="Tables">
            <IconButton
              component={Link}
              to="/tables"
              className={activeIf("tables")}
            >
              <Icon icon={tableOutlined} />
            </IconButton>
          </Tooltip>

          <Tooltip title="Plots">
            <IconButton
              component={Link}
              to="/plots"
              className={activeIf("plots")}
            >
              <Icon icon={bxBarChart} />
            </IconButton>
          </Tooltip>
        </AuthOnly>
      </div>
      {/* CENTER */}
      <div></div>
      {/* RIGHT */}
      <div>
        <AuthOnly user={user} admin>
          <Tooltip title="Users">
            <IconButton
              component={Link}
              to="/users"
              className={activeIf("users")}
            >
              <People />
            </IconButton>
          </Tooltip>
        </AuthOnly>

        <Tooltip title="Get access">
          <IconButton
            component={Link}
            to="/email"
            className={activeIf("email")}
          >
            <Send />
          </IconButton>
        </Tooltip>

        <Tooltip title="API and R code">
          <IconButton
            component={Link}
            to="/api-spec"
            className={activeIf("api-spec")}
          >
            <Icon icon={apiIcon} />
          </IconButton>
        </Tooltip>

        <NavDivider />

        <AuthOnly user={user}>
          <Tooltip title="Settings">
            <IconButton onClick={() => setSettingsOpen((old) => !old)}>
              <SettingsIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Logout">
            <IconButton
              aria-describedby="logout"
              onClick={(e) => setLogoutAnchor(e.currentTarget)}
            >
              <PowerSettingsNewIcon />
            </IconButton>
          </Tooltip>

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

        <NavDivider />
        <Tooltip title="Switch theme">
          <IconButton onClick={(_) => togglePalette()}>
            <Icon icon={themeLightDark} />
          </IconButton>
        </Tooltip>
      </div>
      <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ width: 48 }}></div>
          <div style={{ textAlign: "center", fontSize: "medium" }}>
            Settings
          </div>
          <div>
            <IconButton
              style={{ color: theme.palette.error.main }}
              onClick={() => setSettingsOpen(false)}
            >
              <Icon icon={closeOutline} />
            </IconButton>
          </div>
        </div>
        <Settings
          token={token}
          user={user}
          withdrawn={withdrawn}
          onWithdrawnChange={onWithdrawnChange}
          onParticipantUpdate={onParticipantUpdate}
          onUserUpdate={onUserUpdate}
          authStatus={authStatus}
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

function NavDivider() {
  const classes = useStyles()
  return <Divider orientation="vertical" flexItem className={classes.divider} />
}
