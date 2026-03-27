"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function DashboardHeader() {
  const { t } = useLanguage();

  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold text-primary glow-text uppercase tracking-[3px]">
          {t("dashboardTitle")}
        </h1>
        <p className="text-muted-foreground uppercase tracking-wider text-sm mt-1">
          {t("dashboardSubtitle")}
        </p>
      </div>
      <Link href="/dashboard/new">
        <Button variant="terminal">{t("addConfig")}</Button>
      </Link>
    </div>
  );
}

export function DashboardFooter({ configsCount, activeCount }: { configsCount: number; activeCount: number }) {
  const { t } = useLanguage();

  return (
    <div className="mt-4 text-xs text-muted-foreground uppercase tracking-wider">
      <p>{t("systemStatus")}</p>
      <p>{t("totalConfigs")} {configsCount} | {t("active")} {activeCount}</p>
    </div>
  );
}
