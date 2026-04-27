import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { executeAndLogKeepalive } from "@/lib/keepalive";
import { verifyManualPingToken } from "@/lib/manual-ping-token";

export async function POST(request: Request) {
  try {
    const admin = createAdminClient();
    let user: { id: string } | null = null;
    let authorizedConfigId: string | null = null;

    const authorization = request.headers.get("authorization");
    const bearerToken = authorization?.startsWith("Bearer ")
      ? authorization.slice("Bearer ".length)
      : null;

    if (bearerToken) {
      const {
        data: { user: bearerUser },
        error: bearerError,
      } = await admin.auth.getUser(bearerToken);

      if (!bearerError && bearerUser) {
        user = bearerUser;
      }
    }

    const requestBody = await request.json().catch(() => null);

    if (!requestBody || typeof requestBody.config_id !== "string") {
      return NextResponse.json(
        { error: "config_id is required" },
        { status: 400 }
      );
    }

    if (typeof requestBody.manual_ping_token === "string") {
      const payload = verifyManualPingToken(requestBody.manual_ping_token);

      if (payload && payload.configId === requestBody.config_id) {
        user = { id: payload.userId };
        authorizedConfigId = payload.configId;
      }
    }

    if (!user) {
      const supabase = await createClient();
      const {
        data: { user: cookieUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !cookieUser) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      user = cookieUser;
    }

    const configId = requestBody.config_id;

    const { data: config, error: configError } = await admin
      .from("connection_configs")
      .select("*")
      .eq("id", authorizedConfigId ?? configId)
      .eq("user_id", user.id)
      .single();

    if (configError && configError.code !== "PGRST116") {
      return NextResponse.json(
        { error: "Failed to load configuration" },
        { status: 500 }
      );
    }

    if (!config) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const now = new Date().toISOString();

    try {
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
      }, { status: 500 });
    }
  } catch (err) {
    return NextResponse.json({
      error: err instanceof Error ? err.message : "Request failed",
    }, { status: 500 });
  }
}
