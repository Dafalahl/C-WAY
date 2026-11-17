'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Database, MapPin, Gauge, ShieldAlert } from 'lucide-react';
import { TrafficLog } from '@/lib/supabase';
import DataMiningTable from '@/components/DataMiningTable';
import DataMiningChart from '@/components/DataMiningChart';

// Load map component dynamically on client-side only (anti-SSR window error)
const CurveMap = dynamic(() => import('@/components/CurveMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[420px] bg-slate-100 animate-pulse rounded-lg flex items-center justify-center text-slate-400 text-xs">
      Memuat peta tikungan aktif...
    </div>
  ),
});

export default function DashboardPage() {
  const [logs, setLogs] = useState<TrafficLog[]>([]);
  const [dbStatus, setDbStatus] = useState<'loading' | 'connected' | 'error'>('loading');

  // Fetch data logs dari API Server Route (menghindari error Supabase key di browser)
  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/traffic', { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        if (json.logs && Array.isArray(json.logs)) {
          setLogs(json.logs);
          setDbStatus('connected');
          return;
        }
      }
      setDbStatus('error');
    } catch (e) {
      console.error('Failed to fetch from /api/traffic:', e);
      setDbStatus('error');
    }
  };

  useEffect(() => {
    fetchLogs();
    // Auto-refresh setiap 2 detik untuk data real-time saat ESP32 mengunggah log baru
    const interval = setInterval(fetchLogs, 2000);
    return () => clearInterval(interval);
  }, []);

  // Perhitungan Ringkasan Data Mining
  const totalLogs = logs.length;
  const avgSpeed =
    logs.length > 0
      ? logs.reduce((acc, curr) => acc + (curr.speed_kmh ?? 0), 0) / logs.length
      : 0;
  const hazardCount = logs.filter(
    (l) => l.status === 'BAHAYA' || l.status === 'WASPADA'
  ).length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 px-6 py-3.5 flex justify-between items-center shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-sky-600 rounded-lg flex items-center justify-center text-white font-extrabold text-base shadow-sm">
            C
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-900 leading-tight">
              C-WAY Monitoring & Data Mining
            </h1>
            <p className="text-[11px] text-slate-500">
              Sistem Peringatan Dini Tikungan Buta — Skala Miniatur 60 cm
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border border-slate-200 bg-slate-50">
            <span className={`w-2 h-2 rounded-full ${dbStatus === 'connected' ? 'bg-emerald-500 animate-pulse' : dbStatus === 'error' ? 'bg-rose-500' : 'bg-amber-500 animate-pulse'}`}></span>
            <span className="text-slate-700">
              {dbStatus === 'connected' ? `Supabase: Terhubung (${logs.length} Log)` : dbStatus === 'error' ? 'Supabase: Terputus' : 'Menghubungkan Supabase...'}
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border border-slate-200 bg-slate-50">
            <span className="w-2 h-2 rounded-full bg-sky-500"></span>
            <span className="text-slate-700">1 Tikungan Aktif</span>
          </div>
        </div>
      </header>

      {/* Main Content Dashboard */}
      <main className="max-w-7xl w-full mx-auto p-6 flex flex-col gap-6">
        {/* ROW 1: 3 KPI CARDS */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <div className="flex justify-between items-start">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Total Log Terdata
              </span>
              <Database className="w-4 h-4 text-sky-600 opacity-80" />
            </div>
            <div className="text-2xl font-black font-mono text-slate-800 mt-2">
              {totalLogs} <span className="text-xs font-medium text-slate-400">kendaraan</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Disimpan permanen di Supabase</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <div className="flex justify-between items-start">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Rata-rata Kecepatan Tikungan
              </span>
              <Gauge className="w-4 h-4 text-emerald-600 opacity-80" />
            </div>
            <div className="text-2xl font-black font-mono text-slate-800 mt-2">
              {avgSpeed.toFixed(1)}{' '}
              <span className="text-xs font-medium text-slate-400">km/jam</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Berdasarkan data mining kendaraan</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <div className="flex justify-between items-start">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Insiden Bahaya / Waspada
              </span>
              <ShieldAlert className="w-4 h-4 text-rose-600 opacity-80" />
            </div>
            <div className="text-2xl font-black font-mono text-slate-800 mt-2">
              {hazardCount}{' '}
              <span className="text-xs font-medium text-slate-400">kali</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Status risiko tinggi terdeteksi</p>
          </div>
        </section>

        {/* ROW 2: PETA TIKUNGAN AKTIF (FULL WIDTH) */}
        <section className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2 px-1">
            <MapPin className="w-4 h-4 text-sky-600 shrink-0" />
            <h2 className="text-sm font-bold text-slate-800">
              Peta Monitoring Lokasi — Tikungan Buta Aktif
            </h2>
          </div>

          <CurveMap />
        </section>

        {/* ROW 3: ANALYTICS & DATA MINING */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5">
            <DataMiningChart logs={logs} />
          </div>
          <div className="lg:col-span-7">
            <DataMiningTable logs={logs} />
          </div>
        </section>
      </main>
    </div>
  );
}
