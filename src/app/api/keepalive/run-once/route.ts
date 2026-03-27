import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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

    const startTime = Date.now();
    const now = new Date().toISOString();

    try {
      // Build headers
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(config.keepalive_headers || {}),
      };

      // Build fetch options
      const fetchOptions: RequestInit = {
        method: config.keepalive_method,
        headers,
        signal: AbortSignal.timeout(10000),
      };

      if (config.keepalive_method === "POST" && config.keepalive_body) {
        fetchOptions.body =
          typeof config.keepalive_body === "string"
            ? config.keepalive_body
            : JSON.stringify(config.keepalive_body);
      }

      const response = await fetch(config.keepalive_endpoint_url, fetchOptions);
      const durationMs = Date.now() - startTime;

      let responseExcerpt: string | null = null;
      try {
        const text = await response.text();
        responseExcerpt = text.slice(0, 500);
      } catch {
        responseExcerpt = null;
      }

      // Use admin client for writes (bypass RLS for timestamp updates)
      const admin = createAdminClient();

      await admin.from("keepalive_logs").insert({
        config_id: config.id,
        status_code: response.status,
        response_excerpt: responseExcerpt,
        duration_ms: durationMs,
      });

      const updateData: Record<string, string> = {
        last_attempt_at: now,
      };
      if (response.ok) {
        updateData.last_success_at = now;
      }

      await admin
        .from("connection_configs")
        .update(updateData)
        .eq("id", config.id);

      return NextResponse.json({
        success: true,
        status: response.status,
        duration_ms: durationMs,
        response_excerpt: responseExcerpt,
      });
    } catch (err) {
      const durationMs = Date.now() - startTime;
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error";

      const admin = createAdminClient();

      await admin.from("keepalive_logs").insert({
        config_id: config.id,
        error_message: errorMessage,
        duration_ms: durationMs,
      });

      await admin
        .from("connection_configs")
        .update({ last_attempt_at: now })
        .eq("id", config.id);

      return NextResponse.json({
        success: false,
        error: errorMessage,
        duration_ms: durationMs,
      });
    }
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
