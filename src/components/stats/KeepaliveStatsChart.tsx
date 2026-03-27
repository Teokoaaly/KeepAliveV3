"use client"

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface KeepaliveStatsData {
  date: string
  successful: number
  failed: number
  total: number
}

interface KeepaliveStatsChartProps {
  data: KeepaliveStatsData[]
  title?: string
}

const chartConfig = {
  successful: {
    label: "SUCCESS",
    color: "hsl(120, 100%, 50%)",
  },
  failed: {
    label: "FAILED",
    color: "hsl(0, 100%, 50%)",
  },
  total: {
    label: "TOTAL",
    color: "hsl(160, 100%, 50%)",
  },
} satisfies ChartConfig

export function KeepaliveStatsChart({
  data,
  title = "KEEP-ALIVE PINGS (LAST 30 DAYS)",
}: KeepaliveStatsChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
          <AreaChart
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
              content={<ChartTooltipContent indicator="dot" />}
            />
            <Area
              dataKey="successful"
              type="natural"
              fill="var(--color-successful)"
              fillOpacity={0.3}
              stroke="var(--color-successful)"
              stackId="a"
            />
            <Area
              dataKey="failed"
              type="natural"
              fill="var(--color-failed)"
              fillOpacity={0.3}
              stroke="var(--color-failed)"
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
