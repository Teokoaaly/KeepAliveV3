import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { encryptServiceRoleKey } from "@/lib/crypto";

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("connection_configs")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Never expose the encrypted key — replace with a boolean flag
  const configs = (data || []).map((config) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { service_role_key_encrypted, ...rest } = config;
    return {
      ...rest,
      has_service_role: !!config.service_role_key_encrypted,
    };
  });

  return NextResponse.json({ configs });
}

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
    const body = await request.json();

    const {
      alias_email,
      supabase_url,
      anon_key,
      service_role_key,
      keepalive_endpoint_url,
      keepalive_method,
      keepalive_headers,
      keepalive_body,
      interval_seconds,
    } = body;

    // Validate required fields
    if (!alias_email || !supabase_url || !anon_key || !keepalive_endpoint_url) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate method
    if (keepalive_method && !["GET", "POST"].includes(keepalive_method)) {
      return NextResponse.json(
        { error: "Invalid method. Must be GET or POST" },
        { status: 400 }
      );
    }

    // Validate interval
    const interval = interval_seconds || 300;
    if (interval < 60) {
      return NextResponse.json(
        { error: "Interval must be at least 60 seconds" },
        { status: 400 }
      );
    }

    // Encrypt service_role_key if provided
    let encryptedKey: string | null = null;
    if (service_role_key) {
      encryptedKey = await encryptServiceRoleKey(service_role_key);
    }

    const { data, error } = await supabase
      .from("connection_configs")
      .insert({
        user_id: user.id,
        alias_email,
        supabase_url,
        anon_key,
        service_role_key_encrypted: encryptedKey,
        keepalive_endpoint_url,
        keepalive_method: keepalive_method || "GET",
        keepalive_headers: keepalive_headers || {},
        keepalive_body: keepalive_body || null,
        interval_seconds: interval,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ config: data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
