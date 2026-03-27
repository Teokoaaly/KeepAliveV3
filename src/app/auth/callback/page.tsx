import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function AuthCallbackPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const supabase = await createClient();
  const { code } = await searchParams;

  if (code) {
    await supabase.auth.exchangeCodeForSession(code);
  }

  redirect("/dashboard");
}
