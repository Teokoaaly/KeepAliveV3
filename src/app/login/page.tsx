"use client";

import { AuthForm } from "@/components/AuthForm";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function LoginPage() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary glow-text uppercase tracking-[4px]">
            {t("appName")}
          </h1>
          <p className="text-muted-foreground mt-2 uppercase tracking-wider text-sm">
            {t("appSubtitle")}
          </p>
          <div className="mt-4 h-px bg-gradient-to-r from-transparent via-primary to-transparent"></div>
        </div>
        <AuthForm />
        <div className="mt-8 text-center text-xs text-muted-foreground uppercase tracking-wider">
          <p>{t("authorizedOnly")}</p>
          <p className="mt-1">{t("sysReady")}</p>
        </div>
      </div>
    </div>
  );
}
