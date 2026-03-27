"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { LanguageSelector } from "@/components/LanguageSelector";

export function Navbar() {
  const router = useRouter();
  const supabase = createClient();
  const { t } = useLanguage();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <nav className="border-b-2 border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/dashboard" className="text-xl font-bold text-primary glow-text tracking-[3px] uppercase">
          {t("appName")}
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="uppercase tracking-wider">
              [{t("dashboard")}]
            </Button>
          </Link>
          <Link href="/dashboard/stats">
            <Button variant="ghost" size="sm" className="uppercase tracking-wider">
              [{t("stats")}]
            </Button>
          </Link>
          <Link href="/dashboard/wizard">
            <Button variant="ghost" size="sm" className="uppercase tracking-wider">
              [{t("wizard")}]
            </Button>
          </Link>
          <LanguageSelector />
          <Button variant="terminal" size="sm" onClick={handleLogout}>
            [{t("logout")}]
          </Button>
        </div>
      </div>
    </nav>
  );
}
