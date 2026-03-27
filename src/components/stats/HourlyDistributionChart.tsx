"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface HourlyDistributionData {
  hour: string
  pings: number
}

interface HourlyDistributionChartProps {
  data: HourlyDistributionData[]
  title?: string
}

const chartConfig = {
  pings: {
    label: "PINGS",
    color: "hsl(120, 100%, 50%)",
  },
} satisfies ChartConfig

export function HourlyDistributionChart({
  data,
  title = "PING DISTRIBUTION BY HOUR",
}: HourlyDistributionChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
          <BarChart
            accessibilityLayer
            data={data}
            margin={{ left: 12, right: 12 }}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(120, 100%, 20%)" />
            <XAxis
              dataKey="hour"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => `${value}H`}
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
            <Bar dataKey="pings" fill="var(--color-pings)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
