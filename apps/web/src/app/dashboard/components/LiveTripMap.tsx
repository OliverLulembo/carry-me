"use client";

import { useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  useMap,
} from "react-leaflet";
import L, { type LatLngExpression, type LatLngBoundsExpression } from "leaflet";
import "leaflet/dist/leaflet.css";

// A road-following polyline between origin and destination, fetched from our
// OSRM proxy. Tuples are [lat, lng] (already reprojected server-side).
type RouteGeometry = [number, number][];

// Leaflet's default marker images aren't reachable through the npm package
// when bundled by Next.js / Turbopack — re-point them at the official CDN so
// the icons render instead of breaking with 404s.
const ICON_BASE = "https://unpkg.com/leaflet@1.9.4/dist/images";
const DefaultIcon = L.icon({
  iconRetinaUrl: `${ICON_BASE}/marker-icon-2x.png`,
  iconUrl: `${ICON_BASE}/marker-icon.png`,
  shadowUrl: `${ICON_BASE}/marker-shadow.png`,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// Branded markers — origin gets a pulsing orange dot ("you are here"),
// destination gets a solid dark pin.
const originIcon = L.divIcon({
  className: "carryme-marker carryme-marker--origin",
  html: `
    <span class="carryme-marker__pulse"></span>
    <span class="carryme-marker__dot"></span>
  `,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});
const destinationIcon = L.divIcon({
  className: "carryme-marker carryme-marker--destination",
  html: `<span class="carryme-marker__pin"></span>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

// Intermediate stops on the minibus route (between origin and destination).
const viaStopIcon = L.divIcon({
  className: "carryme-marker carryme-marker--via",
  html: `<span class="carryme-marker__via"></span>`,
  iconSize: [12, 12],
  iconAnchor: [6, 6],
});

type MapPoint = { lat: number; lng: number; label?: string };

type ViaStop = { id: string; name: string; lat: number; lng: number };

export default function LiveTripMap({
  origin,
  destination,
  fromStopId,
  toStopId,
  interactive,
}: {
  origin?: MapPoint;
  destination?: MapPoint;
  /** When set with toStopId, the path follows the route's ordered stops. */
  fromStopId?: string;
  toStopId?: string;
  interactive: boolean;
}) {
  // Render something useful even before both endpoints are known. Falls back
  // to Lusaka city center so the tiles always have something to load.
  const center = useMemo<LatLngExpression>(() => {
    if (origin && destination) {
      return [
        (origin.lat + destination.lat) / 2,
        (origin.lng + destination.lng) / 2,
      ];
    }
    if (origin) return [origin.lat, origin.lng];
    if (destination) return [destination.lat, destination.lng];
    return [-15.4167, 28.2833];
  }, [origin, destination]);

  // Road-following geometry through ordered route stops (when stop IDs are
  // known) or direct A→B driving otherwise. Dashed straight line while loading.
  const { geometry: roadGeometry, viaStops } = useRoadGeometry(
    origin,
    destination,
    fromStopId,
    toStopId,
  );

  return (
    <MapContainer
      center={center}
      zoom={14}
      zoomControl={false}
      attributionControl
      style={{
        width: "100%",
        height: "100%",
        background: "#EEEBE3",
        pointerEvents: interactive ? "auto" : "none",
      }}
      dragging={interactive}
      scrollWheelZoom={interactive}
      touchZoom={interactive}
      doubleClickZoom={interactive}
      boxZoom={interactive}
      keyboard={interactive}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors. Routing &copy; <a href="http://project-osrm.org/">OSRM</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {origin && (
        <Marker position={[origin.lat, origin.lng]} icon={originIcon} />
      )}
      {destination && (
        <Marker
          position={[destination.lat, destination.lng]}
          icon={destinationIcon}
        />
      )}
      {viaStops.map((s) => (
        <Marker
          key={s.id}
          position={[s.lat, s.lng]}
          icon={viaStopIcon}
          title={s.name}
        />
      ))}
      {origin && destination && roadGeometry == null && (
        // Loading / fallback: dashed straight line. Communicates "we have a
        // trip" without pretending it's the real road path.
        <Polyline
          positions={[
            [origin.lat, origin.lng],
            [destination.lat, destination.lng],
          ]}
          pathOptions={{
            color: "#F34213",
            weight: 3,
            opacity: 0.5,
            dashArray: "6 8",
          }}
        />
      )}
      {roadGeometry && roadGeometry.length > 1 && (
        // Drawn in two passes: a soft white "halo" beneath, then the brand
        // orange on top. This keeps the route legible regardless of whether
        // it crosses light or dark map terrain.
        <>
          <Polyline
            positions={roadGeometry}
            pathOptions={{ color: "#FFFFFF", weight: 8, opacity: 0.85 }}
          />
          <Polyline
            positions={roadGeometry}
            pathOptions={{
              color: "#F34213",
              weight: 4.5,
              opacity: 0.95,
              lineCap: "round",
              lineJoin: "round",
            }}
          />
        </>
      )}
      <FitBounds
        origin={origin}
        destination={destination}
        roadGeometry={roadGeometry}
      />
      <InteractivityControl interactive={interactive} />
    </MapContainer>
  );
}

type RoadGeometryResult = {
  geometry: RouteGeometry | null;
  viaStops: ViaStop[];
};

// Fetch road geometry from our OSRM proxy. Prefers stop IDs so the path runs
// through every ordered stop on the CarryMe route; falls back to lat/lng A→B.
function useRoadGeometry(
  origin?: MapPoint,
  destination?: MapPoint,
  fromStopId?: string,
  toStopId?: string,
): RoadGeometryResult {
  const [geometry, setGeometry] = useState<RouteGeometry | null>(null);
  const [viaStops, setViaStops] = useState<ViaStop[]>([]);

  const stopKey =
    fromStopId && toStopId ? `${fromStopId}->${toStopId}` : "";
  const fromKey = origin ? `${origin.lat},${origin.lng}` : "";
  const toKey = destination ? `${destination.lat},${destination.lng}` : "";

  useEffect(() => {
    const hasStopPair = Boolean(fromStopId && toStopId);
    const hasCoords = Boolean(origin && destination);

    if (!hasStopPair && !hasCoords) {
      setGeometry(null);
      setViaStops([]);
      return;
    }

    const ctrl = new AbortController();
    setGeometry(null);
    setViaStops([]);

    const params = new URLSearchParams();
    if (hasStopPair) {
      params.set("fromStopId", fromStopId!);
      params.set("toStopId", toStopId!);
    } else if (origin && destination) {
      params.set("fromLat", origin.lat.toString());
      params.set("fromLng", origin.lng.toString());
      params.set("toLat", destination.lat.toString());
      params.set("toLng", destination.lng.toString());
    }

    fetch(`/api/route?${params.toString()}`, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (ctrl.signal.aborted) return;
        const coords = data?.route?.geometry as RouteGeometry | undefined;
        if (coords && coords.length > 1) setGeometry(coords);

        const via = data?.route?.viaStops as ViaStop[] | undefined;
        if (via && via.length > 2) {
          // Exclude origin and destination — they already have branded markers.
          setViaStops(via.slice(1, -1));
        }
      })
      .catch(() => {
        // Best-effort — dashed fallback remains visible.
      });

    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stopKey, fromKey, toKey]);

  return { geometry, viaStops };
}

// Keeps the viewport fitted to whatever endpoints we have. Re-runs whenever
// the trip changes — also nudges Leaflet to recompute size on each update so
// the tiles fill correctly after the parent's focused/unfocused transitions.
//
// When a road-following geometry is available, we fit to its full bounding
// box rather than the straight-line endpoints, because the road can swing
// well outside the [origin, destination] rectangle on dog-legged paths.
function FitBounds({
  origin,
  destination,
  roadGeometry,
}: {
  origin?: MapPoint;
  destination?: MapPoint;
  roadGeometry: RouteGeometry | null;
}) {
  const map = useMap();
  useEffect(() => {
    if (roadGeometry && roadGeometry.length > 1) {
      map.fitBounds(roadGeometry as LatLngBoundsExpression, {
        padding: [48, 48],
        maxZoom: 16,
      });
    } else if (origin && destination) {
      const bounds: LatLngBoundsExpression = [
        [origin.lat, origin.lng],
        [destination.lat, destination.lng],
      ];
      map.fitBounds(bounds, { padding: [48, 48], maxZoom: 16 });
    } else if (origin) {
      map.setView([origin.lat, origin.lng], 15);
    } else if (destination) {
      map.setView([destination.lat, destination.lng], 15);
    }
    map.invalidateSize();
  }, [origin, destination, roadGeometry, map]);
  return null;
}

// MapContainer's interaction props only apply at mount, so we toggle the
// handlers imperatively whenever the parent flips focused/unfocused.
function InteractivityControl({ interactive }: { interactive: boolean }) {
  const map = useMap();
  useEffect(() => {
    const handlers: Array<L.Handler | undefined> = [
      map.dragging,
      map.scrollWheelZoom,
      map.touchZoom,
      map.doubleClickZoom,
      map.boxZoom,
      map.keyboard,
      (map as unknown as { tap?: L.Handler }).tap,
    ];
    for (const h of handlers) {
      if (!h) continue;
      if (interactive) h.enable();
      else h.disable();
    }
    map.invalidateSize();
  }, [interactive, map]);
  return null;
}
