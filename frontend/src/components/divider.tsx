import { createStyles, makeStyles, Theme } from "@material-ui/core/styles"

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    namedDivider: {
      display: "flex",
      alignItems: "center",
      textAlign: "center",
      color: theme.palette.text.secondary,
      "&::before, &::after": {
        content: "''",
        flex: 1,
        borderBottom: `1px solid ${theme.palette.divider}`,
      },
    },
  })
)

export function NamedDivider({
  name,
  className,
}: {
  name: string
  className: string
}) {
  const classes = useStyles()
  return <div className={`${classes.namedDivider} ${className}`}>{name}</div>
}
