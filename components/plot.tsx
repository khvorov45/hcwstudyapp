import { ReactNode } from 'react'
import { bin } from 'd3-array'
import {
  BarChart, XAxis, YAxis, Tooltip, Bar, Label
} from 'recharts'
import styles from './plot.module.css'

export default function Plotlist ({ children }: {children: ReactNode}) {
  return <div className={styles.plotlist}>
    {children}
  </div>
}

export function Histogram ({ data, x }: {data: any, x: string}) {
  console.log(data)
  const xvec = data.map(row => row[x])
  const histData = bin()(xvec).reduce(
    (acc, el) => {
      acc.push({ x: (el.x0 + el.x1) / 2, y: el.length })
      return acc
    },
    []
  )
  console.log(histData)
  return <BarChart
    width={500} height={250} data={histData}
    margin={{ top: 20, right: 80, bottom: 20, left: 5 }}
  >
    <XAxis
      dataKey="x" tick={{ fill: 'var(--font-color-muted)' }}
    >
      <Label
        value='Age'
        position='bottom'
        style={{ textAnchor: 'middle', fill: 'var(--font-color)' }}
      />
    </XAxis>
    <YAxis
      tick={{ fill: 'var(--font-color-muted)' }}
    >
      <Label
        angle={-90} value='Count'
        position='insideLeft'
        style={{ textAnchor: 'middle', fill: 'var(--font-color)' }}
      />
    </YAxis>
    <Tooltip
      contentStyle={{
        'background-color': 'var(--bg-color)',
        border: '1px solid var(--border)'
      }}
      cursor={{ fill: 'var(--bg-color-alt)' }}
      itemStyle={{
        color: 'var(--font-color)'
      }}
    />
    <Bar
      dataKey="y" fill="#8884d8" isAnimationActive={false}
    />
  </BarChart>
}
