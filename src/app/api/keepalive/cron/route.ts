import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function randomDelay(minMs: number, maxMs: number): Promise<void> {
  const delay = Math.floor(Math.random() * (maxMs - minMs) + minMs);
  return new Promise((resolve) => setTimeout(resolve, delay));
}

export async function GET(request: Request) {
  // Vercel Cron sends "x-vercel-cron: 1" header automatically.
  // Also support CRON_SECRET for manual/local testing via Authorization header.
  const isVercelCron = request.headers.get("x-vercel-cron") === "1";
  const authHeader = request.headers.get("authorization");
  const hasValidSecret =
    process.env.CRON_SECRET &&
    authHeader === `Bearer ${process.env.CRON_SECRET}`;

  if (!isVercelCron && !hasValidSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const now = new Date().toISOString();

  // Fetch all enabled configs (filtering by interval is done in JS below)
  const { data: configs, error: fetchError } = await supabase
    .from("connection_configs")
    .select("*")
    .eq("enabled", true)
    .order("last_attempt_at", { ascending: true, nullsFirst: true });

  if (fetchError) {
    return NextResponse.json(
      { error: "Failed to fetch configs" },
      { status: 500 }
    );
  }

  // Filter configs by their individual interval with random jitter (±20%)
  // This prevents all configs from being pinged at the exact same time
  const dueConfigs = shuffleArray(
    (configs || []).filter((config) => {
      if (!config.last_attempt_at) return true;
      const lastAttempt = new Date(config.last_attempt_at).getTime();
      const intervalMs = config.interval_seconds * 1000;
      // Add random jitter: ±20% of interval
      const jitter = intervalMs * 0.2 * (Math.random() * 2 - 1);
      return Date.now() - lastAttempt >= intervalMs + jitter;
    })
  );

  if (dueConfigs.length === 0) {
    return NextResponse.json({ processed: 0, results: [] });
  }

  // Process all due configs (cron runs every 6h on Hobby plan)
  const results = [];

  for (let i = 0; i < dueConfigs.length; i++) {
    const config = dueConfigs[i];

    // Random delay between requests (300ms - 1500ms) to avoid burst patterns
    if (i > 0) {
      await randomDelay(300, 1500);
    }
    const startTime = Date.now();

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

      // Read response excerpt (max 500 chars)
      let responseExcerpt: string | null = null;
      try {
        const text = await response.text();
        responseExcerpt = text.slice(0, 500);
      } catch {
        responseExcerpt = null;
      }

      // Log the attempt
      await supabase.from("keepalive_logs").insert({
        config_id: config.id,
        status_code: response.status,
        response_excerpt: responseExcerpt,
        duration_ms: durationMs,
      });

      // Update config timestamps
      const updateData: Record<string, string> = {
        last_attempt_at: now,
      };
      if (response.ok) {
        updateData.last_success_at = now;
      }

      await supabase
        .from("connection_configs")
        .update(updateData)
        .eq("id", config.id);

      results.push({
        config_id: config.id,
        alias: config.alias_email,
        status: response.status,
        duration_ms: durationMs,
        success: response.ok,
      });
    } catch (err) {
      const durationMs = Date.now() - startTime;
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error";

      // Log the error
      await supabase.from("keepalive_logs").insert({
        config_id: config.id,
        error_message: errorMessage,
        duration_ms: durationMs,
      });

      // Update last_attempt_at
      await supabase
        .from("connection_configs")
        .update({ last_attempt_at: now })
        .eq("id", config.id);

      results.push({
        config_id: config.id,
        alias: config.alias_email,
        error: errorMessage,
        duration_ms: durationMs,
        success: false,
      });
    }
  }

  return NextResponse.json({
    processed: results.length,
    timestamp: now,
    results,
  });
}
