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
import { UserV } from "./lib/data"
import ReactMarkdown from "react-markdown"
import homeMdPath from "./md/home.md"
import { AdminOnly } from "./components/auth"

function themeInit(): "dark" | "light" {
  let localtheme = localStorage.getItem("theme")
  if (!localtheme || !["dark", "light"].includes(localtheme)) {
    localStorage.setItem("theme", "dark")
    return "dark"
  } else if (localtheme === "dark") {
    return "dark"
  } else {
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
    localStorage.setItem("theme", newPalette)
  }
  const theme = createMuiTheme({ palette: { type: paletteType } })

  // Auth ---------------------------------------------------------------------

  const auth = useAsync(
    () =>
      apiReq({
        method: "GET",
        url: "http://localhost:7001/auth/token/verify",
        token: new URLSearchParams(window.location.search).get("token"),
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
          <Nav togglePalette={togglePalette} user={auth.result} />
          <Switch>
            <Route exact path="/get-link">
              Get link
            </Route>
            <AuthRoute exact authStatus={auth.status} path="/">
              <ReactMarkdown>{homePageContent ?? ""}</ReactMarkdown>
            </AuthRoute>
            <AuthRoute exact authStatus={auth.status} path="/users">
              <AdminOnly user={auth.result}>Users</AdminOnly>
            </AuthRoute>
          </Switch>
        </Router>
      </ThemeProvider>
    </div>
  )
}

function AuthRoute({
  path,
  authStatus,
  children,
  exact,
}: {
  path: string
  authStatus: AsyncStateStatus
  children: ReactNode
  exact?: boolean
}) {
  return (
    <Route exact={exact} path={path}>
      {authStatus === "error" ? (
        <Redirect to="/get-link" />
      ) : authStatus === "success" ? (
        children
      ) : (
        <></>
      )}
    </Route>
  )
}
