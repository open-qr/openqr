"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useRef, useState } from "react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { LocateFixed, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQrStore } from "@/lib/store";
import { trackEvent } from "@/lib/analytics";
import { useI18n } from "@/lib/i18n/locale-provider";

const DEFAULT_CENTER: [number, number] = [51.5074, -0.1278]; // London

const pinIcon = L.divIcon({
  className: "openqr-pin",
  html: `<svg width="34" height="34" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 23s7-7.6 7-13A7 7 0 1 0 5 10c0 5.4 7 13 7 13Z" fill="#07B1B0" stroke="#ffffff" stroke-width="1.5"/>
    <circle cx="12" cy="10" r="2.6" fill="#ffffff"/>
  </svg>`,
  iconSize: [34, 34],
  iconAnchor: [17, 32],
});

type Pt = { lat: number; lng: number };

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
}

function ClickHandler({ onPick }: { onPick: (p: Pt) => void }) {
  useMapEvents({ click: (e) => onPick({ lat: e.latlng.lat, lng: e.latlng.lng }) });
  return null;
}

function MapController({ point, flyKey }: { point: Pt | null; flyKey: number }) {
  const map = useMap();
  // Fix grey tiles when mounted inside an animating drawer
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 350);
    return () => clearTimeout(t);
  }, [map]);
  // Fly only on explicit search / geolocation (flyKey changes), not on drag/click
  useEffect(() => {
    if (point && flyKey > 0) map.flyTo([point.lat, point.lng], Math.max(map.getZoom(), 15), { duration: 0.6 });
  }, [flyKey]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

export function LocationPicker() {
  const { t, locale } = useI18n();
  const values = useQrStore((s) => s.values.geo);
  const setField = useQrStore((s) => s.setField);

  const initial: Pt | null =
    values.lat && values.lng ? { lat: Number(values.lat), lng: Number(values.lng) } : null;

  const [point, setPoint] = useState<Pt | null>(initial);
  const [flyKey, setFlyKey] = useState(0);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const markerRef = useRef<L.Marker>(null);

  const commit = (p: Pt) => {
    const lat = Number(p.lat.toFixed(6));
    const lng = Number(p.lng.toFixed(6));
    setPoint({ lat, lng });
    setField("lat", String(lat));
    setField("lng", String(lng));
  };

  const flyTo = (p: Pt) => {
    commit(p);
    setFlyKey((k) => k + 1);
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setError(t("location.noGeoSupport"));
      return;
    }
    setLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        flyTo({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        trackEvent("location_gps", undefined, "Location");
        setLocating(false);
      },
      () => {
        setError(t("location.gpsError"));
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const search = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setSearching(true);
    setError(null);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&q=${encodeURIComponent(q)}`,
        { headers: { "Accept-Language": locale } }
      );
      const data: NominatimResult[] = await res.json();
      setResults(data);
      trackEvent("location_search", undefined, "Location");
      if (data.length === 0) setError(t("location.noMatches"));
    } catch {
      setError(t("location.searchFailed"));
    } finally {
      setSearching(false);
    }
  };

  const choose = (r: NominatimResult) => {
    setResults([]);
    setQuery(r.display_name);
    flyTo({ lat: Number(r.lat), lng: Number(r.lon) });
  };

  return (
    <div className="space-y-3">
      {/* Search + GPS */}
      <form onSubmit={search} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("location.searchPlaceholder")}
            className="pl-9"
            aria-label={t("location.searchAriaLabel")}
          />
          {results.length > 0 && (
            <ul className="absolute z-[1000] mt-1 max-h-56 w-full overflow-auto rounded-lg border bg-popover p-1 shadow-md">
              {results.map((r, i) => (
                <li key={i}>
                  <button
                    type="button"
                    onClick={() => choose(r)}
                    className="block w-full rounded-sm px-2 py-1.5 text-left text-xs hover:bg-accent"
                  >
                    {r.display_name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <Button type="submit" variant="outline" size="icon" aria-label={t("location.search")} disabled={searching}>
          {searching ? <Loader2 className="animate-spin" /> : <Search />}
        </Button>
        <Button type="button" variant="outline" onClick={useMyLocation} disabled={locating} className="shrink-0">
          {locating ? <Loader2 className="animate-spin" /> : <LocateFixed />}
          <span className="hidden sm:inline">{t("location.myLocation")}</span>
        </Button>
      </form>

      {error && <p className="text-xs text-destructive">{error}</p>}

      {/* Map */}
      <div className="overflow-hidden rounded-xl border">
        <MapContainer
          center={point ? [point.lat, point.lng] : DEFAULT_CENTER}
          zoom={point ? 15 : 11}
          scrollWheelZoom
          style={{ height: 288, width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />
          <ClickHandler onPick={commit} />
          <MapController point={point} flyKey={flyKey} />
          {point && (
            <Marker
              position={[point.lat, point.lng]}
              icon={pinIcon}
              draggable
              ref={markerRef}
              eventHandlers={{
                dragend: () => {
                  const m = markerRef.current;
                  if (m) commit(m.getLatLng());
                },
              }}
            />
          )}
        </MapContainer>
      </div>

      <p className="text-xs text-muted-foreground">
        {point ? (
          <>
            {t("location.selectedPrefix")}{" "}
            <span className="font-mono text-foreground">{point.lat}, {point.lng}</span> {t("location.selectedSuffix")}
          </>
        ) : (
          t("location.helper")
        )}
      </p>
    </div>
  );
}
