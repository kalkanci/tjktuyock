import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import { Horse } from '../types';

interface DashboardChartProps {
  horses: Horse[];
}

export const DashboardChart: React.FC<DashboardChartProps> = ({ horses }) => {
  // Sort horses by power score desc for better visualization
  const sortedHorses = [...horses].sort((a, b) => b.power_score - a.power_score).slice(0, 6);

  const data = sortedHorses.map(h => ({
    name: h.name.length > 8 ? h.name.substring(0, 8) + '..' : h.name,
    fullname: h.name,
    score: h.power_score,
    risk: h.risk_level
  }));

  const getBarColor = (score: number) => {
    if (score >= 85) return '#10b981'; // Emerald
    if (score >= 65) return '#fbbf24'; // Amber
    return '#64748b'; // Slate
  };

  return (
    <div className="h-48 w-full mt-2">
      <h4 className="text-xs font-semibold text-gray-400 mb-2 uppercase text-center">Güç Skoru Sıralaması (Top 6)</h4>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
          <XAxis 
            dataKey="name" 
            tick={{ fill: '#94a3b8', fontSize: 10 }} 
            tickLine={false}
            axisLine={false}
            interval={0}
          />
          <YAxis 
            tick={{ fill: '#64748b', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            domain={[0, 100]}
          />
          <Tooltip 
            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px' }}
            itemStyle={{ color: '#fff' }}
            labelStyle={{ color: '#f1f5f9', fontWeight: 'bold' }}
            formatter={(value: number) => [`${value} Puan`, 'Güç Skoru']}
          />
          <Bar dataKey="score" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={getBarColor(entry.score)} 
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};