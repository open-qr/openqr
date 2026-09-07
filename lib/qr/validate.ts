import { effectiveEc, type QrStyle } from "@/lib/qr/options";
import type { TranslationKey } from "@/lib/i18n/translations";

const BYTE_CAPACITY = { L: 2953, M: 2331, Q: 1663, H: 1273 } as const;

function luminance(hex: string): number {
  const m = hex.replace("#", "");
  const full = m.length === 3 ? m.split("").map((c) => c + c).join("") : m;
  const n = parseInt(full, 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(a: string, b: string): number {
  const l1 = luminance(a);
  const l2 = luminance(b);
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

export function getWarnings(data: string, style: QrStyle): TranslationKey[] {
  const warnings: TranslationKey[] = [];
  const ec = effectiveEc(style);
  const len = new TextEncoder().encode(data).length;
  if (len > BYTE_CAPACITY[ec]) {
    warnings.push("warnings.tooMuchData");
  }
  if (style.logo && style.logoSize > 0.4 && ec !== "H") {
    warnings.push("warnings.largeLogo");
  }
  if (!style.transparent && contrastRatio(style.fgColor, style.bgColor) < 2.5) {
    warnings.push("warnings.lowContrast");
  }
  return warnings;
}
