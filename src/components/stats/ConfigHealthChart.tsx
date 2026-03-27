"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Cell } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface ConfigHealthData {
  config: string
  successRate: number
  totalPings: number
}

interface ConfigHealthChartProps {
  data: ConfigHealthData[]
  title?: string
}

const chartConfig = {
  successRate: {
    label: "SUCCESS RATE (%)",
    color: "hsl(120, 100%, 50%)",
  },
} satisfies ChartConfig

export function ConfigHealthChart({
  data,
  title = "HEALTH BY CONFIGURATION",
}: ConfigHealthChartProps) {
  const getBarColor = (successRate: number) => {
    if (successRate >= 95) return "hsl(120, 100%, 50%)"
    if (successRate >= 80) return "hsl(60, 100%, 50%)"
    return "hsl(0, 100%, 50%)"
  }

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
            layout="vertical"
          >
            <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="hsl(120, 100%, 20%)" />
            <XAxis
              type="number"
              domain={[0, 100]}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickCount={5}
              tick={{ fill: "hsl(120, 100%, 70%)", fontSize: 10 }}
            />
            <YAxis
              dataKey="config"
              type="category"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              width={100}
              tickFormatter={(value) => value.slice(0, 12)}
              tick={{ fill: "hsl(120, 100%, 70%)", fontSize: 10 }}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="line" />}
            />
            <Bar dataKey="successRate" radius={4}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={getBarColor(entry.successRate)}
                />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
