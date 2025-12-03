import React from 'react';
import { Clock, Map, Trophy, Zap, AlertCircle, Loader2, Tag, Hourglass } from 'lucide-react';
import { Race, Horse } from '../types';

interface RaceCardProps {
  race: Race;
  isResultView?: boolean;
}

export const RaceCard: React.FC<RaceCardProps> = ({ race, isResultView = false }) => {
  
  // Eğer henüz analiz edilmediyse ve bülten sayfasındaysak
  if (!isResultView && race.status === 'waiting') {
      return (
          <div className="bg-racing-900/40 rounded-lg border border-racing-800 border-dashed h-[300px] flex flex-col items-center justify-center p-6 text-center opacity-60">
              <Hourglass className="text-gray-600 mb-3" size={32} />
              <h3 className="text-gray-400 font-bold text-lg">{race.id}. Koşu Bekleniyor</h3>
              <p className="text-xs text-gray-600 mt-2">Sırası gelince analiz edilecek...</p>
          </div>
      );
  }

  // Analiz ediliyorsa
  if (!isResultView && race.status === 'analyzing') {
      return (
          <div className="bg-racing-900/60 rounded-lg border border-blue-500/30 h-[300px] flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-blue-500/5 animate-pulse"></div>
              <Loader2 className="text-blue-500 mb-3 animate-spin" size={32} />
              <h3 className="text-blue-400 font-bold text-lg">{race.id}. Koşu Analiz Ediliyor</h3>
              <p className="text-xs text-blue-300/70 mt-2">Geçmiş koşular ve istatistikler taranıyor...</p>
              <div className="mt-4 w-32 h-1 bg-racing-800 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 animate-[width_1s_ease-in-out_infinite]" style={{width: '50%'}}></div>
              </div>
          </div>
      );
  }

  // Analiz bittiyse veya sonuç sayfasıysa
  
  // Sıralama: Sonuç sayfasıysa No'ya göre, Değilse Puana göre.
  const sortedHorses = [...race.horses].sort((a, b) => {
    if (isResultView) return a.no - b.no;
    
    // Analiz yoksa no sırası
    if (a.power_score === 0 && b.power_score === 0) return a.no - b.no;
    
    return b.power_score - a.power_score;
  });

  const displayHorses = sortedHorses;

  const renderAnalysisBadge = (horse: Horse) => {
    if (!isResultView && (!horse.power_score || horse.power_score === 0)) return <span className="text-[10px] text-gray-600">-</span>;

    if (horse.prediction_type === 'favorite') {
       return (
         <div className="flex flex-col items-end">
            <div className="flex items-center gap-1 bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded text-[10px] font-bold border border-yellow-500/30 uppercase tracking-wide">
               <Trophy size={10} className="fill-current" /> FAVORİ %{Math.round((horse.confidence || 0) * 100)}
            </div>
         </div>
       );
    }
    if (horse.prediction_type === 'surprise') {
        return (
          <div className="flex flex-col items-end">
             <div className="flex items-center gap-1 bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded text-[10px] font-bold border border-purple-500/30 uppercase tracking-wide">
                <Zap size={10} className="fill-current" /> SÜRPRİZ
             </div>
          </div>
        );
    }
    return (
       <div className="w-12 h-1 bg-racing-700 rounded-full overflow-hidden">
          <div className="h-full bg-gray-600" style={{width: `${horse.power_score}%`}}></div>
       </div>
    );
  };

  return (
    <div className={`bg-racing-800 rounded-lg border border-racing-700 overflow-hidden shadow-md flex flex-col h-full relative ${!isResultView ? 'animate-fade-in' : ''}`}>
      {/* Başlık */}
      <div className="bg-racing-900/90 p-3 border-b border-racing-700 flex justify-between items-center backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-racing-gold to-yellow-700 text-racing-950 font-black px-2.5 py-1.5 rounded-lg text-sm shadow-lg border border-yellow-500/50">
            {race.id}
          </div>
          <div>
            <div className="text-gray-100 font-bold text-sm truncate max-w-[150px]">{race.name}</div>
            <div className="flex items-center gap-2 text-[10px] text-gray-400 font-mono">
               <span className="flex items-center gap-0.5 bg-racing-950 px-1.5 py-0.5 rounded"><Clock size={10} /> {race.time}</span>
               <span className="flex items-center gap-0.5 bg-racing-950 px-1.5 py-0.5 rounded"><Map size={10} /> {race.distance}</span>
               <span className="text-racing-accent font-bold uppercase">{race.trackType}</span>
            </div>
          </div>
        </div>
      </div>

      {/* AI Race Summary */}
      {!isResultView && race.race_summary && (
        <div className="px-3 py-2 bg-gradient-to-r from-blue-900/20 to-transparent border-b border-racing-700/50 flex gap-2 items-start">
           <AlertCircle size={14} className="text-blue-400 shrink-0 mt-0.5" />
           <p className="text-[10px] text-blue-200/80 leading-snug">{race.race_summary}</p>
        </div>
      )}

      {/* Liste */}
      <div className="flex-1 overflow-x-auto no-scrollbar">
        <table className="w-full text-left text-sm border-collapse">
          <thead className="bg-racing-950/50 text-[9px] uppercase text-gray-500 font-semibold sticky top-0 z-10">
            <tr>
              <th className="px-3 py-2 w-10 text-center">No</th>
              <th className="px-3 py-2">At / Analiz</th>
              <th className="px-3 py-2 text-right w-24">Durum</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-racing-700/40">
            {displayHorses.map((horse, index) => {
              const isFav = horse.prediction_type === 'favorite';
              const isSur = horse.prediction_type === 'surprise';
              
              // Row Style
              let rowClass = "hover:bg-racing-700/30 transition-colors group";
              if (isFav) rowClass += " bg-yellow-900/10 hover:bg-yellow-900/20";
              if (isSur) rowClass += " bg-purple-900/10 hover:bg-purple-900/20";

              return (
              <tr key={index} className={rowClass}>
                
                {/* No */}
                <td className="px-3 py-2 text-center align-top pt-3">
                   <div className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold font-mono 
                      ${isFav ? 'bg-racing-gold text-racing-900 shadow-[0_0_10px_rgba(234,179,8,0.4)]' : 
                        isSur ? 'bg-purple-500 text-white shadow-[0_0_10px_rgba(168,85,247,0.4)]' : 
                        'bg-racing-700 text-gray-400'}`}>
                      {horse.no}
                   </div>
                </td>

                {/* Info & Reason */}
                <td className="px-3 py-2 align-top">
                  <div className="flex items-center gap-2 mb-0.5">
                      <span className={`font-bold text-sm ${isFav ? 'text-white' : isSur ? 'text-purple-100' : 'text-gray-300'}`}>
                        {horse.name}
                      </span>
                      {horse.jockey && <span className="text-[10px] text-gray-500 bg-racing-950 px-1.5 rounded">{horse.jockey}</span>}
                  </div>

                  {/* Tags */}
                  {!isResultView && horse.tags && horse.tags.length > 0 && (
                     <div className="flex flex-wrap gap-1 mb-1.5">
                        {horse.tags.map((tag, tIdx) => (
                           <span key={tIdx} className="text-[9px] flex items-center gap-0.5 px-1.5 rounded-sm bg-racing-950/60 text-gray-400 border border-racing-700/50">
                              <Tag size={8} /> {tag}
                           </span>
                        ))}
                     </div>
                  )}
                  
                  {/* Reason Text */}
                  {!isResultView && horse.analysis_reason && (
                    <p className={`text-[10px] leading-relaxed italic ${isFav ? 'text-yellow-100/70' : isSur ? 'text-purple-100/70' : 'text-gray-500'}`}>
                       "{horse.analysis_reason}"
                    </p>
                  )}
                </td>

                {/* Score / Badge */}
                <td className="px-3 py-2 text-right align-top pt-2">
                   {isResultView ? (
                      <div className="font-mono text-xs">
                         <div className="text-racing-gold font-bold">{horse.ganyan || '-'} TL</div>
                         <div className="text-[9px] text-gray-500">{horse.finish_time}</div>
                      </div>
                   ) : renderAnalysisBadge(horse)}
                </td>
              </tr>
            )})}
          </tbody>
        </table>
      </div>
    </div>
  );
};
