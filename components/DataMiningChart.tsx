'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { BarChart3 } from 'lucide-react';
import { TrafficLog } from '@/lib/supabase';

interface DataMiningChartProps {
  logs: TrafficLog[];
}

export default function DataMiningChart({ logs }: DataMiningChartProps) {
  const amanCount = logs.filter((l) => l.status === 'AMAN').length;
  const waspadaCount = logs.filter((l) => l.status === 'WASPADA').length;
  const bahayaCount = logs.filter((l) => l.status === 'BAHAYA').length;

  const data = [
    { name: 'Aman', count: amanCount, color: '#10b981' },
    { name: 'Waspada', count: waspadaCount, color: '#f59e0b' },
    { name: 'Bahaya', count: bahayaCount, color: '#ef4444' },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
      <div className="px-5 py-3.5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-sky-600" />
          <h3 className="text-sm font-bold text-slate-800">
            Analitik Data Mining: Frekuensi Status Bahaya
          </h3>
        </div>
        <span className="text-xs text-slate-400 font-mono">Total: {logs.length}</span>
      </div>

      <div className="p-5 h-[340px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '12px',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.08)',
              }}
              formatter={(value: any) => [`${value} Kejadian`, 'Jumlah']}
            />
            <Bar dataKey="count" radius={[6, 6, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

