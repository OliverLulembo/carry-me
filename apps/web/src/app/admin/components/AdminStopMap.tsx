"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import L, { type LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";

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

const pinIcon = L.divIcon({
  className: "carryme-marker carryme-marker--origin",
  html: `
    <span class="carryme-marker__pulse"></span>
    <span class="carryme-marker__dot"></span>
  `,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const DEFAULT_CENTER: LatLngExpression = [-15.4167, 28.2833];

function MapClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function Recenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], 16);
    map.invalidateSize();
  }, [lat, lng, map]);
  return null;
}

export default function AdminStopMap({
  lat,
  lng,
  onChange,
}: {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
}) {
  const hasPin = Number.isFinite(lat) && Number.isFinite(lng);

  return (
    <MapContainer
      center={hasPin ? [lat, lng] : DEFAULT_CENTER}
      zoom={hasPin ? 16 : 13}
      className="h-full w-full rounded-2xl z-0"
      style={{ background: "#EEEBE3" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapClickHandler onPick={onChange} />
      {hasPin && (
        <>
          <Recenter lat={lat} lng={lng} />
          <Marker
            position={[lat, lng]}
            icon={pinIcon}
            draggable
            eventHandlers={{
              dragend(e) {
                const pos = e.target.getLatLng();
                onChange(pos.lat, pos.lng);
              },
            }}
          />
        </>
      )}
    </MapContainer>
  );
}
