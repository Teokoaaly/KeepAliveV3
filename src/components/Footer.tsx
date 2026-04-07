"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";

const VERSION = "2.0.0";

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="border-t-2 border-border px-4 py-4 text-center text-[10px] leading-relaxed text-muted-foreground uppercase tracking-wider sm:text-xs">
      <p>
        {t("madeWith").replace("<3", "<3")}
      </p>
      <p className="mt-1">
        {t("version")}: {VERSION}
      </p>
    </footer>
  );
}
