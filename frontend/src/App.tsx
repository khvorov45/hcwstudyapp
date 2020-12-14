import { createMuiTheme, CssBaseline, ThemeProvider } from "@material-ui/core"
import React from "react"

export default function App() {
  const theme = createMuiTheme({ palette: { type: "dark" } })
  return (
    <div>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        App
      </ThemeProvider>
    </div>
  )
}
