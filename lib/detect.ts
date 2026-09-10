import type { PayloadType } from "@/lib/payloads";
import type { TranslationKey } from "@/lib/i18n/translations";

/** Types expressible as a single free-text string (the "smart input" modes). */
export type SmartType = "url" | "text" | "email" | "phone";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HAS_SCHEME = /^[a-z][\w+.-]*:\/\//i;
const URI_SCHEME = /^(mailto:|tel:|sms:|geo:|wifi:|bitcoin:)/i;
const DOMAINish = /^[^\s]+\.[a-z]{2,}([/:?#].*)?$/i;
const PHONEish = /^[+(]?[\d][\d\s().-]{5,}$/;

/** Best-effort detection of intent from a single string. */
export function detectType(raw: string): SmartType {
  const v = raw.trim();
  if (!v) return "url";
  if (EMAIL.test(v)) return "email";
  if (HAS_SCHEME.test(v) || URI_SCHEME.test(v)) return "url";
  if (PHONEish.test(v) && !/[a-z]/i.test(v)) return "phone";
  if (DOMAINish.test(v)) return "url";
  return "text";
}

export const SMART_LABEL_KEYS: Record<SmartType, TranslationKey> = {
  url: "type.url",
  text: "type.text",
  email: "type.email",
  phone: "type.phone",
};

/** Map a smart string to the field object the payload builder expects. */
export function smartFields(type: SmartType, input: string): Record<string, string> {
  switch (type) {
    case "url":
      return { url: input };
    case "email":
      return { email: input };
    case "phone":
      return { phone: input };
    default:
      return { text: input };
  }
}

export const SMART_TYPES: SmartType[] = ["url", "text", "email", "phone"];

/** Structured types that need their own multi-field form. */
export const STRUCTURED_TYPES: { id: PayloadType; labelKey: TranslationKey }[] = [
  { id: "wifi", labelKey: "type.wifi" },
  { id: "geo", labelKey: "type.geo" },
  { id: "email", labelKey: "type.emailWithSubject" },
  { id: "sms", labelKey: "type.sms" },
  { id: "whatsapp", labelKey: "type.whatsapp" },
];
