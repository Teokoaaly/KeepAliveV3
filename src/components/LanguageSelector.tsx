"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";
import { Button } from "@/components/ui/button";

export function LanguageSelector() {
  const { lang, setLang } = useLanguage();

  return (
    <div className="flex items-center gap-1 border border-border px-1 py-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setLang("en")}
        className={`h-auto min-h-8 px-2 py-1 text-xs ${
          lang === "en"
            ? "text-primary bg-primary/10"
            : "text-muted-foreground"
        }`}
      >
        EN
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setLang("es")}
        className={`h-auto min-h-8 px-2 py-1 text-xs ${
          lang === "es"
            ? "text-primary bg-primary/10"
            : "text-muted-foreground"
        }`}
      >
        ES
      </Button>
    </div>
  );
}
