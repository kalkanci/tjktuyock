import React, { useState } from 'react';
import { Clock, Map, Activity, ShieldAlert, Zap, TrendingUp, ChevronDown, ChevronUp, Scale, History } from 'lucide-react';
import { Race, Horse } from '../types';
import { DashboardChart } from './DashboardChart';

interface RaceCardProps {
  race: Race;
}

export const RaceCard: React.FC<RaceCardProps> = ({ race }) => {
  const [expanded, setExpanded] = useState(false);

  // Helper for Risk Badge
  const getRiskBadge = (level: string) => {
    switch(level) {
      case 'düşük': return <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-2 py-0.5 rounded border border-emerald-500/30">Düşük Risk</span>;
      case 'orta': return <span className="bg-yellow-500/20 text-yellow-400 text-[10px] px-2 py-0.5 rounded border border-yellow-500/30">Orta Risk</span>;
      case 'yüksek': return <span className="bg-red-500/20 text-red-400 text-[10px] px-2 py-0.5 rounded border border-red-500/30">Yüksek Risk</span>;
      default: return null;
    }
  };

  // Helper for Tempo Badge
  const getTempoIcon = (style: string) => {
    if (style?.includes('lider') || style?.includes('ön')) return <Zap size={12} className="text-yellow-400" />;
    if (style?.includes('sprint') || style?.includes('geri')) return <TrendingUp size={12} className="text-blue-400" />;
    return <Activity size={12} className="text-gray-400" />;
  };

  // Sort horses by Power Score for display
  const sortedHorses = [...race.horses].sort((a, b) => b.power_score - a.power_score);
  const topPick = sortedHorses[0];

  return (
    <div className="bg-racing-800 rounded-xl border border-racing-700 overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300">
      {/* Header */}
      <div className="bg-racing-900/80 p-4 border-b border-racing-700">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-racing-gold text-racing-900 font-bold px-2 py-0.5 rounded text-sm">#{race.id}</span>
              <span className="flex items-center gap-1 text-gray-300 text-xs font-mono">
                <Clock size={12} /> {race.time}
              </span>
            </div>
            <h3 className="font-semibold text-gray-100 text-sm md:text-base">{race.name}</h3>
          </div>
          <div className="text-right">
             <div className="flex items-center justify-end gap-1 text-xs text-gray-400">
                <Map size={12} />
                <span>{race.distance}</span>
             </div>
             <div className="mt-1 text-[10px] text-gray-500 uppercase tracking-wider">{race.trackType}</div>
          </div>
        </div>
        
        {/* Race Summary & Analysis */}
        <div className="mt-3 p-3 bg-racing-800/50 rounded-lg border border-racing-700/50">
          <p className="text-xs text-gray-300 italic mb-2">"{race.race_summary}"</p>
          <div className="flex items-center gap-2 text-[10px] text-gray-400">
             <span className="font-bold text-racing-accent">Pist Notu:</span> {race.track_surface_comment}
          </div>
        </div>
      </div>

      {/* Top Pick Highlight */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-2">
           <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">En Yüksek Power Score</span>
           <span className="text-xs font-mono text-gray-500">Güç: {topPick?.power_score}/100</span>
        </div>
        <div className="bg-gradient-to-r from-racing-800 to-racing-700 p-3 rounded-lg border-l-4 border-racing-accent flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2">
               <span className="font-bold text-lg text-white">{topPick?.name}</span>
               <span className="text-xs text-gray-400">({topPick?.jockey})</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
               {getRiskBadge(topPick?.risk_level)}
               <span className="text-[10px] text-gray-400 flex items-center gap-1">
                 {getTempoIcon(topPick?.tempo_style)} {topPick?.tempo_style}
               </span>
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-black text-racing-accent">{topPick?.power_score}</div>
          </div>
        </div>
      </div>

      {/* Expandable Detailed Table */}
      <div className="px-4 pb-4">
        <button 
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-center gap-2 py-2 mt-2 text-xs text-gray-500 hover:text-gray-300 transition-colors border-t border-racing-700"
        >
          {expanded ? 'Detayları Gizle' : 'Tüm Atları Göster'} 
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {expanded && (
          <div className="mt-3 animate-fade-in space-y-3">
             {/* Chart for context */}
             <DashboardChart horses={race.horses} />

             {/* Detailed List */}
             <div className="space-y-2 mt-4">
               {sortedHorses.map((horse) => (
                 <div key={horse.no} className="bg-racing-900/50 p-3 rounded border border-racing-700/50 hover:border-racing-600 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                       <div className="flex items-center gap-2">
                          <span className="w-5 h-5 flex items-center justify-center bg-racing-800 rounded-full text-[10px] font-bold text-gray-400">{horse.no}</span>
                          <span className="font-bold text-sm text-gray-200">{horse.name}</span>
                       </div>
                       <div className="flex items-center gap-2">
                          <div className="text-right">
                             <div className="text-[10px] text-gray-500">Skor</div>
                             <div className={`font-mono font-bold ${horse.power_score >= 80 ? 'text-green-400' : horse.power_score >= 60 ? 'text-yellow-400' : 'text-gray-500'}`}>
                               {horse.power_score}
                             </div>
                          </div>
                       </div>
                    </div>
                    
                    {/* Metrics Grid */}
                    <div className="grid grid-cols-2 gap-2 text-[10px] mb-2">
                       <div className="flex items-center gap-1 text-gray-400 bg-racing-800/50 px-2 py-1 rounded">
                          <Scale size={10} />
                          <span>Kilo: <span className="text-gray-300">{horse.weight_effect}</span></span>
                       </div>
                       <div className="flex items-center gap-1 text-gray-400 bg-racing-800/50 px-2 py-1 rounded">
                          <History size={10} />
                          <span>Form: <span className="text-gray-300 truncate">{horse.last_races_summary}</span></span>
                       </div>
                    </div>
                    
                    <p className="text-[10px] text-gray-500 border-t border-racing-700/30 pt-1 mt-1">
                      {horse.form_comment} | {horse.distance_surface_fit}
                    </p>
                 </div>
               ))}
             </div>
          </div>
        )}
      </div>

      <div className="bg-racing-900/30 px-4 py-2 text-[10px] text-gray-600 text-center border-t border-racing-800">
        {race.disclaimer}
      </div>
    </div>
  );
};