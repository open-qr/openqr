import type { Options } from "qr-code-styling";

export type DotType =
  | "square"
  | "dots"
  | "rounded"
  | "classy"
  | "classy-rounded"
  | "extra-rounded";
export type CornerSquareType = "square" | "dot" | "extra-rounded";
export type CornerDotType = "square" | "dot";
export type ErrorCorrectionLevel = "L" | "M" | "Q" | "H";
export type ExportFormat = "png" | "webp" | "svg" | "pdf";

export interface QrStyle {
  fgColor: string;
  bgColor: string;
  transparent: boolean;
  useGradient: boolean;
  gradientColor: string;
  gradientType: "linear" | "radial";
  gradientRotation: number;
  dotType: DotType;
  cornerSquareType: CornerSquareType;
  cornerDotType: CornerDotType;
  errorCorrectionLevel: ErrorCorrectionLevel;
  margin: number;
  logo: string | null; // data URL
  logoSize: number; // 0..1 fraction
  logoMargin: number;
  hideBackgroundDots: boolean;
  frameEnabled: boolean;
  frameText: string;
}

export const DEFAULT_STYLE: QrStyle = {
  fgColor: "#232E3A",
  bgColor: "#FFFFFF",
  transparent: false,
  useGradient: false,
  gradientColor: "#07B1B0",
  gradientType: "linear",
  gradientRotation: 0,
  dotType: "rounded",
  cornerSquareType: "extra-rounded",
  cornerDotType: "dot",
  errorCorrectionLevel: "Q",
  margin: 8,
  logo: null,
  logoSize: 0.35,
  logoMargin: 6,
  hideBackgroundDots: true,
  frameEnabled: false,
  frameText: "SCAN ME",
};

const transparentColor = "rgba(0,0,0,0)";

/** Effective EC level — auto-bump to Q when a logo is present. */
export function effectiveEc(style: QrStyle): ErrorCorrectionLevel {
  if (style.logo && (style.errorCorrectionLevel === "L" || style.errorCorrectionLevel === "M")) {
    return "Q";
  }
  return style.errorCorrectionLevel;
}

export function buildQrOptions(data: string, style: QrStyle, size: number): Options {
  const dotsColor = style.fgColor;
  const dotsOptions: Options["dotsOptions"] = style.useGradient
    ? {
        type: style.dotType,
        gradient: {
          type: style.gradientType,
          rotation: (style.gradientRotation * Math.PI) / 180,
          colorStops: [
            { offset: 0, color: style.fgColor },
            { offset: 1, color: style.gradientColor },
          ],
        },
      }
    : { type: style.dotType, color: dotsColor };

  return {
    width: size,
    height: size,
    type: "canvas",
    data: data || " ",
    margin: style.margin,
    qrOptions: { errorCorrectionLevel: effectiveEc(style) },
    image: style.logo ?? undefined,
    imageOptions: {
      hideBackgroundDots: style.hideBackgroundDots,
      imageSize: style.logoSize,
      margin: style.logoMargin,
      crossOrigin: "anonymous",
    },
    dotsOptions,
    backgroundOptions: { color: style.transparent ? transparentColor : style.bgColor },
    cornersSquareOptions: { type: style.cornerSquareType, color: style.fgColor },
    cornersDotOptions: { type: style.cornerDotType, color: style.fgColor },
  };
}
