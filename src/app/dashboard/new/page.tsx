"use client";

import { Navbar } from "@/components/Navbar";
import { ConfigForm } from "@/components/ConfigForm";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function NewConfigPage() {
  const { t } = useLanguage();

  return (
    <div>
      <Navbar />
      <main className="container mx-auto px-4 py-6 sm:py-8">
        <h1 className="mb-6 text-xl font-bold text-primary glow-text uppercase tracking-[2px] sm:text-2xl sm:tracking-[3px]">
          {t("addConfiguration")}
        </h1>
        <ConfigForm />
      </main>
    </div>
  );
}
