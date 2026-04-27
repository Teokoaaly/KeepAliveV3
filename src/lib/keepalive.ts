import { SupabaseClient } from "@supabase/supabase-js";
import { decryptServiceRoleKey } from "@/lib/crypto";

/**
 * Configuration for a keepalive connection.
 * Represents a row from the connection_configs table.
 */
export interface KeepaliveConfig {
  id: string;
  alias_email: string;
  keepalive_endpoint_url: string;
  keepalive_method: string;
  keepalive_headers?: Record<string, string>;
  keepalive_body?: string | object | null;
  interval_seconds: number;
  last_attempt_at?: string | null;
  anon_key?: string;
  supabase_url?: string;
  service_role_key_encrypted?: string | null;
}

/**
 * Result of a keepalive execution, suitable for API responses.
 */
export interface KeepaliveResult {
  config_id: string;
  alias: string;
  status?: number;
  duration_ms: number;
  success: boolean;
  error?: string;
  response_excerpt?: string | null;
}

/**
 * Internal execution result from a single keepalive attempt.
 */
export interface KeepaliveExecutionResult {
  statusCode?: number;
  durationMs: number;
  responseExcerpt: string | null;
  success: boolean;
  error?: string;
}

/**
 * Execution result with retry metadata.
 */
export interface KeepaliveRetryResult extends KeepaliveExecutionResult {
  retries: number;
}

export const MIN_KEEPALIVE_INTERVAL_SECONDS = 60;
export const DEFAULT_KEEPALIVE_INTERVAL_SECONDS = 4 * 60 * 60;
export const MAX_KEEPALIVE_INTERVAL_SECONDS = 4 * 60 * 60;
const MIN_RANDOM_KEEPALIVE_INTERVAL_SECONDS = 60 * 60;

function deterministicRandom(seed: string): number {
  let hash = 2166136261;

  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0) / 4294967295;
}

export function getKeepaliveDueIntervalSeconds(config: KeepaliveConfig): number {
  const configuredMaxSeconds = Math.min(
    Math.max(
      Number.isFinite(config.interval_seconds)
        ? config.interval_seconds
        : DEFAULT_KEEPALIVE_INTERVAL_SECONDS,
      MIN_KEEPALIVE_INTERVAL_SECONDS
    ),
    MAX_KEEPALIVE_INTERVAL_SECONDS
  );

  const minSeconds = Math.min(
    configuredMaxSeconds,
    MIN_RANDOM_KEEPALIVE_INTERVAL_SECONDS
  );

  if (configuredMaxSeconds <= minSeconds) {
    return configuredMaxSeconds;
  }

  const seed = `${config.id}:${config.last_attempt_at ?? "never"}`;
  const randomOffset =
    deterministicRandom(seed) * (configuredMaxSeconds - minSeconds);

  return Math.round(minSeconds + randomOffset);
}

function shouldFallbackToAuthHealth(
  config: KeepaliveConfig,
  result: KeepaliveExecutionResult
) {
  const normalizedEndpoint = config.keepalive_endpoint_url.replace(/\/+$/, "");
  const normalizedSupabaseRest = config.supabase_url
    ? `${config.supabase_url.replace(/\/+$/, "")}/rest/v1`
    : null;
  const isNetworkFailure =
    result.statusCode === undefined &&
    typeof result.error === "string" &&
    /(ENOTFOUND|EAI_AGAIN|ECONNREFUSED|ETIMEDOUT|fetch failed)/i.test(
      result.error
    );
  const isDefaultSupabaseRestEndpoint =
    !!normalizedSupabaseRest && normalizedEndpoint === normalizedSupabaseRest;

  return (
    !!config.supabase_url &&
    isDefaultSupabaseRestEndpoint &&
    ((!config.service_role_key_encrypted && result.statusCode === 401) ||
      isNetworkFailure)
  );
}

function toAuthHealthConfig(config: KeepaliveConfig): KeepaliveConfig {
  const baseUrl = config.supabase_url!.replace(/\/+$/, "");
  const anonKey = config.anon_key;

  return {
    ...config,
    keepalive_endpoint_url: `${baseUrl}/auth/v1/health`,
    keepalive_method: "GET",
    keepalive_body: null,
    keepalive_headers: anonKey
      ? {
          ...(config.keepalive_headers || {}),
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
        }
      : config.keepalive_headers,
  };
}

async function resolveKeepaliveConfig(
  config: KeepaliveConfig
): Promise<KeepaliveConfig> {
  if (!config.service_role_key_encrypted) {
    return config;
  }

  const serviceRoleKey = await decryptServiceRoleKey(
    config.service_role_key_encrypted
  );

  return {
    ...config,
    keepalive_headers: {
      ...(config.keepalive_headers || {}),
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
    },
  };
}

/**
 * Performs a single keepalive HTTP request.
 *
 * - Uses a 10-second timeout via AbortSignal.
 * - Constructs headers with Content-Type and any custom headers.
 * - Handles POST body serialization.
 * - Returns success/failure with response excerpt (max 500 chars).
 */
export async function executeKeepalive(
  config: KeepaliveConfig
): Promise<KeepaliveExecutionResult> {
  const startTime = Date.now();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(config.keepalive_headers || {}),
  };

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

  try {
    const response = await fetch(config.keepalive_endpoint_url, fetchOptions);
    const durationMs = Date.now() - startTime;

    let responseExcerpt: string | null = null;
    try {
      const text = await response.text();
      responseExcerpt = text.slice(0, 500);
    } catch {
      responseExcerpt = null;
    }

    return {
      statusCode: response.status,
      durationMs,
      responseExcerpt,
      success: response.ok,
      error: response.ok
        ? undefined
        : `Endpoint responded with HTTP ${response.status}`,
    };
  } catch (err) {
    const durationMs = Date.now() - startTime;
    const errorMessage =
      err instanceof Error
        ? (() => {
            const causeCode =
              typeof (err as Error & { cause?: { code?: string } }).cause?.code === "string"
                ? (err as Error & { cause?: { code?: string } }).cause?.code
                : null;

            return causeCode ? `${err.message} (${causeCode})` : err.message;
          })()
        : "Unknown error";

    return {
      durationMs,
      responseExcerpt: null,
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Wraps executeKeepalive with exponential backoff retry logic.
 *
 * - Retries only on network errors (no HTTP response received).
 * - HTTP error responses (4xx, 5xx) are NOT retried — they are valid responses.
 * - Default: max 2 retries, initial delay 1000ms, doubling each attempt.
 */
export async function executeKeepaliveWithRetry(
  config: KeepaliveConfig,
  maxRetries = 2,
  initialDelayMs = 1000
): Promise<KeepaliveRetryResult> {
  let lastResult = await executeKeepalive(config);
  let retries = 0;

  // Only retry on network errors (no status code means the request never completed)
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    if (lastResult.statusCode !== undefined) {
      break;
    }

    const delayMs = initialDelayMs * Math.pow(2, attempt);
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    retries++;
    lastResult = await executeKeepalive(config);
  }

  return { ...lastResult, retries };
}

/**
 * Logs a keepalive result to the database.
 *
 * Inserts a record into keepalive_logs and updates the config's
 * last_attempt_at (and last_success_at if successful).
 */
export async function logKeepaliveResult(
  supabase: SupabaseClient,
  configId: string,
  result: KeepaliveExecutionResult,
  timestamp: string
): Promise<void> {
  if (result.statusCode !== undefined) {
    await supabase.from("keepalive_logs").insert({
      config_id: configId,
      status_code: result.statusCode,
      response_excerpt: result.responseExcerpt,
      duration_ms: result.durationMs,
    });
  } else {
    await supabase.from("keepalive_logs").insert({
      config_id: configId,
      error_message: result.error,
      duration_ms: result.durationMs,
    });
  }

  const updateData: Record<string, string> = {
    last_attempt_at: timestamp,
  };
  if (result.success) {
    updateData.last_success_at = timestamp;
  }

  await supabase
    .from("connection_configs")
    .update(updateData)
    .eq("id", configId);
}

/**
 * Executes a keepalive request and persists its result.
 */
export async function executeAndLogKeepalive(
  supabase: SupabaseClient,
  config: KeepaliveConfig,
  timestamp = new Date().toISOString()
): Promise<KeepaliveExecutionResult> {
  const resolvedConfig = await resolveKeepaliveConfig(config);
  let result = await executeKeepalive(resolvedConfig);

  if (shouldFallbackToAuthHealth(resolvedConfig, result)) {
    result = await executeKeepalive(toAuthHealthConfig(resolvedConfig));
  }

  await logKeepaliveResult(supabase, config.id, result, timestamp);
  return result;
}

/**
 * Formats a keepalive execution result for API responses.
 */
export function toKeepaliveResult(
  config: KeepaliveConfig,
  result: KeepaliveExecutionResult
): KeepaliveResult {
  return {
    config_id: config.id,
    alias: config.alias_email,
    status: result.statusCode,
    duration_ms: result.durationMs,
    success: result.success,
    error: result.error,
    response_excerpt: result.responseExcerpt,
  };
}

/**
 * Checks if a config is due for execution based on a deterministic random
 * interval per config and last attempt, capped at four hours.
 *
 * Configs without a last_attempt_at are always considered due.
 */
export function isConfigDue(config: KeepaliveConfig): boolean {
  if (!config.last_attempt_at) return true;

  const lastAttempt = new Date(config.last_attempt_at).getTime();
  const intervalMs = getKeepaliveDueIntervalSeconds(config) * 1000;

  return Date.now() - lastAttempt >= intervalMs;
}
