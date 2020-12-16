// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as createPalette from "@material-ui/core/styles/createPalette"

declare module "@material-ui/core/styles/createPalette" {
  interface TypeBackground {
    alt?: string
  }
}
