"use client";

import { Navbar } from "@/components/Navbar";
import { ConfigForm } from "@/components/ConfigForm";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function NewConfigPage() {
  const { t } = useLanguage();

  return (
    <div>
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6 text-primary glow-text uppercase tracking-[3px]">
          {t("addConfiguration")}
        </h1>
        <ConfigForm />
      </main>
    </div>
  );
}
