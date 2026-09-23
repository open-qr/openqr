import { create } from "zustand";
import { persist } from "zustand/middleware";
import { buildPayload, type FieldValues, type PayloadType } from "@/lib/payloads";
import { DEFAULT_STYLE, type QrStyle } from "@/lib/qr/options";
import { detectType, smartFields, type SmartType } from "@/lib/detect";
import { trackEvent } from "@/lib/analytics";

const emptyValues = (): Record<PayloadType, FieldValues> => ({
  url: { url: "" },
  text: { text: "" },
  email: { email: "", subject: "", body: "" },
  phone: { phone: "" },
  sms: { phone: "", message: "" },
  whatsapp: { phone: "", message: "" },
  wifi: { ssid: "", password: "", encryption: "WPA", hidden: false },
  geo: { lat: "", lng: "" },
  vcard: {
    firstName: "", lastName: "", organization: "", title: "",
    mobilePhone: "", generalPhone: "", personalEmail: "", generalEmail: "",
    website: "", street: "", postalCode: "", city: "", country: "",
  },
});

/** Fill newly added types and fields when restoring older configurations. */
function withDefaultValues(values?: Partial<Record<PayloadType, FieldValues>>) {
  const defaults = emptyValues();
  for (const type of Object.keys(defaults) as PayloadType[]) {
    defaults[type] = { ...defaults[type], ...values?.[type] };
  }
  return defaults;
}

interface QrState {
  /** The single smart-input string (auto mode). */
  input: string;
  /** Manual override of the detected type in auto mode (null = auto-detect). */
  override: SmartType | null;
  /** Active structured type, or null when in smart-input mode. */
  structured: PayloadType | null;
  /** Field values for structured types. */
  values: Record<PayloadType, FieldValues>;
  style: QrStyle;

  setInput: (v: string) => void;
  setOverride: (t: SmartType | null) => void;
  setStructured: (t: PayloadType | null) => void;
  setField: (key: string, value: string | boolean) => void;
  setStyle: (patch: Partial<QrStyle>) => void;
  clear: () => void;
  load: (state: Partial<Pick<QrState, "input" | "override" | "structured" | "values" | "style">>) => void;

  activeType: () => PayloadType;
  payload: () => string;
}

export const useQrStore = create<QrState>()(
  persist(
    (set, get) => ({
      input: "",
      override: null,
      structured: null,
      values: emptyValues(),
      style: DEFAULT_STYLE,

      setInput: (v) => set({ input: v }),
      setOverride: (t) => set({ override: t }),
      setStructured: (t) => {
        if (t) trackEvent(t, undefined, "Type");
        set({ structured: t });
      },
      setField: (key, value) =>
        set((st) => {
          const t = st.structured;
          if (!t) return st;
          return { values: { ...st.values, [t]: { ...st.values[t], [key]: value } } };
        }),
      setStyle: (patch) => set((st) => ({ style: { ...st.style, ...patch } })),
      clear: () => set({ input: "", override: null, structured: null, values: emptyValues() }),
      load: (state) => set((current) => ({
        ...state,
        values: withDefaultValues(state.values ?? current.values),
      })),

      activeType: () => {
        const { structured, override, input } = get();
        if (structured) return structured;
        return override ?? detectType(input);
      },

      payload: () => {
        const { structured, override, input, values } = get();
        if (structured) return buildPayload(structured, values[structured]);
        const t: SmartType = override ?? detectType(input);
        return buildPayload(t, smartFields(t, input));
      },
    }),
    {
      name: "openqr-config",
      version: 2,
      merge: (persisted, current) => {
        const saved = persisted as Partial<QrState> | undefined;
        return { ...current, ...saved, values: withDefaultValues(saved?.values) };
      },
    }
  )
);
