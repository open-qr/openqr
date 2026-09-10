"use client";

import { useMemo } from "react";
import { Link2, Type, Mail, Phone, ChevronDown, Wifi, MapPin, MessageSquare, MessageCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useQrStore } from "@/lib/store";
import { detectType, SMART_LABEL_KEYS, SMART_TYPES, STRUCTURED_TYPES, type SmartType } from "@/lib/detect";
import type { PayloadType } from "@/lib/payloads";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/locale-provider";

const ICONS: Record<SmartType, React.ComponentType<{ className?: string }>> = {
  url: Link2,
  text: Type,
  email: Mail,
  phone: Phone,
};

const STRUCTURED_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  wifi: Wifi,
  geo: MapPin,
  email: Mail,
  sms: MessageSquare,
  whatsapp: MessageCircle,
};

export function SmartInput() {
  const { t } = useI18n();
  const input = useQrStore((s) => s.input);
  const override = useQrStore((s) => s.override);
  const setInput = useQrStore((s) => s.setInput);
  const setOverride = useQrStore((s) => s.setOverride);
  const setStructured = useQrStore((s) => s.setStructured);

  const detected = useMemo(() => detectType(input), [input]);
  const active: SmartType = override ?? detected;
  const Icon = ICONS[active];

  return (
    <div className="relative">
      <Input
        aria-label={t("smartInput.ariaContent")}
        inputMode="url"
        autoFocus
        placeholder={t("smartInput.placeholder")}
        className="h-16 rounded-2xl pl-5 pr-32 text-lg shadow-sm"
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      {input.trim() && (
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
          <Popover>
            <PopoverTrigger
              className="pop-in inline-flex items-center gap-1.5 rounded-full border bg-background px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              aria-label={t("smartInput.detectedType", { type: t(SMART_LABEL_KEYS[active]) })}
            >
              <Icon className="h-3.5 w-3.5" />
              {t(SMART_LABEL_KEYS[active])}
              <ChevronDown className="h-3 w-3 opacity-60" />
            </PopoverTrigger>
            <PopoverContent align="end" className="w-48 p-1">
              {SMART_TYPES.map((smartType) => {
                const I = ICONS[smartType];
                const sel = smartType === active;
                return (
                  <button
                    key={smartType}
                    type="button"
                    onClick={() => setOverride(smartType === detected ? null : smartType)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors hover:bg-accent",
                      sel && "font-medium text-primary"
                    )}
                  >
                    <I className="h-4 w-4" />
                    {t(SMART_LABEL_KEYS[smartType])}
                    {smartType === detected && (
                      <span className="ml-auto text-[10px] text-muted-foreground">{t("common.auto")}</span>
                    )}
                  </button>
                );
              })}

              <div className="my-1 border-t" />
              <p className="px-2 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                {t("smartInput.makeSomethingElse")}
              </p>
              {STRUCTURED_TYPES.map(({ id, labelKey }) => {
                const I = STRUCTURED_ICONS[id];
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setStructured(id as PayloadType)}
                    className="flex w-full items-center gap-2 whitespace-nowrap rounded-sm px-2 py-1.5 text-left text-sm text-foreground transition-colors hover:bg-accent"
                  >
                    <I className="h-4 w-4 text-muted-foreground" />
                    {t(labelKey)}
                  </button>
                );
              })}
            </PopoverContent>
          </Popover>
        </div>
      )}
    </div>
  );
}
