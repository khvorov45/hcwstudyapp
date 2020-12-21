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
import { AsyncStateStatus, useAsync } from "react-async-hook"
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

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
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
        default: paletteType === "dark" ? "black" : "white",
        alt: paletteType === "dark" ? "rgb(40, 40, 40)" : "rgb(220, 220, 220)",
      },
    },
  })

  // Auth ---------------------------------------------------------------------

  const [token, setToken] = useState({
    token:
      new URLSearchParams(window.location.search).get("token") ??
      localStorage.getItem("token"),
    lastRefresh: new Date(localStorage.getItem("last-refresh") ?? 0),
  })
  function updateToken(token: string) {
    const now = new Date()
    localStorage.setItem("token", token)
    localStorage.setItem("last-refresh", now.toISOString())
    setToken({ token: token, lastRefresh: now })
  }

  const auth = useAsync(
    () =>
      apiReq({
        method: "GET",
        path: "auth/token/verify",
        token: token.token,
        success: StatusCodes.OK,
        failure: [StatusCodes.UNAUTHORIZED],
        validator: UserV,
      }),
    []
  )

  useEffect(() => {
    function conditionalRefresh() {
      // Gotta wait until we actually get a good token from somewhere
      if (auth.status !== "success" || !token) {
        return
      }
      if (
        new Date().getTime() - token.lastRefresh.getTime() >
        24 * 60 * 60 * 1000
      ) {
        apiReq({
          method: "PUT",
          path: "auth/token",
          token: token.token,
          success: StatusCodes.OK,
          failure: [StatusCodes.UNAUTHORIZED],
          validator: t.string,
        })
          .then(updateToken)
          .catch((e) => console.error(e.message))
      }
    }
    conditionalRefresh()
    const interval = setInterval(conditionalRefresh, 60 * 60 * 1000)
    return () => clearInterval(interval)
  }, [token, auth])

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
            token={token.token}
          />
          <Switch>
            <Route exact path="/get-link">
              {auth.status === "success" ? (
                <Redirect to="/" />
              ) : (
                <GetLink token={token.token} />
              )}
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
              Users
            </AuthRoute>
            <AuthRoute
              authStatus={auth.status}
              user={auth.result}
              path="/tables"
            >
              <Tables token={token.token} />
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
