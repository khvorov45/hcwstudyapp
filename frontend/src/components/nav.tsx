import { createStyles, IconButton, makeStyles, Theme } from "@material-ui/core"
import BrightnessMediumIcon from "@material-ui/icons/BrightnessMedium"
import React from "react"
import { Link } from "react-router-dom"
import { User } from "../lib/data"
import { AdminOnly } from "./auth"

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    nav: {
      overflow: "auto",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      borderBottom: `1px solid ${theme.palette.divider}`,
    },
  })
)

export default function Nav({
  togglePalette,
  user,
}: {
  togglePalette: () => void
  user: User | null | undefined
}) {
  const classes = useStyles()
  return (
    <div className={classes.nav}>
      {/* LEFT */}
      <div></div>
      {/* CENTER */}
      <div></div>
      {/* RIGHT */}
      <div>
        <AdminOnly user={user}>
          <IconButton component={Link} to="/admin">
            <BrightnessMediumIcon />
          </IconButton>
        </AdminOnly>
        <IconButton onClick={(_) => togglePalette()}>
          <BrightnessMediumIcon />
        </IconButton>
      </div>
    </div>
  )
}
