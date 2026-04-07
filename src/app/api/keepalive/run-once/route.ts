import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { executeAndLogKeepalive } from "@/lib/keepalive";

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { config_id } = await request.json();

    if (!config_id) {
      return NextResponse.json(
        { error: "config_id is required" },
        { status: 400 }
      );
    }

    // Verify ownership via RLS (regular client)
    const { data: config } = await supabase
      .from("connection_configs")
      .select("*")
      .eq("id", config_id)
      .single();

    if (!config) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const now = new Date().toISOString();

    try {
      const admin = createAdminClient();
      const result = await executeAndLogKeepalive(admin, config, now);

      return NextResponse.json({
        success: result.success,
        status: result.statusCode,
        duration_ms: result.durationMs,
        response_excerpt: result.responseExcerpt,
        error: result.error,
      });
    } catch (err) {
      return NextResponse.json({
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
        duration_ms: 0,
      });
    }
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
