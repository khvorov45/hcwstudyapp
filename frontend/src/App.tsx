import { createMuiTheme, CssBaseline, ThemeProvider } from "@material-ui/core"
import axios from "axios"
import React, { useState } from "react"
import { useAsync } from "react-async-hook"
import { BrowserRouter as Router, Switch, Route } from "react-router-dom"
import Nav from "./components/nav"

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
  const tok = new URLSearchParams(window.location.search).get("token")
  const auth = useAsync(async () => {
    const res = await axios.get("http://localhost:7001/auth/token/verify")
    return res.data
  }, [])
  console.log(auth)

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
