"use client";

import dynamic from "next/dynamic";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQrStore } from "@/lib/store";
import type { FieldValues, PayloadType } from "@/lib/payloads";
import { useI18n } from "@/lib/i18n/locale-provider";

const LocationPicker = dynamic(
  () => import("@/components/generator/location-picker").then((m) => m.LocationPicker),
  {
    ssr: false,
    loading: function LoadingMap() {
      const { t } = useI18n();
      return (
        <div className="flex h-72 items-center justify-center rounded-xl border bg-muted text-sm text-muted-foreground">
          {t("payloadFields.loadingMap")}
        </div>
      );
    },
  }
);

function useStructured() {
  const type = useQrStore((s) => s.structured) as PayloadType;
  const values = useQrStore((s) => (s.structured ? s.values[s.structured] : {})) as FieldValues;
  const setField = useQrStore((s) => s.setField);
  return { type, values, setField };
}

function Text({ k, label, placeholder, type = "text" }: { k: string; label: string; placeholder?: string; type?: string }) {
  const { values, setField } = useStructured();
  const id = `f-${k}`;
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        placeholder={placeholder}
        value={String(values[k] ?? "")}
        onChange={(e) => setField(k, e.target.value)}
      />
    </div>
  );
}

function TextArea({ k, label, placeholder }: { k: string; label: string; placeholder?: string }) {
  const { values, setField } = useStructured();
  const id = `f-${k}`;
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Textarea
        id={id}
        placeholder={placeholder}
        value={String(values[k] ?? "")}
        onChange={(e) => setField(k, e.target.value)}
      />
    </div>
  );
}

export function PayloadFields() {
  const { type, values, setField } = useStructured();
  const { t } = useI18n();
  const v = values;

  switch (type) {
    case "email":
      return (
        <div className="space-y-3">
          <Text k="email" label={t("payloadFields.emailAddress")} placeholder="hello@example.com" type="email" />
          <Text k="subject" label={t("payloadFields.subjectOptional")} />
          <TextArea k="body" label={t("payloadFields.messageOptional")} />
        </div>
      );
    case "sms":
      return (
        <div className="space-y-3">
          <Text k="phone" label={t("payloadFields.phoneNumber")} placeholder="+44 7000 000000" type="tel" />
          <TextArea k="message" label={t("payloadFields.messageOptional")} />
        </div>
      );
    case "whatsapp":
      return (
        <div className="space-y-3">
          <Text
            k="phone"
            label={t("payloadFields.phoneNumberCountryCode")}
            placeholder="447000000000"
            type="tel"
          />
          <TextArea k="message" label={t("payloadFields.prefilledMessageOptional")} />
        </div>
      );
    case "wifi":
      return (
        <div className="space-y-3">
          <Text
            k="ssid"
            label={t("payloadFields.networkName")}
            placeholder={t("payloadFields.networkNamePlaceholder")}
          />
          <div className="space-y-1.5">
            <Label htmlFor="f-encryption">{t("payloadFields.security")}</Label>
            <Select value={String(v.encryption ?? "WPA")} onValueChange={(val) => setField("encryption", val)}>
              <SelectTrigger id="f-encryption">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="WPA">{t("payloadFields.wpa")}</SelectItem>
                <SelectItem value="WEP">{t("payloadFields.wep")}</SelectItem>
                <SelectItem value="nopass">{t("payloadFields.noPassword")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {v.encryption !== "nopass" && (
            <Text k="password" label={t("payloadFields.password")} placeholder="••••••••" />
          )}
          <div className="flex items-center justify-between pt-1">
            <Label htmlFor="f-hidden">{t("payloadFields.hiddenNetwork")}</Label>
            <Switch id="f-hidden" checked={Boolean(v.hidden)} onCheckedChange={(c) => setField("hidden", c)} />
          </div>
        </div>
      );
    case "geo":
      return <LocationPicker />;
    default:
      return null;
  }
}
