import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Horse } from '../types';

interface DashboardChartProps {
  horses: Horse[];
}

export const DashboardChart: React.FC<DashboardChartProps> = ({ horses }) => {
  const data = horses.map(h => ({
    name: h.name.length > 10 ? h.name.substring(0, 8) + '...' : h.name,
    fullname: h.name,
    score: h.score,
    isFav: h.isFavorite
  }));

  return (
    <div className="h-40 w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
          <XAxis 
            dataKey="name" 
            tick={{ fill: '#94a3b8', fontSize: 10 }} 
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            hide 
            domain={[0, 100]}
          />
          <Tooltip 
            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px' }}
            itemStyle={{ color: '#fbbf24' }}
            labelStyle={{ color: '#f1f5f9' }}
          />
          <Bar dataKey="score" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.isFav ? '#fbbf24' : '#334155'} 
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};