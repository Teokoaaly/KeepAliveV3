import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { encryptServiceRoleKey } from "@/lib/crypto";
import {
  MAX_KEEPALIVE_INTERVAL_SECONDS,
  MIN_KEEPALIVE_INTERVAL_SECONDS,
} from "@/lib/keepalive";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id } = await params;

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
    .eq("id", id)
    .single();

  if (error) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Never expose encrypted key
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { service_role_key_encrypted, ...rest } = data;

  return NextResponse.json({
    config: {
      ...rest,
      has_service_role: !!data.service_role_key_encrypted,
    },
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id } = await params;

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify ownership
  const { data: existing } = await supabase
    .from("connection_configs")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const body = await request.json();
    const updateData: Record<string, unknown> = {};

    // Only allow specific fields to be updated
    const allowedFields = [
      "alias_email",
      "supabase_url",
      "anon_key",
      "keepalive_endpoint_url",
      "keepalive_method",
      "keepalive_headers",
      "keepalive_body",
      "interval_seconds",
      "enabled",
    ];

    for (const field of allowedFields) {
      if (field in body) {
        if (field === "keepalive_method" && !["GET", "POST"].includes(body[field])) {
          return NextResponse.json(
            { error: "Invalid method" },
            { status: 400 }
          );
        }
        if (
          field === "interval_seconds" &&
          (body[field] < MIN_KEEPALIVE_INTERVAL_SECONDS ||
            body[field] > MAX_KEEPALIVE_INTERVAL_SECONDS)
        ) {
          return NextResponse.json(
            { error: "Interval must be between 60 seconds and 4 hours" },
            { status: 400 }
          );
        }
        updateData[field] = body[field];
      }
    }

    // Handle service_role_key separately (needs encryption)
    if (body.service_role_key) {
      updateData.service_role_key_encrypted = await encryptServiceRoleKey(
        body.service_role_key
      );
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("connection_configs")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ config: data });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id } = await params;

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify ownership
  const { data: existing } = await supabase
    .from("connection_configs")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { error } = await supabase
    .from("connection_configs")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
