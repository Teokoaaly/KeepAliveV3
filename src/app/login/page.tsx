"use client";

import { AuthForm } from "@/components/AuthForm";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function LoginPage() {
  const { t } = useLanguage();

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center sm:mb-8">
          <h1 className="text-2xl font-bold text-primary glow-text uppercase tracking-[2px] sm:text-3xl sm:tracking-[4px]">
            {t("appName")}
          </h1>
          <p className="mt-2 text-xs text-muted-foreground uppercase tracking-wider sm:text-sm">
            {t("appSubtitle")}
          </p>
          <div className="mt-4 h-px bg-gradient-to-r from-transparent via-primary to-transparent"></div>
        </div>
        <AuthForm />
        <div className="mt-6 text-center text-[10px] text-muted-foreground uppercase tracking-wider sm:mt-8 sm:text-xs">
          <p>{t("authorizedOnly")}</p>
          <p className="mt-1">{t("sysReady")}</p>
        </div>
      </div>
    </div>
  );
}
