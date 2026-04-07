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
      <div className="container mx-auto flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:py-4">
        <Link href="/dashboard" className="max-w-full text-lg font-bold text-primary glow-text tracking-[2px] uppercase sm:text-xl sm:tracking-[3px]">
          {t("appName")}
        </Link>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end sm:gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="min-h-9 w-full uppercase tracking-wider sm:w-auto">
              [{t("dashboard")}]
            </Button>
          </Link>
          <Link href="/dashboard/stats">
            <Button variant="ghost" size="sm" className="min-h-9 w-full uppercase tracking-wider sm:w-auto">
              [{t("stats")}]
            </Button>
          </Link>
          <Link href="/dashboard/wizard">
            <Button variant="ghost" size="sm" className="min-h-9 w-full uppercase tracking-wider sm:w-auto">
              [{t("wizard")}]
            </Button>
          </Link>
          <LanguageSelector />
          <Button variant="terminal" size="sm" onClick={handleLogout} className="min-h-9 w-full sm:w-auto">
            [{t("logout")}]
          </Button>
        </div>
      </div>
    </nav>
  );
}
