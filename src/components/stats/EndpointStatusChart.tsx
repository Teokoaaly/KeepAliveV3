"use client"

import { Pie, PieChart, Cell } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface EndpointStatusData {
  name: string
  value: number
  fill: string
}

interface EndpointStatusChartProps {
  healthy: number
  stale: number
  disabled: number
  title?: string
}

const chartConfig = {
  healthy: {
    label: "HEALTHY",
    color: "hsl(120, 100%, 50%)",
  },
  stale: {
    label: "STALE",
    color: "hsl(60, 100%, 50%)",
  },
  disabled: {
    label: "DISABLED",
    color: "hsl(120, 100%, 30%)",
  },
} satisfies ChartConfig

export function EndpointStatusChart({
  healthy,
  stale,
  disabled,
  title = "ENDPOINT STATUS",
}: EndpointStatusChartProps) {
  const data: EndpointStatusData[] = [
    { name: "healthy", value: healthy, fill: "var(--color-healthy)" },
    { name: "stale", value: stale, fill: "var(--color-stale)" },
    { name: "disabled", value: disabled, fill: "var(--color-disabled)" },
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
        <div className="grid grid-cols-3 gap-2 mt-4 text-center">
          <div>
            <div className="text-lg font-bold text-green-400 glow-text">{healthy}</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider">HEALTHY</div>
          </div>
          <div>
            <div className="text-lg font-bold text-yellow-400">{stale}</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider">STALE</div>
          </div>
          <div>
            <div className="text-lg font-bold text-muted-foreground">{disabled}</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider">DISABLED</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
