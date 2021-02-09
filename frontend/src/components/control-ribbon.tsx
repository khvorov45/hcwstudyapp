import {
  makeStyles,
  Theme,
  createStyles,
  Checkbox,
  useTheme,
  TextField,
} from "@material-ui/core"
import { Autocomplete } from "@material-ui/lab"
import React, { ReactNode } from "react"
import detectScrollbarWidth from "../lib/scrollbar-width"

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    control: {
      display: "flex",
      overflowX: "scroll",
      overflowY: "hidden",
      "&>*": {
        borderRight: `1px solid ${theme.palette.divider}`,
        flexShrink: 0,
        height: 56,
        overflow: "hidden",
      },
      "&>*:last-child": {
        borderRight: 0,
      },
      height: 56 + detectScrollbarWidth(),
      borderBottom: `1px solid ${theme.palette.divider}`,
    },
  })
)

export function ControlRibbon({ children }: { children: ReactNode }) {
  const classes = useStyles()
  return <div className={classes.control}>{children}</div>
}

export function Selector<T>({
  options,
  label,
  value,
  onChange,
  width,
  getOptionLabel = (o) => `${o}`,
  inputMode,
}: {
  options: T[]
  label: string
  value: T | null
  onChange: (s: T | null) => void
  width: number
  getOptionLabel?: (x: T) => string
  inputMode: "text" | "numeric" | "none"
}) {
  return (
    <Autocomplete
      options={options}
      getOptionLabel={getOptionLabel}
      renderInput={(params) => (
        <SelectorTextField
          params={params}
          label={label}
          inputMode={inputMode}
        />
      )}
      value={value}
      onChange={(e, n) => onChange(n)}
      style={{ width }}
    />
  )
}

function SelectorTextField({
  params,
  label,
  inputMode,
}: {
  params: any
  label: string
  inputMode: "text" | "numeric" | "none"
}) {
  const theme = useTheme()
  return (
    <TextField
      {...params}
      label={label}
      variant="filled"
      inputProps={{ ...params.inputProps, inputMode }}
      InputProps={{
        ...params.InputProps,
        disableUnderline: true,
        style: { backgroundColor: theme.palette.background.default },
      }}
    />
  )
}

export function SelectorMultiple<T>({
  options,
  label,
  value,
  onChange,
  width,
  inputMode,
}: {
  options: T[]
  label: string
  value: T[]
  onChange: (s: T[]) => void
  width: number
  inputMode: "text" | "numeric" | "none"
}) {
  return (
    <Autocomplete
      options={options}
      getOptionLabel={(o) => `${o}`}
      renderInput={(params) => (
        <SelectorTextField
          params={params}
          label={label}
          inputMode={inputMode}
        />
      )}
      renderTags={(value, getProps) => <div>{`${value.length} selected`}</div>}
      renderOption={(option, { selected }) => (
        <>
          <Checkbox checked={selected} size="small" />
          {option}
        </>
      )}
      value={value}
      onChange={(e, n) => onChange(n)}
      style={{ width }}
      multiple
      disableCloseOnSelect
    />
  )
}
