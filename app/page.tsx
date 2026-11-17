'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Database, MapPin, Gauge, ShieldAlert } from 'lucide-react';
import { TrafficLog, getSupabaseClient } from '@/lib/supabase';
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

  // Inisialisasi Supabase & Fetch Riwayat Awal
  const initSupabase = async () => {
    const client = getSupabaseClient();
    if (!client) return;

    // 1. Ambil log terakhir dari Supabase untuk data mining
    try {
      const { data, error } = await client
        .from('traffic_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (!error && data) {
        setLogs(data as TrafficLog[]);
      }
    } catch (e) {
      console.error('Error fetching logs from Supabase:', e);
    }

    // 2. Realtime Listener untuk Data Baru yang Masuk dari ESP32
    client
      .channel('realtime:traffic_logs')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'traffic_logs' },
        (payload) => {
          const newRow = payload.new as TrafficLog;
          setLogs((prev) => [newRow, ...prev.slice(0, 49)]);
        }
      )
      .subscribe();
  };

  useEffect(() => {
    initSupabase();
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
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-slate-700">1 Tikungan Aktif Mencari Data</span>
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-sky-600 shrink-0" />
              <h2 className="text-sm font-bold text-slate-800">
                Peta Monitoring Lokasi — Tikungan Buta Aktif (Grabag, Magelang)
              </h2>
            </div>

            {/* Badges Node yang Aktif di Peta */}
            <div className="flex items-center gap-2 text-xs">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 font-medium text-slate-700">
                <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                <span>Node A (LiDAR): <b className="text-emerald-600">ONLINE</b></span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 font-medium text-slate-700">
                <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                <span>Node B (OLED): <b className="text-emerald-600">ONLINE</b></span>
              </div>
            </div>
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
