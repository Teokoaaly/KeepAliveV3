"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";
import { CardHeader, CardTitle } from "@/components/ui/card";

export function LogsCardHeader() {
  const { t } = useLanguage();

  return (
      <CardHeader>
        <CardTitle className="text-base sm:text-xl">{t("keepaliveLogs")}</CardTitle>
      </CardHeader>
  );
}
