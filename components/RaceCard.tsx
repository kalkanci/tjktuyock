import React from 'react';
import { Clock, Map, Trophy } from 'lucide-react';
import { Race } from '../types';

interface RaceCardProps {
  race: Race;
  isResultView?: boolean;
}

export const RaceCard: React.FC<RaceCardProps> = ({ race, isResultView = false }) => {
  // Sıralama mantığı: Sonuç sayfasıysa No'ya göre (veya bitiriş sırası), Analiz ise Puana göre
  const sortedHorses = [...race.horses].sort((a, b) => {
    if (isResultView) return a.no - b.no; 
    return b.power_score - a.power_score;
  });

  // Bülten modunda sadece ilk 6 atı göster (kalabalığı önlemek için)
  // Sonuç modunda hepsini göster
  const displayHorses = isResultView ? sortedHorses : sortedHorses.slice(0, 6);

  return (
    <div className="bg-racing-800 rounded-lg border border-racing-700 overflow-hidden shadow-md flex flex-col h-full">
      {/* Başlık Çubuğu */}
      <div className="bg-racing-900/80 p-3 border-b border-racing-700 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="bg-racing-gold text-racing-900 font-bold px-2 py-1 rounded text-sm w-12 text-center">
            {race.id}.K
          </div>
          <div>
            <div className="text-gray-100 font-bold text-sm truncate max-w-[150px] md:max-w-xs">{race.name}</div>
            <div className="flex items-center gap-2 text-[10px] text-gray-400">
               <span className="flex items-center gap-0.5"><Clock size={10} /> {race.time}</span>
               <span className="flex items-center gap-0.5"><Map size={10} /> {race.distance}</span>
               <span className="text-racing-accent">{race.trackType}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Özet Not (Sadece Bültende) */}
      {!isResultView && race.race_summary && (
        <div className="px-3 py-1.5 bg-racing-700/30 border-b border-racing-700/50">
          <p className="text-[10px] text-gray-400 line-clamp-1 italic">{race.race_summary}</p>
        </div>
      )}

      {/* Tabela / Liste Görünümü */}
      <div className="flex-1 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-racing-900/40 text-[9px] uppercase text-gray-500 font-semibold">
            <tr>
              <th className="px-3 py-2 w-10 text-center">{isResultView ? 'Sıra' : 'No'}</th>
              <th className="px-3 py-2">At İsmi</th>
              <th className="px-3 py-2 hidden sm:table-cell">Jokey</th>
              <th className="px-3 py-2 text-right">{isResultView ? 'Ganyan/Drc' : 'Güç'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-racing-700/50">
            {displayHorses.map((horse, index) => (
              <tr key={index} className={`hover:bg-racing-700/40 transition-colors ${index === 0 && !isResultView ? 'bg-racing-accent/5' : ''}`}>
                
                {/* Sıra / No Sütunu */}
                <td className="px-3 py-2 text-center">
                  {isResultView ? (
                     // Sonuçlarda Madalya/Sıra İkonu
                     <div className="flex justify-center">
                        {horse.no === 1 ? <Trophy size={14} className="text-yellow-400" /> : 
                         horse.no === 2 ? <Trophy size={14} className="text-gray-300" /> :
                         horse.no === 3 ? <Trophy size={14} className="text-orange-400" /> :
                         <span className="text-gray-500 text-xs">{horse.no}.</span>}
                     </div>
                  ) : (
                    // Bültende Tahmin Sırası
                    <span className={`text-xs font-mono ${index < 3 ? 'text-white font-bold' : 'text-gray-500'}`}>
                      {index + 1}
                    </span>
                  )}
                </td>

                {/* At İsmi */}
                <td className="px-3 py-2">
                  <div className={`font-bold text-xs ${index === 0 && !isResultView ? 'text-racing-accent' : 'text-gray-200'}`}>
                    {horse.name}
                    {!isResultView && (
                       <span className="text-[9px] font-normal text-gray-500 ml-1">({horse.no})</span>
                    )}
                  </div>
                  {/* Mobilde Jokeyi ismin altına al */}
                  <div className="text-[9px] text-gray-500 sm:hidden block">{horse.jockey}</div>
                </td>

                {/* Jokey (Desktop) */}
                <td className="px-3 py-2 hidden sm:table-cell text-[11px] text-gray-400 truncate max-w-[80px]">
                  {horse.jockey}
                </td>

                {/* Değerler */}
                <td className="px-3 py-2 text-right">
                  {isResultView ? (
                     <div className="flex flex-col items-end">
                        <span className="text-racing-gold font-mono font-bold text-xs">{horse.ganyan} TL</span>
                        <span className="text-[9px] text-gray-500 font-mono">{horse.finish_time}</span>
                     </div>
                  ) : (
                    <div className="flex items-center justify-end gap-1">
                       <div className="h-1.5 w-12 bg-racing-900 rounded-full overflow-hidden hidden sm:block">
                          <div className="h-full bg-racing-accent" style={{ width: `${horse.power_score}%` }}></div>
                       </div>
                       <span className={`font-mono font-bold text-xs ${horse.power_score > 80 ? 'text-racing-accent' : 'text-gray-400'}`}>
                         {horse.power_score}
                       </span>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};