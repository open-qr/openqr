"use client";

import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { QrCanvas } from "@/components/generator/qr-canvas";
import { StylePanel } from "@/components/generator/style-panel";
import { useQrStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/locale-provider";

export function CustomiseDrawer({
  open,
  onOpenChange,
  data,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  data: string;
}) {
  const style = useQrStore((s) => s.style);
  const { t } = useI18n();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="p-0">
        {/* Fixed header — live QR always in view */}
        <div className="shrink-0 border-b bg-card/40 px-5 pb-5 pt-5">
          <SheetTitle className="text-center text-sm font-semibold">{t("generator.customiseDesign")}</SheetTitle>
          <SheetDescription className="sr-only">{t("customiseDrawer.description")}</SheetDescription>
          <div className="mt-4 flex justify-center">
            <div className="rounded-xl border bg-card p-2.5 shadow-sm">
              <div
                className={cn("w-[128px]", style.frameEnabled && "rounded-lg p-2")}
                style={
                  style.frameEnabled
                    ? { border: `3px solid ${style.fgColor}`, background: style.transparent ? "#fff" : style.bgColor }
                    : undefined
                }
              >
                <QrCanvas data={data} style={style} size={256} />
                {style.frameEnabled && style.frameText.trim() && (
                  <p
                    className="mt-1 text-center text-[9px] font-bold uppercase tracking-widest"
                    style={{ color: style.fgColor }}
                  >
                    {style.frameText}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable options */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          <StylePanel />
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t p-4">
          <SheetClose asChild>
            <Button className="w-full">{t("common.done")}</Button>
          </SheetClose>
        </div>
      </SheetContent>
    </Sheet>
  );
}
