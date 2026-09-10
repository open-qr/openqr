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
  // The lazy import below resolves after some renders, so updates that fire while
  // it is pending must not be lost: keep the newest options here and build the
  // instance from them. Using the mount-time data instead rendered a " " placeholder.
  const optionsRef = useRef<ReturnType<typeof buildQrOptions> | null>(null);

  // update on change (also records the latest options while the import is pending)
  useEffect(() => {
    const options = buildQrOptions(data, style, size);
    optionsRef.current = options;
    qrRef.current?.update(options);
  }, [data, style, size]);

  // init once
  useEffect(() => {
    let cancelled = false;
    import("qr-code-styling").then(({ default: QRCodeStyling }) => {
      if (cancelled || !ref.current || !optionsRef.current) return;
      qrRef.current = new QRCodeStyling(optionsRef.current);
      ref.current.innerHTML = "";
      qrRef.current.append(ref.current);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-label={t("qrCanvas.preview")}
      role="img"
      className={cn("flex items-center justify-center [&_canvas]:!h-auto [&_canvas]:!w-full", className)}
    />
  );
}
