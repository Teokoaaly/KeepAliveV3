"use client"

import { useState, useEffect } from "react"
import { Navbar } from "@/components/Navbar"
import {
  OverviewCards,
  KeepaliveStatsChart,
  ResponseTimeChart,
  SuccessRateChart,
  ConfigHealthChart,
  HourlyDistributionChart,
  EndpointStatusChart,
} from "@/components/stats"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2 } from "lucide-react"
import { useLanguage } from "@/lib/i18n/LanguageContext"

interface StatsData {
  overview: {
    totalConfigs: number
    activeConfigs: number
    totalPings: number
    successfulPings: number
    failedPings: number
    avgResponseTime: number
    vercelProjects: number
  }
  dailyStats: Array<{
    date: string
    successful: number
    failed: number
    total: number
  }>
  responseTimes: Array<{
    date: string
    avgDuration: number
    maxDuration: number
    minDuration: number
  }>
  configHealth: Array<{
    config: string
    successRate: number
    totalPings: number
  }>
  hourlyDistribution: Array<{
    hour: string
    pings: number
  }>
  endpointStatus: {
    healthy: number
    stale: number
    disabled: number
  }
}

export default function StatsPage() {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { t } = useLanguage()

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/stats")
      if (!response.ok) {
        throw new Error("ERROR: FAILED TO LOAD STATISTICS")
      }
      const data = await response.json()
      setStats(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "ERROR: UNKNOWN EXCEPTION")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div>
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-4 text-primary uppercase tracking-wider">LOADING DATA...</span>
          </div>
        </main>
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="py-8">
              <p className="text-destructive text-center font-bold uppercase tracking-wider animate-pulse">
                [!] {error}
              </p>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  if (!stats) {
    return null
  }

  return (
    <div>
      <Navbar />
      <main className="container mx-auto px-4 py-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-primary glow-text uppercase tracking-[3px]">
            {t("statsTitle")}
          </h1>
          <p className="text-muted-foreground mt-2 uppercase tracking-wider">
            {t("statsSubtitle")}
          </p>
        </div>

        <OverviewCards
          totalConfigs={stats.overview.totalConfigs}
          activeConfigs={stats.overview.activeConfigs}
          totalPings={stats.overview.totalPings}
          successfulPings={stats.overview.successfulPings}
          failedPings={stats.overview.failedPings}
          avgResponseTime={stats.overview.avgResponseTime}
          vercelProjects={stats.overview.vercelProjects}
        />

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">[{t("overview")}]</TabsTrigger>
            <TabsTrigger value="performance">[{t("responseTime")}]</TabsTrigger>
            <TabsTrigger value="distribution">[{t("hourly")}]</TabsTrigger>
            <TabsTrigger value="health">[{t("configHealth")}]</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <KeepaliveStatsChart data={stats.dailyStats} />
              <SuccessRateChart
                successful={stats.overview.successfulPings}
                failed={stats.overview.failedPings}
              />
            </div>
            <EndpointStatusChart
              healthy={stats.endpointStatus.healthy}
              stale={stats.endpointStatus.stale}
              disabled={stats.endpointStatus.disabled}
            />
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <ResponseTimeChart data={stats.responseTimes} />
            <Card>
              <CardHeader>
                <CardTitle>{t("responseTime")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground uppercase tracking-wider">
                      {t("avgResponse")}
                    </p>
                    <p className="text-2xl font-bold text-primary glow-text">
                      {stats.overview.avgResponseTime}MS
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground uppercase tracking-wider">
                      {t("totalPings")}
                    </p>
                    <p className="text-2xl font-bold text-primary glow-text">
                      {stats.overview.totalPings.toLocaleString()}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground uppercase tracking-wider">
                      {t("successRateValue")}
                    </p>
                    <p className="text-2xl font-bold text-primary glow-text">
                      {stats.overview.totalPings > 0
                        ? (
                            (stats.overview.successfulPings /
                              stats.overview.totalPings) *
                            100
                          ).toFixed(1)
                        : "0"}
                      %
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="distribution" className="space-y-4">
            <HourlyDistributionChart data={stats.hourlyDistribution} />
          </TabsContent>

          <TabsContent value="health" className="space-y-4">
            <ConfigHealthChart data={stats.configHealth} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
