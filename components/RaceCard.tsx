
import React from 'react';
import { Prediction } from '../types';
import { Trophy, Users, Zap } from 'lucide-react';

interface RaceCardProps {
  prediction: Prediction;
}

export const RaceCard: React.FC<RaceCardProps> = ({ prediction }) => {
  const isBanko = prediction.type === 'BANKO';

  return (
    <div className="relative overflow-hidden bg-[#18181b] rounded-2xl border border-gray-800 shadow-xl mb-4">
      {/* Background Gradient for Banko */}
      {isBanko && (
        <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 blur-3xl -z-0 rounded-full translate-x-10 -translate-y-10"></div>
      )}

      <div className="p-4 relative z-10">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-center justify-center w-12 h-12 bg-[#27272a] rounded-xl border border-gray-700">
              <span className="text-[10px] text-gray-400 font-bold uppercase">Koşu</span>
              <span className="text-xl font-black text-white">{prediction.race_no}</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{prediction.city}</span>
                {isBanko && <Zap size={12} className="text-green-500 fill-green-500" />}
              </div>
              <h3 className="text-xl font-bold text-white leading-tight">
                {prediction.horse_name}
              </h3>
            </div>
          </div>
          
          <div className={`px-3 py-1.5 rounded-lg flex flex-col items-end border ${
            isBanko 
              ? 'bg-green-950/30 border-green-500/30' 
              : 'bg-blue-950/30 border-blue-500/30'
          }`}>
            <span className={`text-[10px] font-bold tracking-widest uppercase ${
              isBanko ? 'text-green-400' : 'text-blue-400'
            }`}>
              {prediction.type}
            </span>
            <span className="text-xs font-medium text-white">
              %{prediction.confidence}
            </span>
          </div>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-400 leading-relaxed line-clamp-2">
            "{prediction.reason}"
          </p>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-gray-800">
          <div className="flex -space-x-2">
            {prediction.sources.slice(0, 3).map((source, i) => (
               <div key={i} className="w-6 h-6 rounded-full bg-gray-700 border-2 border-[#18181b] flex items-center justify-center text-[8px] font-bold text-gray-300 uppercase truncate" title={source}>
                 {source.charAt(0)}
               </div>
            ))}
            {prediction.sources.length > 3 && (
               <div className="w-6 h-6 rounded-full bg-gray-800 border-2 border-[#18181b] flex items-center justify-center text-[8px] text-gray-400">
                 +{prediction.sources.length - 3}
               </div>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Users size={12} />
            <span>{prediction.sources.length} Kaynak</span>
          </div>
        </div>
      </div>
      
      {/* Confidence Bar */}
      <div className="h-1 w-full bg-gray-800">
        <div 
          className={`h-full ${isBanko ? 'bg-green-500' : 'bg-blue-500'}`} 
          style={{ width: `${prediction.confidence}%` }}
        ></div>
      </div>
    </div>
  );
};
