'use client';

import { Download, Database, Inbox } from 'lucide-react';
import { TrafficLog } from '@/lib/supabase';

interface DataMiningTableProps {
  logs: TrafficLog[];
}

export default function DataMiningTable({ logs }: DataMiningTableProps) {
  const exportCSV = () => {
    if (logs.length === 0) {
      alert('Belum ada data untuk diunduh.');
      return;
    }

    let csvContent = 'data:text/csv;charset=utf-8,ID,Waktu,Lokasi,Jarak_cm,Kecepatan_kmh,Skor_Risiko,Status\n';
    logs.forEach((r, idx) => {
      const time = r.created_at ? new Date(r.created_at).toLocaleString('id-ID') : '-';
      const loc = r.location || 'Tikungan KM 14';
      const dist = r.distance_cm ?? 0;
      const speed = r.speed_kmh ?? 0;
      const risk = r.risk_score ?? 0;
      const stat = r.status || 'AMAN';
      csvContent += `${r.id ?? idx + 1},"${time}","${loc}",${dist},${speed},${risk},${stat}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `CWAY_DataMining_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-emerald-600" />
          <h3 className="text-sm font-bold text-slate-800">
            Log Data Mining Terakhir (Database Supabase)
          </h3>
        </div>
        <button
          onClick={exportCSV}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-2xs cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Unduh CSV</span>
        </button>
      </div>

      {/* Table Body */}
      <div className="overflow-x-auto max-h-[340px]">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 sticky top-0 z-10 font-bold text-slate-600">
              <th className="py-2.5 px-4">Waktu</th>
              <th className="py-2.5 px-4">Jarak</th>
              <th className="py-2.5 px-4">Laju Kecepatan</th>
              <th className="py-2.5 px-4">Skor Risiko</th>
              <th className="py-2.5 px-4">Status Bahaya</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-400 font-sans">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Inbox className="w-7 h-7 text-slate-300" />
                    <p className="text-xs">
                      Belum ada data kendaraan terdeteksi.
                    </p>
                    <span className="text-[11px] text-slate-400">
                      Menunggu data masuk dari alat fisik ESP32 via Supabase...
                    </span>
                  </div>
                </td>
              </tr>
            ) : (
              logs.map((item, idx) => {
                const isDanger = item.status === 'BAHAYA';
                const isWarning = item.status === 'WASPADA';
                const timeFormatted = item.created_at
                  ? new Date(item.created_at).toLocaleTimeString('id-ID')
                  : new Date().toLocaleTimeString('id-ID');

                return (
                  <tr key={item.id ?? idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-4 text-slate-600">{timeFormatted}</td>
                    <td className="py-2.5 px-4 text-slate-800 font-bold">
                      {item.distance_cm ? `${Number(item.distance_cm).toFixed(1)} cm` : '-'}
                    </td>
                    <td className="py-2.5 px-4 text-slate-800 font-bold">
                      {item.speed_kmh ? `${Number(item.speed_kmh).toFixed(1)} km/h` : '-'}
                    </td>
                    <td className="py-2.5 px-4 text-slate-600">
                      {item.risk_score ? Number(item.risk_score).toFixed(1) : '-'}
                    </td>
                    <td className="py-2.5 px-4 font-sans">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          isDanger
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : isWarning
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

