"use client";

import { useEffect, useRef } from "react";
import type QRCodeStyling from "qr-code-styling";
import { buildQrOptions, type QrStyle } from "@/lib/qr/options";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/locale-provider";

interface Props {
  data: string;
  style: QrStyle;
  size?: number;
  className?: string;
}

export function QrCanvas({ data, style, size = 280, className }: Props) {
  const { t } = useI18n();
  const ref = useRef<HTMLDivElement>(null);
  const qrRef = useRef<QRCodeStyling | null>(null);

  // init once
  useEffect(() => {
    let cancelled = false;
    import("qr-code-styling").then(({ default: QRCodeStyling }) => {
      if (cancelled || !ref.current) return;
      qrRef.current = new QRCodeStyling(buildQrOptions(data, style, size));
      ref.current.innerHTML = "";
      qrRef.current.append(ref.current);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // update on change
  useEffect(() => {
    qrRef.current?.update(buildQrOptions(data, style, size));
  }, [data, style, size]);

  return (
    <div
      ref={ref}
      aria-label={t("qrCanvas.preview")}
      role="img"
      className={cn("flex items-center justify-center [&_canvas]:!h-auto [&_canvas]:!w-full", className)}
    />
  );
}
