import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/Navbar";
import { ConfigTable } from "@/components/ConfigTable";
import { DashboardHeader, DashboardFooter } from "@/components/DashboardHeader";
import { createManualPingToken } from "@/lib/manual-ping-token";

export default async function DashboardPage() {
  const supabase = await createClient();
  const renderedAt = Date.now();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("connection_configs")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div>
        <Navbar />
        <main className="container mx-auto px-4 py-6 sm:py-8">
          <p className="text-destructive font-bold uppercase tracking-wider animate-pulse">
            [!] ERROR LOADING CONFIGURATIONS: {error.message}
          </p>
        </main>
      </div>
    );
  }

  const configs = (data || []).map((config) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { service_role_key_encrypted, ...rest } = config;
    return {
      ...rest,
      has_service_role: !!config.service_role_key_encrypted,
      manual_ping_token: user
        ? createManualPingToken({ configId: config.id, userId: user.id })
        : null,
    };
  });

  return (
    <div>
      <Navbar />
      <main className="container mx-auto px-4 py-6 sm:py-8">
        <DashboardHeader />
        <div className="border-2 border-border bg-card/50 p-3 sm:p-4">
          <ConfigTable configs={configs} renderedAt={renderedAt} />
        </div>
        <DashboardFooter configsCount={configs.length} activeCount={configs.filter(c => c.enabled).length} />
      </main>
    </div>
  );
}
