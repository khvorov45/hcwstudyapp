import {
  createMuiTheme,
  createStyles,
  CssBaseline,
  makeStyles,
  Theme,
  ThemeProvider,
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
import homeMdPath from "./md/home.md"
import Tables from "./components/tables"
import GetLink from "./components/get-link"
import Settings from "./components/settings"
import ApiSpec from "./components/api-spec"
import Users from "./components/users"

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    belowNav: {
      overflow: "scroll",
      height: "calc(100vh - 50px)",
    },
    home: {
      paddingLeft: 20,
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
    palette: {
      type: paletteType,
      background: {
        default: paletteType === "dark" ? "rgb(0, 0, 0)" : "rgb(255, 255, 255)",
        alt: paletteType === "dark" ? "rgb(40, 40, 40)" : "rgb(220, 220, 220)",
      },
    },
  })

  // Auth ---------------------------------------------------------------------

  const [token, setToken] = useState(tokenInit())

  const auth = useAsync(
    async (token: AppToken | null) => {
      return await apiReq({
        method: "GET",
        path: "auth/token/verify",
        token: token?.token,
        success: StatusCodes.OK,
        failure: [StatusCodes.UNAUTHORIZED],
        validator: UserV,
      })
    },
    [token]
  )

  useEffect(() => {
    async function conditionalRefresh() {
      // Gotta wait until we actually get a good token from somewhere
      if (auth.status !== "success" || !token) {
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
  }, [token, auth])

  const logout = useAsyncCallback(async () => {
    localStorage.removeItem("token")
    localStorage.removeItem("last-refresh")
    setToken(null)
    await apiReq({
      method: "DELETE",
      path: "auth/token",
      token: token?.token,
      success: StatusCodes.NO_CONTENT,
      failure: [],
      validator: t.void,
    })
  })

  // Withdrawn ----------------------------------------------------------------

  const [withdrawn, setWithdrawn] = useState(withdrawnInit())

  // Home page md -------------------------------------------------------------

  const [homePageContent, setHomePageContent] = useState<string>()
  fetch(homeMdPath)
    .then((d) => d.text())
    .then((t) => setHomePageContent(t))

  const classes = useStyles()
  return (
    <div>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <Nav
            togglePalette={togglePalette}
            user={auth.result}
            logout={logout.execute}
            token={token?.token}
            withdrawn={withdrawn}
            onWithdrawnChange={(v) => {
              setWithdrawn(v)
              localStorage.setItem("withdrawn", v)
            }}
          />
          <div className={classes.belowNav}>
            <Switch>
              <Route exact path="/login">
                {auth.status === "success" ? (
                  <Redirect to="/" />
                ) : (
                  <Login setToken={setToken} />
                )}
              </Route>
              <Route exact path="/get-link">
                <GetLink />
              </Route>
              <Route exact path="/api-spec">
                <ApiSpec />
              </Route>
              <AuthRoute
                exact
                authStatus={auth.status}
                user={auth.result}
                path="/"
              >
                <ReactMarkdown className={classes.home}>
                  {homePageContent ?? ""}
                </ReactMarkdown>
              </AuthRoute>
              <AuthRoute
                exact
                admin
                authStatus={auth.status}
                user={auth.result}
                path="/users"
              >
                <Users token={token?.token} />
              </AuthRoute>
              <AuthRoute
                authStatus={auth.status}
                user={auth.result}
                path="/tables"
              >
                <Tables token={token?.token} withdrawnSetting={withdrawn} />
              </AuthRoute>
              <AuthRoute
                exact
                authStatus={auth.status}
                user={auth.result}
                path="/plots"
              >
                Plots
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
  user,
  admin,
  children,
}: {
  path: string
  exact?: boolean
  authStatus: AsyncStateStatus
  user: User | null | undefined
  admin?: boolean
  children: ReactNode
}) {
  if (authStatus === "error") {
    return <Redirect to="/get-link" />
  }
  if (authStatus === "loading" || authStatus === "not-requested" || !user) {
    return <></>
  }
  if (admin && user.accessGroup !== "admin") {
    return <Redirect to="/get-link" />
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
