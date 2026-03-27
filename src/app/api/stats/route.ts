import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Obtener configuraciones del usuario
    const { data: configs, error: configsError } = await supabase
      .from("connection_configs")
      .select("*")
      .eq("user_id", user.id)

    if (configsError) {
      return NextResponse.json(
        { error: "Error fetching configs" },
        { status: 500 }
      )
    }

    // Obtener logs de los últimos 30 días
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: logs, error: logsError } = await supabase
      .from("keepalive_logs")
      .select("*")
      .in(
        "config_id",
        configs?.map((c) => c.id) || []
      )
      .gte("attempted_at", thirtyDaysAgo.toISOString())
      .order("attempted_at", { ascending: true })

    if (logsError) {
      return NextResponse.json(
        { error: "Error fetching logs" },
        { status: 500 }
      )
    }

    // Calcular estadísticas generales
    const totalConfigs = configs?.length || 0
    const activeConfigs = configs?.filter((c) => c.enabled).length || 0
    const totalPings = logs?.length || 0
    const successfulPings =
      logs?.filter((l) => l.status_code && l.status_code < 400).length || 0
    const failedPings = totalPings - successfulPings
    const avgResponseTime =
      logs && logs.length > 0
        ? Math.round(
            logs.reduce((sum, l) => sum + (l.duration_ms || 0), 0) / logs.length
          )
        : 0

    // Calcular estadísticas diarias
    const dailyStatsMap = new Map<
      string,
      { successful: number; failed: number; total: number }
    >()

    logs?.forEach((log) => {
      const date = new Date(log.attempted_at).toISOString().split("T")[0]
      const existing = dailyStatsMap.get(date) || {
        successful: 0,
        failed: 0,
        total: 0,
      }

      if (log.status_code && log.status_code < 400) {
        existing.successful++
      } else {
        existing.failed++
      }
      existing.total++

      dailyStatsMap.set(date, existing)
    })

    const dailyStats = Array.from(dailyStatsMap.entries()).map(
      ([date, stats]) => ({
        date,
        ...stats,
      })
    )

    // Calcular tiempos de respuesta por día
    const responseTimesMap = new Map<
      string,
      { durations: number[]; avgDuration: number; maxDuration: number; minDuration: number }
    >()

    logs?.forEach((log) => {
      if (log.duration_ms !== null) {
        const date = new Date(log.attempted_at).toISOString().split("T")[0]
        const existing = responseTimesMap.get(date) || {
          durations: [],
          avgDuration: 0,
          maxDuration: 0,
          minDuration: Infinity,
        }

        existing.durations.push(log.duration_ms)
        existing.maxDuration = Math.max(existing.maxDuration, log.duration_ms)
        existing.minDuration = Math.min(existing.minDuration, log.duration_ms)
        existing.avgDuration =
          existing.durations.reduce((sum, d) => sum + d, 0) /
          existing.durations.length

        responseTimesMap.set(date, existing)
      }
    })

    const responseTimes = Array.from(responseTimesMap.entries()).map(
      ([date, stats]) => ({
        date,
        avgDuration: Math.round(stats.avgDuration),
        maxDuration: stats.maxDuration,
        minDuration: stats.minDuration === Infinity ? 0 : stats.minDuration,
      })
    )

    // Calcular salud por configuración
    const configHealthMap = new Map<
      string,
      { successful: number; total: number }
    >()

    logs?.forEach((log) => {
      const config = configs?.find((c) => c.id === log.config_id)
      if (config) {
        const existing = configHealthMap.get(config.alias_email) || {
          successful: 0,
          total: 0,
        }

        if (log.status_code && log.status_code < 400) {
          existing.successful++
        }
        existing.total++

        configHealthMap.set(config.alias_email, existing)
      }
    })

    const configHealth = Array.from(configHealthMap.entries()).map(
      ([config, stats]) => ({
        config,
        successRate:
          stats.total > 0
            ? Math.round((stats.successful / stats.total) * 100)
            : 0,
        totalPings: stats.total,
      })
    )

    // Calcular distribución por hora
    const hourlyDistributionMap = new Map<string, number>()

    for (let i = 0; i < 24; i++) {
      hourlyDistributionMap.set(i.toString().padStart(2, "0"), 0)
    }

    logs?.forEach((log) => {
      const hour = new Date(log.attempted_at)
        .getHours()
        .toString()
        .padStart(2, "0")
      const existing = hourlyDistributionMap.get(hour) || 0
      hourlyDistributionMap.set(hour, existing + 1)
    })

    const hourlyDistribution = Array.from(hourlyDistributionMap.entries()).map(
      ([hour, pings]) => ({
        hour,
        pings,
      })
    )

    // Calcular estado de endpoints
    const now = new Date()
    const endpointStatus = {
      healthy: 0,
      stale: 0,
      disabled: 0,
    }

    configs?.forEach((config) => {
      if (!config.enabled) {
        endpointStatus.disabled++
      } else if (!config.last_success_at) {
        endpointStatus.stale++
      } else {
        const lastSuccess = new Date(config.last_success_at)
        const minutesAgo = Math.floor(
          (now.getTime() - lastSuccess.getTime()) / 60000
        )
        const intervalMinutes = config.interval_seconds / 60

        if (minutesAgo < intervalMinutes + 5) {
          endpointStatus.healthy++
        } else {
          endpointStatus.stale++
        }
      }
    })

    // Contar proyectos de Vercel (placeholder - se implementará con la integración de Vercel)
    const vercelProjects = 0

    return NextResponse.json({
      overview: {
        totalConfigs,
        activeConfigs,
        totalPings,
        successfulPings,
        failedPings,
        avgResponseTime,
        vercelProjects,
      },
      dailyStats,
      responseTimes,
      configHealth,
      hourlyDistribution,
      endpointStatus,
    })
  } catch (error) {
    console.error("Error fetching stats:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
