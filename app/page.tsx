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
        {/* LIVE STATUS BANNER TIKUNGAN (DENGAN TAHAN 5 DETIK SESUAI SARAN DOSEN) */}
        {logs.length > 0 && (
          <section className={`rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs transition-all ${
            logs[0].status === 'BAHAYA'
              ? 'bg-rose-50/90 border-rose-200 text-rose-900'
              : logs[0].status === 'WASPADA'
              ? 'bg-amber-50/90 border-amber-200 text-amber-900'
              : 'bg-emerald-50/90 border-emerald-200 text-emerald-900'
          }`}>
            <div className="flex items-center gap-3">
              <span className={`w-3.5 h-3.5 rounded-full shrink-0 ${
                logs[0].status === 'BAHAYA'
                  ? 'bg-rose-500 animate-ping'
                  : logs[0].status === 'WASPADA'
                  ? 'bg-amber-500 animate-pulse'
                  : 'bg-emerald-500'
              }`}></span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider opacity-75">Status Tikungan Terakhir:</span>
                  <span className="text-sm font-black tracking-wide font-mono px-2 py-0.5 rounded bg-white/70 border border-current">
                    {logs[0].status}
                  </span>
                </div>
                <p className="text-xs opacity-85 mt-0.5">
                  {logs[0].status === 'BAHAYA' || logs[0].status === 'WASPADA'
                    ? '⚠️ Peringatan Aktif: Sistem menahan status bahaya selama 5 detik (Clearance Time) saat mobil meliuk di tikungan.'
                    : '🟢 Jalur Bebas: Tidak terdeteksi kendaraan berisiko di tikungan.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono shrink-0 bg-white/60 px-3 py-1.5 rounded-lg border border-current/20">
              <div>
                <span className="text-[10px] block opacity-60">JARAK OBJEK</span>
                <span className="font-bold">{logs[0].distance_cm ? Number(logs[0].distance_cm).toFixed(1) : '0.0'} cm</span>
              </div>
              <div className="border-l border-current/20 pl-4">
                <span className="text-[10px] block opacity-60">LAJU KECEPATAN</span>
                <span className="font-bold">{logs[0].speed_kmh ? Number(logs[0].speed_kmh).toFixed(1) : '0.0'} km/jam</span>
              </div>
              <div className="border-l border-current/20 pl-4">
                <span className="text-[10px] block opacity-60">SKOR RISIKO</span>
                <span className="font-bold">{logs[0].risk_score ? Number(logs[0].risk_score).toFixed(1) : '0.0'}</span>
              </div>
            </div>
          </section>
        )}

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
