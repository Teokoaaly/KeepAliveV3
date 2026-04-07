"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function DashboardHeader() {
  const { t } = useLanguage();

  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-xl font-bold text-primary glow-text uppercase tracking-[2px] sm:text-2xl sm:tracking-[3px]">
          {t("dashboardTitle")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground uppercase tracking-wider">
          {t("dashboardSubtitle")}
        </p>
      </div>
      <Link href="/dashboard/new" className="w-full sm:w-auto">
        <Button variant="terminal" className="w-full sm:w-auto">{t("addConfig")}</Button>
      </Link>
    </div>
  );
}

export function DashboardFooter({ configsCount, activeCount }: { configsCount: number; activeCount: number }) {
  const { t } = useLanguage();

  return (
    <div className="mt-4 space-y-1 text-xs text-muted-foreground uppercase tracking-wider sm:space-y-0">
      <p>{t("systemStatus")}</p>
      <p className="break-words">{t("totalConfigs")} {configsCount} | {t("active")} {activeCount}</p>
    </div>
  );
}
