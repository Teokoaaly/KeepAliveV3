import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { encryptServiceRoleKey, decryptServiceRoleKey } from "@/lib/crypto"

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
    // Obtener configuración de Vercel del usuario
    const { data: config, error: configError } = await supabase
      .from("vercel_configs")
      .select("*")
      .eq("user_id", user.id)
      .single()

    if (configError || !config) {
      return NextResponse.json(
        { error: "No Vercel configuration found" },
        { status: 404 }
      )
    }

    // Decrypt the Vercel token before use
    const vercelToken = await decryptServiceRoleKey(config.token_encrypted)

    // Obtener proyectos de Vercel
    const vercelResponse = await fetch(
      "https://api.vercel.com/v9/projects?limit=100",
      {
        headers: {
          Authorization: `Bearer ${vercelToken}`,
          ...(config.team_id ? { "X-Vercel-Team-Id": config.team_id } : {}),
        },
      }
    )

    if (!vercelResponse.ok) {
      return NextResponse.json(
        { error: "Failed to fetch Vercel projects" },
        { status: 500 }
      )
    }

    const vercelData = await vercelResponse.json()

    // Obtener estadísticas de uso para cada proyecto
    const projectsWithStats = await Promise.all(
      vercelData.projects.map(async (project: { id: string; name: string }) => {
        try {
          // Obtener deployments recientes
          const deploymentsResponse = await fetch(
            `https://api.vercel.com/v6/deployments?projectId=${project.id}&limit=10`,
            {
              headers: {
                Authorization: `Bearer ${vercelToken}`,
                ...(config.team_id
                  ? { "X-Vercel-Team-Id": config.team_id }
                  : {}),
              },
            }
          )

          const deployments = deploymentsResponse.ok
            ? await deploymentsResponse.json()
            : { deployments: [] }

          // Calcular estadísticas básicas
          const totalDeployments = deployments.deployments?.length || 0
          const successfulDeployments =
            deployments.deployments?.filter(
              (d: { state: string }) => d.state === "READY"
            ).length || 0
          const failedDeployments =
            deployments.deployments?.filter(
              (d: { state: string }) => d.state === "ERROR"
            ).length || 0

          return {
            id: project.id,
            name: project.name,
            totalDeployments,
            successfulDeployments,
            failedDeployments,
            lastDeployment:
              deployments.deployments?.[0]?.created || null,
          }
        } catch {
          return {
            id: project.id,
            name: project.name,
            totalDeployments: 0,
            successfulDeployments: 0,
            failedDeployments: 0,
            lastDeployment: null,
          }
        }
      })
    )

    // Calcular estadísticas generales
    const totalProjects = projectsWithStats.length
    const totalDeployments = projectsWithStats.reduce(
      (sum, p) => sum + p.totalDeployments,
      0
    )
    const successfulDeployments = projectsWithStats.reduce(
      (sum, p) => sum + p.successfulDeployments,
      0
    )
    const failedDeployments = projectsWithStats.reduce(
      (sum, p) => sum + p.failedDeployments,
      0
    )

    return NextResponse.json({
      overview: {
        totalProjects,
        totalDeployments,
        successfulDeployments,
        failedDeployments,
        successRate:
          totalDeployments > 0
            ? Math.round((successfulDeployments / totalDeployments) * 100)
            : 0,
      },
      projects: projectsWithStats,
    })
  } catch (error) {
    console.error("Error fetching Vercel data:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { token, team_id } = await request.json()

    if (!token) {
      return NextResponse.json(
        { error: "Vercel token is required" },
        { status: 400 }
      )
    }

    // Verificar que el token es válido
    const vercelResponse = await fetch("https://api.vercel.com/v2/user", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!vercelResponse.ok) {
      return NextResponse.json(
        { error: "Invalid Vercel token" },
        { status: 400 }
      )
    }

    // Encriptar el token antes de guardarlo
    const encryptedToken = await encryptServiceRoleKey(token)

    // Guardar o actualizar configuración de Vercel
    const { data, error } = await supabase
      .from("vercel_configs")
      .upsert(
        {
          user_id: user.id,
          token_encrypted: encryptedToken,
          team_id: team_id || null,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id",
        }
      )
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: "Failed to save Vercel configuration" },
        { status: 500 }
      )
    }

    return NextResponse.json({ config: data }, { status: 201 })
  } catch (error) {
    console.error("Error saving Vercel config:", error)
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    )
  }
}

export async function DELETE() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { error } = await supabase
      .from("vercel_configs")
      .delete()
      .eq("user_id", user.id)

    if (error) {
      return NextResponse.json(
        { error: "Failed to delete Vercel configuration" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting Vercel config:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
