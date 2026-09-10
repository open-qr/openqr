"use client";

import { useDeferredValue, useEffect, useMemo, useState, type ReactNode } from "react";
import { AlertTriangle, ArrowLeft, Sliders } from "lucide-react";
import { SmartInput } from "@/components/generator/smart-input";
import { MoreTypes } from "@/components/generator/more-types";
import { PayloadFields } from "@/components/generator/payload-fields";
import { QrCanvas } from "@/components/generator/qr-canvas";
import { CustomiseDrawer } from "@/components/generator/customise-drawer";
import { ExportBar } from "@/components/generator/export-bar";
import { useQrStore } from "@/lib/store";
import { buildPayload, type PayloadType } from "@/lib/payloads";
import { detectType, smartFields, STRUCTURED_TYPES } from "@/lib/detect";
import { getWarnings } from "@/lib/qr/validate";
import { decodeConfig } from "@/lib/config-url";
import { trackEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/site/logo";
import { useI18n } from "@/lib/i18n/locale-provider";
import type { TranslationKey } from "@/lib/i18n/translations";

const STRUCTURED_LABEL_KEY: Record<string, TranslationKey> = Object.fromEntries(
  STRUCTURED_TYPES.map((t) => [t.id, t.labelKey])
);

export interface GeneratorProps {
  /** Render as an embeddable widget (no full-page chrome). */
  embedded?: boolean;
  /** Branding/header rendered above the input. Defaults to the OpenQR logo;
   *  pass your own node (or null) to override when embedding/forking. */
  header?: ReactNode;
  /** Optional slot rendered after a successful download/copy — host apps inject
   *  their own support / call-to-action UI here (variant = "saved" | "copied"). */
  renderSuccess?: (variant: "saved" | "copied") => ReactNode;
}

export function Generator({ embedded = false, header, renderSuccess }: GeneratorProps) {
  const { t } = useI18n();
  const input = useQrStore((s) => s.input);
  const override = useQrStore((s) => s.override);
  const structured = useQrStore((s) => s.structured);
  const values = useQrStore((s) => s.values);
  const style = useQrStore((s) => s.style);
  const setStructured = useQrStore((s) => s.setStructured);
  const load = useQrStore((s) => s.load);
  const [customise, setCustomise] = useState(false);
  const [success, setSuccess] = useState<"saved" | "copied" | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !window.location.hash) return;
    const cfg = decodeConfig(window.location.hash.slice(1));
    if (cfg) {
      load(cfg);
      history.replaceState(null, "", window.location.pathname);
    }
  }, [load]);

  const activeType: PayloadType = structured ?? override ?? detectType(input);
  const payload = useMemo(() => {
    if (structured) return buildPayload(structured, values[structured]);
    const t = override ?? detectType(input);
    return buildPayload(t, smartFields(t, input));
  }, [structured, override, input, values]);

  const deferredPayload = useDeferredValue(payload);
  const hasData = payload.trim().length > 0;
  const warnings = useMemo(() => (hasData ? getWarnings(payload, style) : []), [payload, style, hasData]);

  const Root = embedded ? "div" : "main";
  return (
    <Root
      className={cn(
        "mx-auto flex w-full max-w-xl flex-col px-4",
        !embedded && "flex-1",
        !embedded && !hasData && "justify-center pb-[10vh]"
      )}
    >
      {!embedded && (header === undefined ? <Logo className="mb-8" /> : header)}

      {/* Input */}
      <div className="space-y-3">
        {structured ? (
          <div key="structured" className="fade-in space-y-3">
            <button
              type="button"
              onClick={() => setStructured(null)}
              className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> {t("generator.backToLinkOrText")}
            </button>
            <h2 className="text-sm font-semibold">
              {t("generator.structuredTitle", { type: t(STRUCTURED_LABEL_KEY[structured]) })}
            </h2>
            <PayloadFields />
          </div>
        ) : (
          <>
            <SmartInput />
            {!hasData && (
              <div className="fade-up space-y-3">
                <MoreTypes />
                <p className="text-center text-xs text-muted-foreground">{t("generator.freeOpenSource")}</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Result */}
      {hasData && (
        <div className="mt-10 flex flex-col items-center">
          <div className="fade-up rounded-2xl border bg-card p-4 shadow-sm">
            <div
              className={cn("w-[240px]", style.frameEnabled && "rounded-xl p-2")}
              style={
                style.frameEnabled
                  ? { border: `4px solid ${style.fgColor}`, background: style.transparent ? "#fff" : style.bgColor }
                  : undefined
              }
            >
              <QrCanvas data={deferredPayload} style={style} />
              {style.frameEnabled && style.frameText.trim() && (
                <p className="mt-2 text-center text-sm font-bold uppercase tracking-widest" style={{ color: style.fgColor }}>
                  {style.frameText}
                </p>
              )}
            </div>
          </div>

          {warnings.length > 0 && (
            <div className="fade-up mt-4 w-full max-w-md space-y-1.5">
              {warnings.map((w) => (
                <p key={w} className="flex items-start gap-2 rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {t(w)}
                </p>
              ))}
            </div>
          )}

          <div className="fade-up mt-6 w-full" style={{ animationDelay: "70ms" }}>
            <ExportBar data={payload} type={activeType} disabled={!hasData} onSuccess={setSuccess} />
          </div>

          <div className="fade-up mt-5 w-full max-w-md" style={{ animationDelay: "140ms" }}>
            <button
              type="button"
              onClick={() => {
                setCustomise(true);
                trackEvent("customise_opened", undefined, "Style");
              }}
              className="mx-auto flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <Sliders className="h-4 w-4" />
              {t("generator.customiseDesign")}
            </button>
          </div>

          {success && renderSuccess && (
            <div className="w-full max-w-md">{renderSuccess(success)}</div>
          )}
        </div>
      )}

      <CustomiseDrawer open={customise} onOpenChange={setCustomise} data={deferredPayload} />
    </Root>
  );
}
