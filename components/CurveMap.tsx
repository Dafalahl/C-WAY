'use client';

import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';

interface NodeInfo {
  lat: number;
  lng: number;
  name: string;
  role: string;
}

const ACTIVE_CURVE = {
  name: 'Tikungan Buta KM 14 — Grabag, Magelang',
  center: [-7.3592, 110.3340] as [number, number],
  nodeA: {
    lat: -7.3589,
    lng: 110.3337,
    name: 'Node A (Tiang Hulu)',
    role: 'Sensor LiDAR Benewake & Edge AI ESP32'
  },
  nodeB: {
    lat: -7.3595,
    lng: 110.3343,
    name: 'Node B (Tiang Hilir)',
    role: 'Layar Peringatan OLED SSD1306 & ESP8266'
  }
};

export default function CurveMap() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    let isMounted = true;

    // Load leaflet secara dinamis di client
    import('leaflet').then((L) => {
      if (!isMounted || !mapContainerRef.current) return;

      const map = L.map(mapContainerRef.current, {
        zoomControl: true,
        scrollWheelZoom: false,
      }).setView(ACTIVE_CURVE.center, 18);

      mapInstanceRef.current = map;

      // Gunakan Tile ESRI World Street Map (100% Gratis, jernih & tanpa butuh API key)
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      // Custom icon Marker Node A (Blue)
      const iconA = L.divIcon({
        className: 'custom-pin-a',
        html: `<div style="background:#0284c7; width:30px; height:30px; border-radius:50%; border:3px solid white; box-shadow:0 3px 8px rgba(0,0,0,0.3); display:flex; align-items:center; justify-content:center; color:white; font-size:12px; font-weight:800; font-family:sans-serif;">A</div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      });

      // Custom icon Marker Node B (Purple)
      const iconB = L.divIcon({
        className: 'custom-pin-b',
        html: `<div style="background:#8b5cf6; width:30px; height:30px; border-radius:50%; border:3px solid white; box-shadow:0 3px 8px rgba(0,0,0,0.3); display:flex; align-items:center; justify-content:center; color:white; font-size:12px; font-weight:800; font-family:sans-serif;">B</div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      });

      // Tambahkan Marker Node A
      const markerA = L.marker([ACTIVE_CURVE.nodeA.lat, ACTIVE_CURVE.nodeA.lng], { icon: iconA }).addTo(map);
      markerA.bindPopup(`
        <div style="font-family:sans-serif; font-size:12px; line-height:1.4;">
          <b style="color:#0284c7; font-size:13px;">${ACTIVE_CURVE.nodeA.name}</b><br/>
          <span style="color:#10b981; font-weight:700;">● STATUS: ONLINE</span><br/>
          ${ACTIVE_CURVE.nodeA.role}
        </div>
      `).openPopup();

      // Tambahkan Marker Node B
      const markerB = L.marker([ACTIVE_CURVE.nodeB.lat, ACTIVE_CURVE.nodeB.lng], { icon: iconB }).addTo(map);
      markerB.bindPopup(`
        <div style="font-family:sans-serif; font-size:12px; line-height:1.4;">
          <b style="color:#8b5cf6; font-size:13px;">${ACTIVE_CURVE.nodeB.name}</b><br/>
          <span style="color:#10b981; font-weight:700;">● STATUS: ONLINE</span><br/>
          ${ACTIVE_CURVE.nodeB.role}
        </div>
      `);

      // Garis Putus-putus Nirkabel LoRa 433 MHz Menembus Tebing
      const loraLine = L.polyline([
        [ACTIVE_CURVE.nodeA.lat, ACTIVE_CURVE.nodeA.lng],
        [ACTIVE_CURVE.nodeB.lat, ACTIVE_CURVE.nodeB.lng]
      ], {
        color: '#f59e0b',
        weight: 3,
        dashArray: '6, 6',
        opacity: 0.85
      }).addTo(map);

      loraLine.bindTooltip("Koneksi Nirkabel LoRa 433 MHz (Tembus Tebing)", {
        permanent: true,
        direction: 'center',
        className: 'lora-tooltip'
      });
    });

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div className="relative w-full h-[420px] rounded-lg overflow-hidden border border-slate-200 shadow-sm">
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
}

