export type PayloadType =
  | "url"
  | "text"
  | "email"
  | "phone"
  | "sms"
  | "whatsapp"
  | "wifi"
  | "vcard"
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
  { id: "vcard", label: "vCard / Contact" },
  { id: "geo", label: "Location" },
];

const s = (v: string | boolean | undefined) => (v == null ? "" : String(v)).trim();

/** Escape special chars for Wi-Fi payloads. */
const esc = (v: string) => v.replace(/([\\;,:"])/g, "\\$1");

export function buildPayload(type: PayloadType, f: FieldValues): string {
  switch (type) {
    case "vcard": {
      const firstName = s(f.firstName);
      const lastName = s(f.lastName);
      if (!firstName && !lastName) return "";
      const escapeText = (value: string) => value
        .replace(/\\/g, "\\\\")
        .replace(/\r\n|\r|\n/g, "\\n")
        .replace(/([;,])/g, "\\$1");
      const lines = [
        "BEGIN:VCARD",
        "VERSION:3.0",
        `N:${[lastName, firstName, "", "", ""].map(escapeText).join(";")}`,
        `FN:${escapeText([firstName, lastName].filter(Boolean).join(" "))}`,
      ];
      const optionalFields = [
        ["ORG", "organization"],
        ["TITLE", "title"],
        ["TEL;TYPE=CELL", "mobilePhone"],
        ["TEL;TYPE=VOICE", "generalPhone"],
        ["EMAIL;TYPE=HOME,INTERNET", "personalEmail"],
        ["EMAIL;TYPE=INTERNET", "generalEmail"],
      ];
      for (const [property, key] of optionalFields) {
        const value = s(f[key]);
        if (value) lines.push(`${property}:${escapeText(value)}`);
      }
      // URL is a URI value, not vCard TEXT; preserve URI punctuation.
      const website = s(f.website).replace(/\r/g, "%0D").replace(/\n/g, "%0A");
      if (website) lines.push(`URL:${website}`);
      const address = ["", "", s(f.street), s(f.city), "", s(f.postalCode), s(f.country)];
      if (address.some(Boolean)) lines.push(`ADR:${address.map(escapeText).join(";")}`);
      lines.push("END:VCARD");
      return lines.join("\r\n") + "\r\n";
    }
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
