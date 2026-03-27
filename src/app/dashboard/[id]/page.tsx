import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/Navbar";
import { ConfigForm } from "@/components/ConfigForm";
import { LogViewer } from "@/components/LogViewer";
import { EditConfigHeader } from "@/components/EditConfigHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogsCardHeader } from "@/components/LogsCardHeader";

export default async function EditConfigPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: config, error } = await supabase
    .from("connection_configs")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !config) {
    notFound();
  }

  const { data: logs } = await supabase
    .from("keepalive_logs")
    .select("*")
    .eq("config_id", id)
    .order("attempted_at", { ascending: false })
    .limit(50);

  return (
    <div>
      <Navbar />
      <main className="container mx-auto px-4 py-8 space-y-8">
        <EditConfigHeader aliasEmail={config.alias_email} />

        <ConfigForm
          configId={config.id}
          initialData={{
            alias_email: config.alias_email,
            supabase_url: config.supabase_url,
            anon_key: config.anon_key,
            keepalive_endpoint_url: config.keepalive_endpoint_url,
            keepalive_method: config.keepalive_method as "GET" | "POST",
            keepalive_headers: JSON.stringify(
              config.keepalive_headers || {},
              null,
              2
            ),
            keepalive_body: config.keepalive_body
              ? JSON.stringify(config.keepalive_body, null, 2)
              : "",
            interval_seconds: config.interval_seconds,
          }}
        />

        <Card>
          <LogsCardHeader />
          <CardContent>
            <LogViewer logs={logs || []} />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
