"use client";

import { useI18n } from "@/lib/i18n/locale-provider";

export function Footer() {
  const { t } = useI18n();
  return (
    <footer className="mx-auto w-full max-w-xl px-4 py-10 text-center text-xs text-muted-foreground">
      {t("footer.text")}
    </footer>
  );
}
