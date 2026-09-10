"use client";

import { Wifi, MapPin, Mail, MessageSquare, MessageCircle, ChevronDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useQrStore } from "@/lib/store";
import { STRUCTURED_TYPES } from "@/lib/detect";
import type { PayloadType } from "@/lib/payloads";
import { useI18n } from "@/lib/i18n/locale-provider";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  wifi: Wifi,
  geo: MapPin,
  email: Mail,
  sms: MessageSquare,
  whatsapp: MessageCircle,
};

export function MoreTypes() {
  const setStructured = useQrStore((s) => s.setStructured);
  const { t } = useI18n();
  const pick = (type: PayloadType) => setStructured(type);

  return (
    <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
      <button type="button" className="rounded px-1.5 py-0.5 hover:text-foreground" onClick={() => pick("wifi")}>
        {t("type.wifi")}
      </button>
      <span aria-hidden>·</span>
      <button type="button" className="rounded px-1.5 py-0.5 hover:text-foreground" onClick={() => pick("geo")}>
        {t("type.geo")}
      </button>
      <span aria-hidden>·</span>
      <Popover>
        <PopoverTrigger className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 hover:text-foreground">
          {t("common.more")} <ChevronDown className="h-3 w-3" />
        </PopoverTrigger>
        <PopoverContent align="center" className="w-52 p-1">
          {STRUCTURED_TYPES.map(({ id, labelKey }) => {
            const I = ICONS[id];
            return (
              <button
                key={id}
                type="button"
                onClick={() => pick(id)}
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
  );
}
