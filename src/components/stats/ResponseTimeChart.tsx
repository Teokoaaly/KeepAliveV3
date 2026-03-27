"use client"

import { Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface ResponseTimeData {
  date: string
  avgDuration: number
  maxDuration: number
  minDuration: number
}

interface ResponseTimeChartProps {
  data: ResponseTimeData[]
  title?: string
}

const chartConfig = {
  avgDuration: {
    label: "AVG (MS)",
    color: "hsl(120, 100%, 50%)",
  },
  maxDuration: {
    label: "MAX (MS)",
    color: "hsl(0, 100%, 50%)",
  },
  minDuration: {
    label: "MIN (MS)",
    color: "hsl(160, 100%, 50%)",
  },
} satisfies ChartConfig

export function ResponseTimeChart({
  data,
  title = "RESPONSE TIMES (LAST 30 DAYS)",
}: ResponseTimeChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
          <LineChart
            accessibilityLayer
            data={data}
            margin={{ left: 12, right: 12 }}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(120, 100%, 20%)" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value.slice(0, 5)}
              tick={{ fill: "hsl(120, 100%, 70%)", fontSize: 10 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickCount={5}
              tick={{ fill: "hsl(120, 100%, 70%)", fontSize: 10 }}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="line" />}
            />
            <Line
              dataKey="avgDuration"
              type="monotone"
              stroke="var(--color-avgDuration)"
              strokeWidth={2}
              dot={false}
            />
            <Line
              dataKey="maxDuration"
              type="monotone"
              stroke="var(--color-maxDuration)"
              strokeWidth={2}
              dot={false}
              strokeDasharray="5 5"
            />
            <Line
              dataKey="minDuration"
              type="monotone"
              stroke="var(--color-minDuration)"
              strokeWidth={2}
              dot={false}
              strokeDasharray="5 5"
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
