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
import { STUDY_YEARS } from "../lib/config"
import { Site } from "../lib/data"
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
  disableClearable = false,
}: {
  options: T[]
  label: string
  value: T | null
  onChange: (s: T | null) => void
  width: number
  getOptionLabel?: (x: T) => string
  inputMode: "text" | "numeric" | "none"
  disableClearable?: boolean
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
      disableClearable={disableClearable}
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

export function SiteSelect({
  sites,
  site,
  setSite,
}: {
  sites: Site[]
  site: Site[]
  setSite: (s: Site[]) => void
}) {
  return (
    <SelectorMultiple
      options={sites}
      label="Site"
      width={200}
      value={site}
      onChange={setSite}
      inputMode="none"
    />
  )
}

export function StudyYearSelector({
  label = "Study year",
  value,
  onChange,
  disableClearable,
}: {
  label?: string
  value: number | null
  onChange: (x: number | null) => void
  disableClearable?: boolean
}) {
  return (
    <Selector
      options={STUDY_YEARS}
      label={label}
      width={150}
      value={value}
      onChange={onChange}
      inputMode="none"
      disableClearable={disableClearable}
    />
  )
}

export function StudyYearSelectorMultiple({
  label = "Study years",
  value,
  onChange,
}: {
  label?: string
  value: number[]
  onChange: (x: number[]) => void
}) {
  return (
    <SelectorMultiple
      options={STUDY_YEARS}
      label={label}
      width={190}
      value={value}
      onChange={onChange}
      inputMode="none"
    />
  )
}
