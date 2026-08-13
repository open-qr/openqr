import { buildQrOptions, type ExportFormat, type QrStyle } from "@/lib/qr/options";

async function getStyling() {
  const mod = await import("qr-code-styling");
  return mod.default;
}

/** Frame geometry derived from the QR side length S. */
function frameGeom(S: number, hasText: boolean) {
  const pad = Math.round(S * 0.08);
  const border = Math.max(6, Math.round(S * 0.025));
  const captionH = hasText ? Math.round(S * 0.17) : pad;
  return {
    pad,
    border,
    captionH,
    W: S + pad * 2,
    H: pad + S + captionH,
    radius: Math.round(S * 0.06),
  };
}

function frameBg(style: QrStyle) {
  return style.transparent ? "#FFFFFF" : style.bgColor;
}

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

async function compositeFrameCanvas(qrBlob: Blob, style: QrStyle, S: number): Promise<HTMLCanvasElement> {
  const bitmap = await createImageBitmap(qrBlob);
  const hasText = !!style.frameText.trim();
  const g = frameGeom(S, hasText);
  const canvas = document.createElement("canvas");
  canvas.width = g.W;
  canvas.height = g.H;
  const ctx = canvas.getContext("2d")!;

  // Card
  roundRectPath(ctx, 0, 0, g.W, g.H, g.radius);
  ctx.fillStyle = frameBg(style);
  ctx.fill();

  // Border
  const half = g.border / 2;
  roundRectPath(ctx, half, half, g.W - g.border, g.H - g.border, g.radius - half);
  ctx.lineWidth = g.border;
  ctx.strokeStyle = style.fgColor;
  ctx.stroke();

  // QR
  ctx.drawImage(bitmap, g.pad, g.pad, S, S);

  // Caption
  if (hasText) {
    ctx.fillStyle = style.fgColor;
    ctx.font = `700 ${Math.round(g.captionH * 0.42)}px ui-sans-serif, system-ui, -apple-system, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const text = style.frameText.toUpperCase();
    ctx.save();
    ctx.translate(g.W / 2, g.pad + S + g.captionH / 2);
    // simple letter-spacing
    drawSpacedText(ctx, text, Math.round(g.captionH * 0.1));
    ctx.restore();
  }
  return canvas;
}

function drawSpacedText(ctx: CanvasRenderingContext2D, text: string, spacing: number) {
  const widths = [...text].map((ch) => ctx.measureText(ch).width + spacing);
  const total = widths.reduce((a, b) => a + b, 0) - spacing;
  let x = -total / 2;
  ctx.textAlign = "left";
  for (let i = 0; i < text.length; i++) {
    ctx.fillText(text[i], x, 0);
    x += widths[i];
  }
}

function canvasToBlob(canvas: HTMLCanvasElement, mime: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), mime, quality)
  );
}

function wrapSvgFrame(innerSvg: string, style: QrStyle, S: number): string {
  const hasText = !!style.frameText.trim();
  const g = frameGeom(S, hasText);
  // strip outer <svg ...> wrapper to get inner content, keep as nested <svg>
  const inner = innerSvg.replace(/<\?xml[^>]*\?>/i, "");
  const caption = hasText
    ? `<text x="${g.W / 2}" y="${g.pad + S + g.captionH / 2}" font-family="ui-sans-serif, system-ui, sans-serif" font-weight="700" font-size="${Math.round(
        g.captionH * 0.42
      )}" letter-spacing="${Math.round(g.captionH * 0.1)}" fill="${style.fgColor}" text-anchor="middle" dominant-baseline="central">${escapeXml(
        style.frameText.toUpperCase()
      )}</text>`
    : "";
  const half = g.border / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${g.W}" height="${g.H}" viewBox="0 0 ${g.W} ${g.H}">
<rect x="0" y="0" width="${g.W}" height="${g.H}" rx="${g.radius}" fill="${frameBg(style)}"/>
<rect x="${half}" y="${half}" width="${g.W - g.border}" height="${g.H - g.border}" rx="${g.radius - half}" fill="none" stroke="${style.fgColor}" stroke-width="${g.border}"/>
<g transform="translate(${g.pad} ${g.pad})">${inner}</g>
${caption}
</svg>`;
}

function escapeXml(v: string) {
  return v.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c]!));
}

export async function generateBlob(
  data: string,
  style: QrStyle,
  format: ExportFormat,
  size: number
): Promise<Blob> {
  const QRCodeStyling = await getStyling();

  if (format === "svg" || format === "pdf") {
    const qr = new QRCodeStyling({ ...buildQrOptions(data, style, size), type: "svg" });
    const raw = await qr.getRawData("svg");
    let svgText = await blobToText(raw as Blob);
    if (style.frameEnabled) svgText = wrapSvgFrame(svgText, style, size);
    if (format === "svg") return new Blob([svgText], { type: "image/svg+xml" });
    return svgToPdf(svgText);
  }

  const qr = new QRCodeStyling(buildQrOptions(data, style, size));
  const raw = (await qr.getRawData("png")) as Blob;

  if (style.frameEnabled) {
    const canvas = await compositeFrameCanvas(raw, style, size);
    const mime = format === "webp" ? "image/webp" : "image/png";
    // WebP at max quality — effectively lossless for a two-colour code, and preserves alpha.
    return canvasToBlob(canvas, mime, format === "webp" ? 1 : undefined);
  }

  if (format === "png") return raw;
  // WebP without frame: re-encode the PNG through a canvas at max quality (keeps alpha).
  const bitmap = await createImageBitmap(raw);
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0, size, size);
  return canvasToBlob(canvas, "image/webp", 1);
}

async function svgToPdf(svgText: string): Promise<Blob> {
  const { jsPDF } = await import("jspdf");
  await import("svg2pdf.js");
  const parser = new DOMParser();
  const svgEl = parser.parseFromString(svgText, "image/svg+xml").documentElement as unknown as SVGElement;
  const w = Number(svgEl.getAttribute("width")) || 1024;
  const h = Number(svgEl.getAttribute("height")) || 1024;
  const pdf = new jsPDF({ orientation: w > h ? "landscape" : "portrait", unit: "pt", format: [w, h] });
  await (pdf as unknown as { svg: (el: Element, opts: object) => Promise<void> }).svg(svgEl, {
    x: 0,
    y: 0,
    width: w,
    height: h,
  });
  return pdf.output("blob");
}

function blobToText(blob: Blob): Promise<string> {
  return blob.text();
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
