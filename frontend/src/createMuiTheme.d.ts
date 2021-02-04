// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as createMuiTheme from "@material-ui/core/styles/createMuiTheme"

declare module "@material-ui/core/styles/createMuiTheme" {
  interface PlotOptions {
    axis: string
    grid: string
    tickLength: number
    tickLabelFromTick: number
  }
  interface ThemeOptions {
    plot: PlotOptions
  }
  interface Theme {
    plot: PlotOptions
  }
}
