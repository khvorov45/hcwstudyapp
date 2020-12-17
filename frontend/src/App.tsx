import { createMuiTheme, CssBaseline, ThemeProvider } from "@material-ui/core"
import React, { ReactNode, useState } from "react"
import StatusCodes from "http-status-codes"
import { AsyncStateStatus, useAsync } from "react-async-hook"
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Redirect,
} from "react-router-dom"
import Nav from "./components/nav"
import { apiReq } from "./lib/api"
import { User, UserV } from "./lib/data"
import ReactMarkdown from "react-markdown"
import homeMdPath from "./md/home.md"
import Tables from "./components/tables"

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

  const token = new URLSearchParams(window.location.search).get("token")
  const auth = useAsync(
    () =>
      apiReq({
        method: "GET",
        path: "auth/token/verify",
        token: token,
        success: StatusCodes.OK,
        failure: [StatusCodes.UNAUTHORIZED],
        validator: UserV,
      }),
    []
  )

  // Home page md -------------------------------------------------------------

  const [homePageContent, setHomePageContent] = useState<string>()
  fetch(homeMdPath)
    .then((d) => d.text())
    .then((t) => setHomePageContent(t))

  return (
    <div>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <Nav togglePalette={togglePalette} user={auth.result} token={token} />
          <Switch>
            <Route exact path="/get-link">
              Get link
            </Route>
            <AuthRoute
              exact
              authStatus={auth.status}
              user={auth.result}
              path="/"
            >
              <ReactMarkdown>{homePageContent ?? ""}</ReactMarkdown>
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
              <Tables token={token} />
            </AuthRoute>
            <AuthRoute
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
