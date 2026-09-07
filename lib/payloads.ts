export type PayloadType =
  | "url"
  | "text"
  | "email"
  | "phone"
  | "sms"
  | "whatsapp"
  | "wifi"
  | "geo";

export type FieldValues = Record<string, string | boolean>;

export const PAYLOAD_TYPES: { id: PayloadType; label: string }[] = [
  { id: "url", label: "URL" },
  { id: "text", label: "Text" },
  { id: "email", label: "Email" },
  { id: "phone", label: "Phone" },
  { id: "sms", label: "SMS" },
  { id: "whatsapp", label: "WhatsApp" },
  { id: "wifi", label: "Wi-Fi" },
  { id: "geo", label: "Location" },
];

const s = (v: string | boolean | undefined) => (v == null ? "" : String(v)).trim();

/** Escape special chars for Wi-Fi / vCard payloads. */
const esc = (v: string) => v.replace(/([\\;,:"])/g, "\\$1");

export function buildPayload(type: PayloadType, f: FieldValues): string {
  switch (type) {
    case "url": {
      const v = s(f.url);
      if (!v) return "";
      return /^[a-z][\w+.-]*:\/\//i.test(v) || v.startsWith("mailto:") ? v : `https://${v}`;
    }
    case "text":
      return s(f.text);
    case "email": {
      const to = s(f.email);
      if (!to) return "";
      const params: string[] = [];
      if (s(f.subject)) params.push(`subject=${encodeURIComponent(s(f.subject))}`);
      if (s(f.body)) params.push(`body=${encodeURIComponent(s(f.body))}`);
      const q = params.join("&");
      return `mailto:${to}${q ? `?${q}` : ""}`;
    }
    case "phone":
      return s(f.phone) ? `tel:${s(f.phone)}` : "";
    case "sms": {
      const n = s(f.phone);
      if (!n) return "";
      return s(f.message) ? `SMSTO:${n}:${s(f.message)}` : `SMSTO:${n}`;
    }
    case "whatsapp": {
      const n = s(f.phone).replace(/[^\d]/g, "");
      if (!n) return "";
      const text = s(f.message);
      return `https://wa.me/${n}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
    }
    case "wifi": {
      const ssid = s(f.ssid);
      if (!ssid) return "";
      const enc = s(f.encryption) || "WPA";
      const parts = [`T:${enc === "nopass" ? "nopass" : enc}`, `S:${esc(ssid)}`];
      if (enc !== "nopass") parts.push(`P:${esc(s(f.password))}`);
      if (f.hidden) parts.push("H:true");
      return `WIFI:${parts.join(";")};;`;
    }
    case "geo": {
      const lat = s(f.lat);
      const lng = s(f.lng);
      return lat && lng ? `geo:${lat},${lng}` : "";
    }
    default:
      return "";
  }
}
