"use client";

import dynamic from "next/dynamic";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQrStore } from "@/lib/store";
import type { FieldValues, PayloadType } from "@/lib/payloads";

const LocationPicker = dynamic(
  () => import("@/components/generator/location-picker").then((m) => m.LocationPicker),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-72 items-center justify-center rounded-xl border bg-muted text-sm text-muted-foreground">
        Loading map…
      </div>
    ),
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
  const v = values;

  switch (type) {
    case "email":
      return (
        <div className="space-y-3">
          <Text k="email" label="Email address" placeholder="hello@example.com" type="email" />
          <Text k="subject" label="Subject (optional)" />
          <TextArea k="body" label="Message (optional)" />
        </div>
      );
    case "sms":
      return (
        <div className="space-y-3">
          <Text k="phone" label="Phone number" placeholder="+44 7000 000000" type="tel" />
          <TextArea k="message" label="Message (optional)" />
        </div>
      );
    case "whatsapp":
      return (
        <div className="space-y-3">
          <Text k="phone" label="Phone number (with country code)" placeholder="447000000000" type="tel" />
          <TextArea k="message" label="Pre-filled message (optional)" />
        </div>
      );
    case "wifi":
      return (
        <div className="space-y-3">
          <Text k="ssid" label="Network name (SSID)" placeholder="My Wi-Fi" />
          <div className="space-y-1.5">
            <Label htmlFor="f-encryption">Security</Label>
            <Select value={String(v.encryption ?? "WPA")} onValueChange={(val) => setField("encryption", val)}>
              <SelectTrigger id="f-encryption">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="WPA">WPA/WPA2/WPA3</SelectItem>
                <SelectItem value="WEP">WEP</SelectItem>
                <SelectItem value="nopass">No password</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {v.encryption !== "nopass" && <Text k="password" label="Password" placeholder="••••••••" />}
          <div className="flex items-center justify-between pt-1">
            <Label htmlFor="f-hidden">Hidden network</Label>
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
