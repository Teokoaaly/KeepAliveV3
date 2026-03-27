import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

  // Verify ownership of the config
  const { data: config } = await supabase
    .from("connection_configs")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!config) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: logs, error } = await supabase
    .from("keepalive_logs")
    .select("*")
    .eq("config_id", id)
    .order("attempted_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ logs: logs || [] });
}
