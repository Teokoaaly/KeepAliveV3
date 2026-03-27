"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";

const VERSION = "2.0.0";

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="border-t-2 border-border py-4 text-center text-xs text-muted-foreground uppercase tracking-wider">
      <p>
        {t("madeWith").replace("<3", "<3")}
      </p>
      <p className="mt-1">
        {t("version")}: {VERSION}
      </p>
    </footer>
  );
}
