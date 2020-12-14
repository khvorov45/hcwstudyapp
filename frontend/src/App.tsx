import { createMuiTheme, CssBaseline, ThemeProvider } from "@material-ui/core"
import React, { useState } from "react"
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
        <Nav togglePalette={togglePalette} />
      </ThemeProvider>
    </div>
  )
}
