import { createMuiTheme, CssBaseline, ThemeProvider } from "@material-ui/core"
import React, { useState } from "react"
import StatusCodes from "http-status-codes"
import { useAsync } from "react-async-hook"
import { BrowserRouter as Router, Switch, Route } from "react-router-dom"
import Nav from "./components/nav"
import { apiReq } from "./lib/api"

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
      }),
    []
  )
  console.log("result: " + auth.result)
  console.log("error: " + auth.error?.message)

  return (
    <div>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <Nav togglePalette={togglePalette} />
          <Switch>
            <Route exact path="/">
              Home
            </Route>
          </Switch>
        </Router>
      </ThemeProvider>
    </div>
  )
}
