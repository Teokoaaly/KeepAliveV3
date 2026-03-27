"use client"

import { Pie, PieChart, Cell } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface SuccessRateData {
  name: string
  value: number
  fill: string
}

interface SuccessRateChartProps {
  successful: number
  failed: number
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
} satisfies ChartConfig

export function SuccessRateChart({
  successful,
  failed,
  title = "SUCCESS RATE",
}: SuccessRateChartProps) {
  const total = successful + failed
  const successRate = total > 0 ? ((successful / total) * 100).toFixed(1) : "0"

  const data: SuccessRateData[] = [
    { name: "successful", value: successful, fill: "var(--color-successful)" },
    { name: "failed", value: failed, fill: "var(--color-failed)" },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={60}
              strokeWidth={5}
              stroke="hsl(120, 100%, 10%)"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
        <div className="flex flex-col items-center gap-2 mt-4">
          <div className="text-3xl font-bold text-primary glow-text">{successRate}%</div>
          <div className="text-sm text-muted-foreground uppercase tracking-wider">
            {successful} SUCCESS / {failed} FAILED / {total} TOTAL
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
