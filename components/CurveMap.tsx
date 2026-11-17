'use client';

import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';

const ACTIVE_CURVE = {
  name: 'Tikungan Buta C-WAY',
  position: [-7.489188, 110.218291] as [number, number],
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
      }).setView(ACTIVE_CURVE.position, 18);

      mapInstanceRef.current = map;

      // Tile Google Maps (Roadmap & Satelit Hybrid) — 100% Detail Lengkap sampai Zoom 20 tanpa API Key
      const googleRoadmap = L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
        maxZoom: 20,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
        attribution: '&copy; Google Maps'
      });

      const googleSatellite = L.tileLayer('https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
        maxZoom: 20,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
        attribution: '&copy; Google Maps Satelit'
      });

      // Default aktifkan peta jalan Google
      googleRoadmap.addTo(map);

      // Pengontrol layer di pojok kanan atas (Peta Jalan vs Satelit)
      L.control.layers({
        'Peta Jalan': googleRoadmap,
        'Citra Satelit': googleSatellite
      }, undefined, { position: 'topright' }).addTo(map);

      // 1 Marker Tunggal yang merepresentasikan sistem 2 Node
      const curveIcon = L.divIcon({
        className: 'custom-curve-pin',
        html: `
          <div style="position:relative; width:36px; height:36px; display:flex; align-items:center; justify-content:center;">
            <div style="position:absolute; width:100%; height:100%; border-radius:50%; background:rgba(2, 132, 199, 0.25);"></div>
            <div style="position:relative; width:28px; height:28px; border-radius:50%; background:#0284c7; border:3px solid white; box-shadow:0 3px 8px rgba(0,0,0,0.35); display:flex; align-items:center; justify-content:center; color:white;">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a8 8 0 0 0-8 8c0 5.4 7.05 11.5 7.35 11.76a1 1 0 0 0 1.3 0C13 21.5 20 15.4 20 10a8 8 0 0 0-8-8z"/><circle cx="12" cy="10" r="3"/></svg>
            </div>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        popupAnchor: [0, -18]
      });

      const marker = L.marker(ACTIVE_CURVE.position, { icon: curveIcon }).addTo(map);
      marker.bindPopup(`
        <div style="font-family:sans-serif; font-size:12px; line-height:1.5; min-width:210px;">
          <b style="color:#0f172a; font-size:13px;">${ACTIVE_CURVE.name}</b><br/>
          <span style="color:#10b981; font-weight:700;">● SISTEM AKTIF (TERINTEGRASI)</span><br/>
          <div style="margin-top:6px; padding-top:6px; border-top:1px solid #e2e8f0; color:#475569; font-size:11px;">
            <b>Node A (Hulu):</b> Sensor LiDAR & Edge AI ESP32<br/>
            <b>Node B (Hilir):</b> Layar Peringatan OLED & ESP8266<br/>
            <b>Jaringan:</b> LoRa P2P 433 MHz
          </div>
        </div>
      `).openPopup();
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

