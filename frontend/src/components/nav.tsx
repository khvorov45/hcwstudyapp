import { IconButton } from "@material-ui/core"
import BrightnessMediumIcon from "@material-ui/icons/BrightnessMedium"
import React from "react"

export default function Nav({ togglePalette }: { togglePalette: () => void }) {
  return (
    <div>
      <IconButton onClick={(_) => togglePalette()}>
        <BrightnessMediumIcon />
      </IconButton>
    </div>
  )
}
