import { ReactNode } from 'react'
import { bin } from 'd3-array'
import {
  BarChart, XAxis, YAxis, Tooltip, Bar
} from 'recharts'
import styles from './plot.module.css'

export default function Plotlist ({ children }: {children: ReactNode}) {
  return <div className={styles.plotlist}>
    {children}
  </div>
}

export function Histogram ({ data, x }: {data: any, x: string}) {
  const xvec = data.map(row => row[x])
  const histData = bin()(xvec).reduce(
    (acc, el) => {
      acc.push({ x: (el.x0 + el.x1) / 2, y: el.length })
      return acc
    },
    []
  )
  return <BarChart
    width={500} height={250} data={histData}
    margin={{ top: 20, right: 80, bottom: 20, left: 20 }}
  >
    <XAxis
      dataKey="x" tick={{ fill: 'var(--font-color-muted)' }}
      label={{ value: 'Age', position: 'bottom', fill: 'var(--font-color)' }}
    />
    <YAxis tick={{ fill: 'var(--font-color-muted)' }} />
    <Tooltip
      contentStyle={{
        'background-color': 'var(--bg-color)',
        border: '1px solid var(--border)'
      }}
      cursor={{ fill: 'var(--bg-color-alt)' }}
    />
    <Bar
      dataKey="y" fill="#8884d8" isAnimationActive={false}
    />
  </BarChart>
}
