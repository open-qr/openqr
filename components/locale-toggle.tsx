"use client";

import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/locale-provider";

export function LocaleToggle() {
  const { locale, setLocale, t } = useI18n();

  return (
    <Button
      variant="ghost"
      size="sm"
      aria-label={t("locale.toggleAria")}
      onClick={() => setLocale(locale === "en" ? "fr" : "en")}
      className="text-xs font-semibold"
    >
      <Languages className="h-4 w-4" />
      {locale.toUpperCase()}
    </Button>
  );
}
