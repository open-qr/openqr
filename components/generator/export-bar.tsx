"use client";

import { useState } from "react";
import { Check, Copy, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQrStore } from "@/lib/store";
import { generateBlob, downloadBlob } from "@/lib/qr/export";
import type { ExportFormat } from "@/lib/qr/options";
import { trackEvent } from "@/lib/analytics";
import type { PayloadType } from "@/lib/payloads";

const FORMATS: { id: ExportFormat; label: string }[] = [
  { id: "png", label: "PNG" },
  { id: "svg", label: "SVG" },
  { id: "pdf", label: "PDF" },
  { id: "webp", label: "WebP" },
];
const SIZES = [512, 1024, 2048, 4096];

export function ExportBar({
  data,
  type,
  disabled,
  onSuccess,
}: {
  data: string;
  type: PayloadType;
  disabled: boolean;
  onSuccess?: (how: "saved" | "copied") => void;
}) {
  const style = useQrStore((s) => s.style);
  const [format, setFormat] = useState<ExportFormat>("png");
  const [size, setSize] = useState(1024);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const isVector = format === "svg" || format === "pdf";

  const onDownload = async () => {
    if (disabled) return;
    setBusy(true);
    try {
      const blob = await generateBlob(data, style, format, size);
      const ext = format;
      downloadBlob(blob, `openqr-${type}-${Date.now()}.${ext}`);
      trackEvent("downloaded", format);
      trackEvent("generated", type);
      onSuccess?.("saved");
    } catch (e) {
      console.error(e);
      alert("Sorry — export failed. Try a different format or a smaller size.");
    } finally {
      setBusy(false);
    }
  };

  const onCopy = async () => {
    if (disabled) return;
    try {
      const blob = await generateBlob(data, style, "png", size);
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      setCopied(true);
      trackEvent("copied", "png");
      onSuccess?.("copied");
      setTimeout(() => setCopied(false), 1800);
    } catch {
      alert("Clipboard image copy isn’t supported in this browser — use Download instead.");
    }
  };

  return (
    <div className="flex flex-wrap items-stretch justify-center gap-2">
      <Button size="lg" onClick={onDownload} disabled={disabled || busy} className="min-w-40 flex-1 sm:flex-none">
        {busy ? <Loader2 className="animate-spin" /> : <Download />}
        Download
      </Button>
      <Select value={format} onValueChange={(v) => setFormat(v as ExportFormat)}>
        <SelectTrigger className="h-12 w-[104px]" aria-label="Format" disabled={disabled}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {FORMATS.map((f) => (
            <SelectItem key={f.id} value={f.id}>{f.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={String(size)} onValueChange={(v) => setSize(Number(v))} disabled={disabled || isVector}>
        <SelectTrigger className="h-12 w-[104px]" aria-label="Size">
          <SelectValue placeholder="Size" />
        </SelectTrigger>
        <SelectContent>
          {SIZES.map((s) => (
            <SelectItem key={s} value={String(s)}>{s}px</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button variant="outline" size="icon" className="h-12 w-12" onClick={onCopy} disabled={disabled} aria-label="Copy image">
        {copied ? <Check className="text-primary" /> : <Copy />}
      </Button>
    </div>
  );
}
