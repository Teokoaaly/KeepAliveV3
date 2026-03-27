"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useLanguage } from "@/lib/i18n/LanguageContext"
import {
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  Server,
  Zap,
} from "lucide-react"

interface OverviewCardsProps {
  totalConfigs: number
  activeConfigs: number
  totalPings: number
  successfulPings: number
  failedPings: number
  avgResponseTime: number
  vercelProjects: number
}

export function OverviewCards({
  totalConfigs,
  activeConfigs,
  totalPings,
  successfulPings,
  failedPings,
  avgResponseTime,
  vercelProjects,
}: OverviewCardsProps) {
  const { t } = useLanguage()
  const successRate =
    totalPings > 0 ? ((successfulPings / totalPings) * 100).toFixed(1) : "0"

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-bold uppercase tracking-wider">
            CONFIGS
          </CardTitle>
          <Server className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary glow-text">{totalConfigs}</div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">
            {activeConfigs} {t("active")} {totalConfigs} {t("totalConfigs")}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-bold uppercase tracking-wider">
            {t("totalPings")}
          </CardTitle>
          <Activity className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary glow-text">{totalPings.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">
            {successfulPings.toLocaleString()} {t("successful")} /{" "}
            {failedPings.toLocaleString()} {t("failed")}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-bold uppercase tracking-wider">{t("successRateValue")}</CardTitle>
          {Number(successRate) >= 95 ? (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          ) : Number(successRate) >= 80 ? (
            <Clock className="h-4 w-4 text-yellow-500" />
          ) : (
            <XCircle className="h-4 w-4 text-destructive" />
          )}
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary glow-text">{successRate}%</div>
          <Badge
            variant={
              Number(successRate) >= 95
                ? "success"
                : Number(successRate) >= 80
                ? "secondary"
                : "destructive"
            }
          >
            {Number(successRate) >= 95
              ? "[EXCELLENT]"
              : Number(successRate) >= 80
              ? "[GOOD]"
              : "[ATTENTION]"}
          </Badge>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-bold uppercase tracking-wider">
            {t("avgResponse")}
          </CardTitle>
          <Zap className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary glow-text">{avgResponseTime}MS</div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">
            {t("totalPings")}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-bold uppercase tracking-wider">
            VERCEL
          </CardTitle>
          <Server className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary glow-text">{vercelProjects}</div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">
            {t("vercelUsage")}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
