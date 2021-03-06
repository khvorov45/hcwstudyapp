import {
  createMuiTheme,
  createStyles,
  CssBaseline,
  makeStyles,
  Theme,
  ThemeProvider,
  Divider,
} from "@material-ui/core"
import React, { ReactNode, useEffect, useState } from "react"
import StatusCodes from "http-status-codes"
import { AsyncStateStatus, useAsync, useAsyncCallback } from "react-async-hook"
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Redirect,
} from "react-router-dom"
import * as t from "io-ts"
import Nav from "./components/nav"
import { apiReq } from "./lib/api"
import { User, UserV } from "./lib/data"
import ReactMarkdown from "react-markdown"
import aboutMdPath from "./md/about.md"
import Tables from "./components/tables"
import Email from "./components/email"
import ApiSpec from "./components/api-spec"
import Users from "./components/users"
import Plots from "./components/plot"
import {
  applyTableSettingsAllData,
  fetchAndProcessAll,
  TableSettings,
} from "./lib/table-data"
import ScreenHeight from "./components/screen-height"
import { LinkExternal, LinkInternal } from "./components/link"
import { GlobalLoading } from "./components/loading"

function LinkRenderer(props: any) {
  if (props.href.startsWith("/")) {
    return <LinkInternal to={props.href}>{props.children}</LinkInternal>
  }
  return LinkExternal(props)
}

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    home: {
      paddingLeft: 20,
      paddingRight: 20,
      "&>ul>*": {
        marginTop: 10,
      },
    },
  })
)

function themeInit(): "dark" | "light" {
  let localtheme = localStorage.getItem("theme")
  if (!localtheme || !["dark", "light"].includes(localtheme)) {
    localStorage.setItem("theme", "dark")
    document.documentElement.setAttribute("theme", "dark")
    return "dark"
  } else if (localtheme === "dark") {
    document.documentElement.setAttribute("theme", "dark")
    return "dark"
  } else {
    document.documentElement.setAttribute("theme", "light")
    return "light"
  }
}

function withdrawnInit(): "yes" | "no" | "any" {
  let withdrawnSetting = localStorage.getItem("withdrawn")
  if (!withdrawnSetting || !["yes", "no", "any"].includes(withdrawnSetting)) {
    localStorage.setItem("withdrawn", "no")
    return "no"
  }
  return withdrawnSetting as "yes" | "no" | "any"
}

type AppToken = {
  token: string
  lastRefresh: Date | null
}

function tokenInit(): AppToken | null {
  const lastRefreshString = localStorage.getItem("last-refresh")
  const lastRefresh = lastRefreshString ? new Date(lastRefreshString) : null
  const localToken = localStorage.getItem("token")
  if (localToken) {
    return { token: localToken, lastRefresh }
  }
  return null
}

async function tokenRefresh(token: AppToken, setToken: (t: AppToken) => void) {
  const newToken = await apiReq({
    method: "PUT",
    path: "auth/token",
    token: token.token,
    success: StatusCodes.OK,
    failure: [StatusCodes.UNAUTHORIZED],
    validator: t.string,
  })
  const now = new Date()
  localStorage.setItem("token", newToken)
  localStorage.setItem("last-refresh", now.toISOString())
  setToken({ token: newToken, lastRefresh: now })
}

export default function App() {
  // Theme --------------------------------------------------------------------

  const [paletteType, setPaletteType] = useState<"dark" | "light">(themeInit())
  function togglePalette() {
    const newPalette: "dark" | "light" =
      paletteType === "dark" ? "light" : "dark"
    setPaletteType(newPalette)
    document.documentElement.setAttribute("theme", newPalette)
    localStorage.setItem("theme", newPalette)
  }
  const theme = createMuiTheme({
    overrides: {
      MuiCssBaseline: {
        "@global": {
          "html, html *": {
            "scrollbar-color":
              "rgb(150, 150, 150) " +
              (paletteType === "dark" ? "rgb(0, 0, 0)" : "rgb(255, 255, 255)"),
          },
          "::-webkit-scrollbar-thumb:hover": {
            background:
              paletteType === "dark" ? "rgb(255, 255, 255)" : "rgb(0, 0, 0)",
          },
          "::-webkit-scrollbar-thumb": {
            background: "rgb(150, 150, 150)",
          },
          "::-webkit-scrollbar-track, ::-webkit-scrollbar-corner": {
            background:
              paletteType === "dark" ? "rgb(0, 0, 0)" : "rgb(255, 255, 255)",
          },
          "::-webkit-scrollbar": {
            width: 10,
            height: 10,
          },
        },
      },
    },
    palette: {
      type: paletteType,
      background: {
        default: paletteType === "dark" ? "rgb(0, 0, 0)" : "rgb(255, 255, 255)",
        alt: paletteType === "dark" ? "rgb(40, 40, 40)" : "rgb(220, 220, 220)",
        paper:
          paletteType === "dark" ? "rgb(40, 40, 40)" : "rgb(220, 220, 220)",
      },
      divider:
        paletteType === "dark" ? "rgb(70, 70, 70)" : "rgb(200, 200, 200)",
    },
    plot: {
      axis: paletteType === "dark" ? "rgb(200, 200, 200)" : "rgb(80, 80, 80)",
      grid: paletteType === "dark" ? "rgb(50, 50, 50)" : "rgb(230, 230, 230)",
      tickLength: 5,
      tickLabelFromTick: 2,
    },
  })

  // Auth ---------------------------------------------------------------------

  const [token, setToken] = useState(tokenInit())

  const auth = useAsync(
    async (token: AppToken | null) => {
      if (!token) {
        throw Error("no token")
      }
      return await apiReq({
        method: "GET",
        path: "auth/token/verify",
        token: token.token,
        success: StatusCodes.OK,
        failure: [StatusCodes.UNAUTHORIZED],
        validator: UserV,
      })
    },
    [token],
    {
      setLoading: (state) => ({ ...state, loading: true }),
    }
  )

  useEffect(() => {
    async function conditionalRefresh() {
      // Gotta wait until we actually get a good token from somewhere
      if (auth.status !== "success" || auth.loading || !token) {
        return
      }
      const noLastRefresh = token.lastRefresh === null
      let lastRefreshTooOld = false
      if (token.lastRefresh !== null) {
        lastRefreshTooOld =
          new Date().getTime() - token.lastRefresh.getTime() >
          24 * 60 * 60 * 1000
      }
      if (noLastRefresh || lastRefreshTooOld) {
        try {
          await tokenRefresh(token, setToken)
        } catch (e) {
          console.error("token refresh failed: " + e.message)
        }
      }
    }
    conditionalRefresh()
    const interval = setInterval(conditionalRefresh, 60 * 60 * 1000)
    return () => clearInterval(interval)
  }, [token, auth.status, auth.loading])

  const logout = useAsyncCallback(
    async ({ allDevices }: { allDevices: boolean }) => {
      localStorage.removeItem("token")
      localStorage.removeItem("last-refresh")
      setToken(null)
      await apiReq({
        method: "DELETE",
        path: allDevices ? "auth/token/user/session" : "auth/token",
        token: token?.token,
        success: StatusCodes.NO_CONTENT,
        failure: [],
        validator: t.void,
      })
    }
  )

  // Withdrawn ----------------------------------------------------------------

  const [withdrawnSetting, setWithdrawnSetting] = useState(withdrawnInit())

  // Table data ---------------------------------------------------------------

  const allTableDataLoad = useAsync(fetchAndProcessAll, [
    auth.status,
    token?.token,
  ])
  const tableSettings: TableSettings = {
    withdrawn: {
      setting: withdrawnSetting,
      ids: allTableDataLoad.result?.withdrawn.map((w) => w.pid) ?? [],
    },
  }
  const allTableData = applyTableSettingsAllData(
    tableSettings,
    allTableDataLoad.result
  )
  const usersFetch = useAsync(
    async (token?: string) => {
      if (!token) {
        return []
      }
      return await apiReq({
        method: "GET",
        path: "users",
        token: token,
        success: StatusCodes.OK,
        failure: [StatusCodes.UNAUTHORIZED],
        validator: t.array(UserV),
      })
    },
    [token?.token]
  )
  useEffect(
    () => allTableDataLoad.error && console.error(allTableDataLoad.error),
    [allTableDataLoad.error]
  )

  // About page md ------------------------------------------------------------

  const aboutPageMd = useAsync(async () => {
    const fetched = await fetch(aboutMdPath)
    return await fetched.text()
  }, [])

  const classes = useStyles()
  return (
    <div>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <Nav
            togglePalette={togglePalette}
            user={auth.result}
            thisDeviceLogout={() => logout.execute({ allDevices: false })}
            allDevicesLogout={() => logout.execute({ allDevices: true })}
            token={token?.token}
            withdrawn={withdrawnSetting}
            onWithdrawnChange={(v) => {
              setWithdrawnSetting(v)
              localStorage.setItem("withdrawn", v)
            }}
            onParticipantUpdate={() => {
              allTableDataLoad.execute(auth.status, token?.token)
            }}
            onUserUpdate={usersFetch.execute}
            authStatus={auth.status}
          />
          <GlobalLoading loading={allTableDataLoad.loading} />
          <div>
            <Switch>
              <Route exact path="/login">
                {auth.status === "success" ? (
                  <Redirect to="/" />
                ) : (
                  <Login setToken={setToken} />
                )}
              </Route>
              <Route exact path="/email">
                <Email />
              </Route>
              <Route path="/api-spec">
                <ApiSpec />
              </Route>
              <Route exact path="/">
                <Redirect to="/about" />
              </Route>
              <AuthRoute
                exact
                authStatus={auth.status}
                authLoading={auth.loading}
                user={auth.result}
                path="/about"
              >
                <ScreenHeight heightTaken={50}>
                  <ReactMarkdown
                    className={classes.home}
                    renderers={{ link: LinkRenderer, thematicBreak: Divider }}
                  >
                    {aboutPageMd.result ?? ""}
                  </ReactMarkdown>
                </ScreenHeight>
              </AuthRoute>
              <AuthRoute
                exact
                admin
                authStatus={auth.status}
                authLoading={auth.loading}
                user={auth.result}
                path="/users"
              >
                <Users
                  users={usersFetch.result ?? []}
                  onEdit={() => token && usersFetch.execute(token.token)}
                  token={token?.token}
                />
              </AuthRoute>
              <AuthRoute
                authLoading={auth.loading}
                authStatus={auth.status}
                user={auth.result}
                path="/tables"
              >
                <Tables
                  participantsExtra={allTableData?.participantsExtra}
                  vaccination={allTableData?.vaccination}
                  schedule={allTableData?.schedule}
                  weeklySurvey={allTableData?.weeklySurvey}
                  withdrawn={allTableData?.withdrawn}
                  virus={allTableData?.virus}
                  serology={allTableData?.serologyExtra}
                  titreChange={allTableData?.titreChanges}
                  vaccinationCounts={allTableData?.vaccinationCounts}
                  user={auth.result}
                />
              </AuthRoute>
              <AuthRoute
                authStatus={auth.status}
                authLoading={auth.loading}
                user={auth.result}
                path="/plots"
              >
                <Plots
                  participantsExtra={allTableData?.participantsExtra ?? []}
                  serology={allTableData?.serologyExtra ?? []}
                  titreChange={allTableData?.titreChanges ?? []}
                  virusTable={allTableData?.virus ?? []}
                  vaccinationCounts={allTableData?.vaccinationCounts ?? []}
                />
              </AuthRoute>
            </Switch>
          </div>
        </Router>
      </ThemeProvider>
    </div>
  )
}

function AuthRoute({
  path,
  exact,
  authStatus,
  authLoading,
  user,
  admin,
  children,
}: {
  path: string
  exact?: boolean
  authStatus: AsyncStateStatus
  authLoading: boolean
  user: User | null | undefined
  admin?: boolean
  children: ReactNode
}) {
  if (
    authStatus === "loading" ||
    authStatus === "not-requested" ||
    (authLoading && authStatus !== "success")
  ) {
    return <></>
  }
  if (authStatus === "error") {
    return <Redirect to="/email" />
  }
  if (admin && user?.accessGroup !== "admin") {
    return <Redirect to="/email" />
  }
  return (
    <Route exact={exact} path={path}>
      {children}
    </Route>
  )
}

function Login({ setToken }: { setToken: (t: AppToken) => void }) {
  const queryToken = new URLSearchParams(window.location.search).get("token")
  const refresh = useAsync(async () => {
    if (!queryToken) {
      return
    }
    await tokenRefresh({ token: queryToken, lastRefresh: null }, setToken)
  }, [])
  if (refresh.loading) {
    return <></>
  }
  // Let the rest of the app figure out where to go when this attempted refresh
  // completes
  return <Redirect to="/" />
}
