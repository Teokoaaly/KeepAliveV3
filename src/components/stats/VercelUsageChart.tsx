"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface VercelUsageData {
  project: string
  bandwidth: number
  functions: number
  builds: number
}

interface VercelUsageChartProps {
  data: VercelUsageData[]
  title?: string
}

const chartConfig = {
  bandwidth: {
    label: "BANDWIDTH (GB)",
    color: "hsl(120, 100%, 50%)",
  },
  functions: {
    label: "FUNCTIONS (INVOCATIONS)",
    color: "hsl(160, 100%, 50%)",
  },
  builds: {
    label: "BUILDS",
    color: "hsl(60, 100%, 50%)",
  },
} satisfies ChartConfig

export function VercelUsageChart({
  data,
  title = "VERCEL USAGE BY PROJECT",
}: VercelUsageChartProps) {
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
              dataKey="project"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value.slice(0, 10)}
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
              content={<ChartTooltipContent indicator="dashed" />}
            />
            <Bar
              dataKey="bandwidth"
              fill="var(--color-bandwidth)"
              radius={4}
            />
            <Bar
              dataKey="functions"
              fill="var(--color-functions)"
              radius={4}
            />
            <Bar dataKey="builds" fill="var(--color-builds)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
