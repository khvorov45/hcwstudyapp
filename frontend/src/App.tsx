import { createMuiTheme, CssBaseline, ThemeProvider } from "@material-ui/core"
import React, { useState } from "react"
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
  const [paletteType, setPaletteType] = useState<"dark" | "light">(themeInit())
  function togglePalette() {
    const newPalette: "dark" | "light" =
      paletteType === "dark" ? "light" : "dark"
    setPaletteType(newPalette)
    localStorage.setItem("theme", newPalette)
  }
  const theme = createMuiTheme({ palette: { type: paletteType } })
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
