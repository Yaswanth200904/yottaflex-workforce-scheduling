import { Area, CartesianGrid, ComposedChart, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { TrendPoint } from '@/features/overview/use-overview-filters'

function TrendTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: TrendPoint }> }) {
  if (!active || !payload || payload.length === 0) return null
  const point = payload[0].payload

  return (
    <div className="rounded-[6px] border border-ink/10 bg-white px-2 py-1.5 shadow-[0_10px_24px_-14px_rgba(17,41,107,0.5)]">
      <div className="text-[10.5px] font-medium leading-4 text-ink">{point.full}</div>
      <div className="text-[10.5px] leading-4 tabular-nums text-ink/65">
        {point.coverage.toFixed(1)}% · {point.assigned} of {point.required} slots
      </div>
    </div>
  )
}

export function CoverageTrendChart({ data }: { data: TrendPoint[] }) {
  const lowest = Math.min(...data.map((point) => point.coverage))
  const floor = Math.max(0, Math.floor(lowest) - 1)
  const middle = Math.round((floor + 100) / 2)
  const summary = `Staffing coverage by day, ${data[0]?.full} to ${data[data.length - 1]?.full}, ranging from ${lowest.toFixed(1)} to ${Math.max(...data.map((point) => point.coverage)).toFixed(1)} percent against a 95 percent target`

  return (
    <div className="h-[150px] w-full xl:h-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 6, right: 6, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="coverageFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00509d" stopOpacity={0.16} />
              <stop offset="100%" stopColor="#00509d" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#11296b" strokeOpacity={0.08} vertical={false} />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            dy={4}
            tick={{ fontSize: 10, fill: '#11296b', fillOpacity: 0.55 }}
          />
          <YAxis
            domain={[floor, 100]}
            ticks={[floor, middle, 100]}
            tickFormatter={(value: number) => `${value}%`}
            tickLine={false}
            axisLine={false}
            width={34}
            tick={{ fontSize: 10, fill: '#11296b', fillOpacity: 0.5 }}
          />
          <ReferenceLine y={95} stroke="#11296b" strokeOpacity={0.45} strokeDasharray="4 3" />
          <Tooltip content={<TrendTooltip />} cursor={{ stroke: '#11296b', strokeOpacity: 0.18 }} />
          <Area type="linear" dataKey="coverage" stroke="none" fill="url(#coverageFill)" isAnimationActive={false} />
          <Line
            type="linear"
            dataKey="coverage"
            stroke="#00509d"
            strokeWidth={2}
            isAnimationActive={false}
            dot={{ r: 2.6, fill: '#ffffff', stroke: '#00509d', strokeWidth: 1.6 }}
            activeDot={{ r: 3.4, fill: '#00509d', stroke: '#ffffff', strokeWidth: 2 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
      <span className="sr-only">{summary}</span>
    </div>
  )
}
