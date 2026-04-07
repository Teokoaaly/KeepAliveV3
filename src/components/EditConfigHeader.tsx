"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

export function EditConfigHeader({ aliasEmail }: { aliasEmail: string }) {
  const { t } = useLanguage();

  return (
    <h1 className="text-2xl font-bold text-primary glow-text uppercase tracking-[3px]">
      {t("editPrefix")} {aliasEmail} {t("editSuffix")}
    </h1>
  );
}

export function LogsCard() {
  const { t } = useLanguage();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("keepaliveLogs")}</CardTitle>
      </CardHeader>
    </Card>
  );
}
