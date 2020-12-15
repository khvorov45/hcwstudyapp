import { createStyles, IconButton, makeStyles, Theme } from "@material-ui/core"
import BrightnessMediumIcon from "@material-ui/icons/BrightnessMedium"
import People from "@material-ui/icons/People"
import Home from "@material-ui/icons/Home"
import React from "react"
import { Link } from "react-router-dom"
import { User } from "../lib/data"
import { AdminOnly, UserOnly } from "./auth"

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
  token,
}: {
  togglePalette: () => void
  user: User | null | undefined
  token: string | null
}) {
  const classes = useStyles()
  return (
    <div className={classes.nav}>
      {/* LEFT */}
      <div>
        <UserOnly user={user}>
          <IconButton component={Link} to={`/?token=${token}`}>
            <Home />
          </IconButton>
        </UserOnly>
      </div>
      {/* CENTER */}
      <div></div>
      {/* RIGHT */}
      <div>
        <AdminOnly user={user}>
          <IconButton component={Link} to={`/users?token=${token}`}>
            <People />
          </IconButton>
        </AdminOnly>
        <IconButton onClick={(_) => togglePalette()}>
          <BrightnessMediumIcon />
        </IconButton>
      </div>
    </div>
  )
}
