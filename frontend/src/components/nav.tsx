import { Button } from "@material-ui/core"
import React from "react"

export default function Nav({ togglePalette }: { togglePalette: () => void }) {
  return (
    <div>
      <Button onClick={(_) => togglePalette()}>Theme switch</Button>
    </div>
  )
}
