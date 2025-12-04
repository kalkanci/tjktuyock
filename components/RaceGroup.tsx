
import React from 'react';
import { Race, Runner } from '../types';
import { Zap, TrendingUp, Clock, CheckCircle2, XCircle, AlertCircle, Link } from 'lucide-react';

interface RaceGroupProps {
  race: Race;
}

export const RaceGroup: React.FC<RaceGroupProps> = ({ race }) => {
  const isFinished = race.status === 'FINISHED';
  
  // Banko atı bul
  const banko = race.runners.find(r => r.is_banko);

  return (
    <div className={`mb-6 border rounded-2xl overflow-hidden shadow-lg transition-all ${
      isFinished 
        ? 'bg-[#121212] border-gray-800 opacity-80' // Biten koşular biraz sönük
        : 'bg-[#18181b] border-gray-700 shadow-green-900/10' // Aktif koşular canlı
    }`}>
      
      {/* HEADER */}
      <div className="bg-[#09090b] px-4 py-3 border-b border-gray-800 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className={`
            w-10 h-10 rounded-xl flex flex-col items-center justify-center font-bold text-sm leading-none border
            ${isFinished ? 'bg-gray-800 text-gray-400 border-gray-700' : 'bg-green-900/20 text-white border-green-500/30'}
          `}>
            <span>{race.race_no}.</span>
            <span className="text-[9px] font-normal opacity-70">KOŞU</span>
          </div>
          <div>
             <div className="flex items-center gap-2">
               <Clock size={12} className="text-gray-500" />
               <span className="text-xs font-mono text-gray-300">{race.time}</span>
               {isFinished && (
                 <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                   race.success_rate === 'HIT' ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'
                 }`}>
                   {race.success_rate === 'HIT' ? 'TUTTU' : 'TUTMADI'}
                 </span>
               )}
             </div>
          </div>
        </div>
        
        {/* Status Badge */}
        <div className="flex items-center gap-2">
            {!isFinished && banko && (
                <div className="flex items-center gap-1 bg-green-500/10 px-2 py-1 rounded border border-green-500/20">
                    <Zap size={10} className="text-green-500 fill-green-500" />
                    <span className="text-[10px] font-bold text-green-400">BANKO</span>
                </div>
            )}
            {isFinished && (
                <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">SONUÇLANDI</span>
            )}
        </div>
      </div>

      {/* RESULT SECTION (IF FINISHED) */}
      {isFinished && race.actual_winner_no && (
        <div className="bg-gradient-to-r from-gray-900 to-black px-4 py-3 border-b border-gray-800 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-yellow-500 text-black font-black flex items-center justify-center text-sm shadow-[0_0_10px_rgba(234,179,8,0.5)]">
                {race.actual_winner_no}
            </div>
            <div>
                <div className="text-xs text-yellow-500 font-bold uppercase tracking-wide">Kazanan</div>
                <div className="text-xs text-gray-400">{race.result_summary}</div>
            </div>
        </div>
      )}

      {/* RUNNERS LIST */}
      <div className="divide-y divide-gray-800/50">
        {race.runners.map((runner, idx) => {
            // Eğer yarış bittiyse ve bu at kazandıysa highlight et
            const isWinner = isFinished && race.actual_winner_no === runner.horse_no;
            
            return (
              <div key={idx} className={`p-4 relative transition-colors ${
                  isWinner ? 'bg-yellow-500/10' : 'hover:bg-gray-800/30'
              }`}>
                {/* Result Indicator Icon */}
                {isFinished && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-50">
                        {isWinner ? <CheckCircle2 className="text-yellow-500" /> : null}
                    </div>
                )}

                <div className="flex items-start gap-3 relative z-10">
                  <div className={`
                    w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border shrink-0
                    ${isWinner ? 'bg-yellow-500 text-black border-yellow-500' : 
                      runner.is_banko ? 'bg-green-500 text-black border-green-500' : 'bg-transparent text-gray-400 border-gray-600'}
                  `}>
                    {runner.horse_no}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className={`font-bold leading-tight ${
                          isWinner ? 'text-yellow-400' :
                          runner.is_banko ? 'text-green-400' : 'text-white'
                      }`}>
                        {runner.horse_name}
                      </h4>
                      {runner.is_surprise && (
                        <span className="text-[9px] bg-red-500/20 text-red-400 px-1 rounded">Sürpriz</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{runner.reason}</p>
                  </div>
                  
                  {/* Confidence */}
                  {!isFinished && (
                      <div className="flex items-center gap-1 text-xs font-medium text-gray-500">
                        <TrendingUp size={12} />
                        <span>%{runner.confidence}</span>
                      </div>
                  )}
                </div>
              </div>
            );
        })}
      </div>

      {/* BET SUGGESTIONS */}
      {race.bets && race.bets.length > 0 && (
          <div className="bg-[#0c0c0e] px-4 py-3 border-t border-gray-800">
              <h5 className="text-[10px] font-bold text-gray-500 uppercase mb-2 flex items-center gap-1">
                  <Zap size={10} />
                  Bu Koşu İçin Öneriler
              </h5>
              <div className="flex flex-wrap gap-2">
                  {race.bets.map((bet, i) => (
                      <div key={i} className="flex items-center bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
                          <div className="bg-gray-700 px-2 py-1 text-[10px] font-bold text-gray-300 uppercase">
                              {bet.type}
                          </div>
                          <div className="px-2 py-1 text-xs font-mono font-bold text-white">
                              {bet.combination}
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      )}

      {/* GROUNDING SOURCES */}
      {race.sources && race.sources.length > 0 && (
        <div className="bg-[#0c0c0e] px-4 py-2 border-t border-gray-800 flex items-center gap-2">
            <Link size={10} className="text-gray-500" />
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
                {race.sources.map((src, i) => (
                    <a 
                      key={i} 
                      href={src} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-[10px] text-blue-500 hover:text-blue-400 hover:underline whitespace-nowrap"
                    >
                        {new URL(src).hostname.replace('www.', '')}
                    </a>
                ))}
            </div>
        </div>
      )}
    </div>
  );
};
