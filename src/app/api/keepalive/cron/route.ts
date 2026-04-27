import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  executeAndLogKeepalive,
  isConfigDue,
  toKeepaliveResult,
} from "@/lib/keepalive";

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
  try {
    // Vercel Cron sends a vercel-cron user agent. When CRON_SECRET is configured,
    // Vercel also sends Authorization: Bearer <CRON_SECRET>.
    const isVercelCron =
      request.headers.get("x-vercel-cron") === "1" ||
      request.headers.get("user-agent")?.includes("vercel-cron/1.0");
    const authHeader = request.headers.get("authorization");
    const hasValidSecret =
      process.env.CRON_SECRET &&
      authHeader === `Bearer ${process.env.CRON_SECRET}`;

    if (process.env.CRON_SECRET ? !hasValidSecret : !isVercelCron) {
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
        { error: `Failed to fetch configs: ${fetchError.message}` },
        { status: 500 }
      );
    }

    // Filter configs by their individual deterministic random interval.
    // This prevents all configs from being pinged at the exact same time.
    const dueConfigs = shuffleArray((configs || []).filter(isConfigDue));

    if (dueConfigs.length === 0) {
      return NextResponse.json({ processed: 0, results: [] });
    }

    // Process all due configs.
    const results = [];

    for (let i = 0; i < dueConfigs.length; i++) {
      const config = dueConfigs[i];

      // Random delay between requests (300ms - 1500ms) to avoid burst patterns
      if (i > 0) {
        await randomDelay(300, 1500);
      }
      try {
        const result = await executeAndLogKeepalive(supabase, config, now);
        results.push(toKeepaliveResult(config, result));
      } catch (err) {
        results.push({
          config_id: config.id,
          alias: config.alias_email,
          error: err instanceof Error ? err.message : "Unknown error",
          duration_ms: 0,
          success: false,
        });
      }
    }

    return NextResponse.json({
      processed: results.length,
      timestamp: now,
      results,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Cron failed" },
      { status: 500 }
    );
  }
}
