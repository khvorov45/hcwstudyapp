import { BarChart, XAxis, YAxis, Tooltip, Bar, Label } from "recharts"
import { useTheme } from "@material-ui/core"
import { Participant } from "../lib/data"
import * as d3 from "d3-array"

export default function Plots({
  participants,
}: {
  participants: Participant[]
}) {
  const genderCounts = d3.rollup(
    participants,
    (v) => v.length,
    (p) => p.gender
  )

  return (
    <GenericBar
      data={Array.from(genderCounts, ([k, v]) => ({
        gender: k ?? "(missing)",
        count: v,
      }))}
      xLab="Gender"
      xKey="gender"
      yKey="count"
    />
  )
}

function GenericBar<T extends Record<string, string | number>>({
  data,
  xLab,
  xKey,
  yKey,
}: {
  data: T[]
  xLab: string
  xKey: keyof T
  yKey: keyof T
}) {
  const theme = useTheme()
  if (data.length === 0) return <></>
  return (
    <BarChart
      width={450}
      height={250}
      data={data}
      margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
    >
      <XAxis
        dataKey={xKey as string}
        tick={{
          fill: theme.palette.text.secondary,
        }}
      >
        <Label
          value={xLab}
          position="bottom"
          style={{ textAnchor: "middle", fill: theme.palette.text.primary }}
        />
      </XAxis>
      <YAxis tick={{ fill: theme.palette.text.secondary }}>
        <Label
          angle={-90}
          value="Count"
          position="insideLeft"
          style={{ textAnchor: "middle", fill: theme.palette.text.primary }}
        />
      </YAxis>
      <Tooltip
        contentStyle={{
          background: theme.palette.background.default,
          border: `1px solid ${theme.palette.divider}`,
        }}
        cursor={{ fill: theme.palette.background.alt }}
        itemStyle={{
          color: theme.palette.text.primary,
        }}
      />
      <Bar dataKey={yKey as string} fill="#8884d8" isAnimationActive={false} />
    </BarChart>
  )
}
