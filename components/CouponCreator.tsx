import React, { useState, useEffect } from 'react';
import { Wand2, Info, Calculator, CheckCircle2, ArrowUp, AlertCircle } from 'lucide-react';
import { DailyProgram, BetType, Coupon } from '../types';
import { generateAdvancedCoupon } from '../services/couponService';

interface CouponCreatorProps {
  program: DailyProgram | null;
  onNavigateToBulletin: () => void;
}

// Sabit veriler bileşen dışına alındı (Performans ve Temizlik)
const BET_TYPES: { id: BetType; label: string; desc: string; multiLeg: boolean }[] = [
  { id: '6G', label: 'Altılı Ganyan', desc: '6 koşunun kazananını bil.', multiLeg: true },
  { id: '5G', label: 'Beşli Ganyan', desc: '5 koşunun kazananını bil.', multiLeg: true },
  { id: '4G', label: 'Dörtlü Ganyan', desc: '4 koşunun kazananını bil.', multiLeg: true },
  { id: '3G', label: 'Üçlü Ganyan', desc: '3 koşunun kazananını bil.', multiLeg: true },
  { id: 'TABELA', label: 'Tabela Bahis', desc: 'İlk 4 atı bil.', multiLeg: false },
  { id: 'SIRALI', label: 'Sıralı İkili', desc: 'İlk 2 atı sırasıyla bil.', multiLeg: false },
  { id: 'IKILI', label: 'İkili Bahis', desc: 'İlk 2 atı sırasız bil.', multiLeg: false },
  { id: 'CIFTE', label: 'Çifte Bahis', desc: 'Ardışık 2 koşuyu bil.', multiLeg: false },
];

export const CouponCreator: React.FC<CouponCreatorProps> = ({ program, onNavigateToBulletin }) => {
  const [selectedBetType, setSelectedBetType] = useState<BetType>('6G');
  const [startRaceIndex, setStartRaceIndex] = useState(0);
  const [targetRaceId, setTargetRaceId] = useState<number>(0);
  const [generatedCoupon, setGeneratedCoupon] = useState<Coupon | null>(null);

  // Program değiştiğinde veya yüklendiğinde varsayılan ayarları yap
  useEffect(() => {
    if (program?.races && program.races.length > 0 && targetRaceId === 0) {
      setTargetRaceId(program.races[0].id);
    }
  }, [program, targetRaceId]);

  const handleGenerate = () => {
    if (!program) return;
    const coupon = generateAdvancedCoupon(program, selectedBetType, startRaceIndex, targetRaceId);
    setGeneratedCoupon(coupon);
  };

  const selectedBetInfo = BET_TYPES.find(b => b.id === selectedBetType);

  // Veri yoksa uyarı göster
  if (!program) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-8 bg-racing-900/50 rounded-2xl border border-dashed border-racing-800 animate-fade-in mt-4">
        <div className="w-16 h-16 bg-racing-800 rounded-full flex items-center justify-center mb-4 border border-racing-700 animate-bounce">
          <ArrowUp size={28} className="text-racing-gold" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Veri Seçimi Gerekli</h3>
        <p className="text-gray-400 mb-6 max-w-sm">
          Kupon oluşturabilmek için önce yukarıdan bir <span className="text-racing-gold font-bold">Şehri Analiz Et</span>melisiniz.
        </p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Ayarlar Paneli */}
        <div className="space-y-6">
            <div className="bg-racing-900 border border-racing-800 p-5 rounded-2xl shadow-lg">
                <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-4 border-b border-racing-800 pb-2">
                    Oyun Türü
                </h3>
                <div className="space-y-2">
                    {BET_TYPES.map((type) => (
                        <button
                            key={type.id}
                            onClick={() => { setSelectedBetType(type.id); setGeneratedCoupon(null); }}
                            className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between group
                                ${selectedBetType === type.id 
                                    ? 'bg-blue-600/10 border-blue-500/50 text-blue-400' 
                                    : 'bg-racing-800/50 border-racing-700/50 text-gray-400 hover:bg-racing-800'
                                }`}
                        >
                            <div>
                                <div className="font-bold text-sm">{type.label}</div>
                                <div className="text-[10px] opacity-70">{type.desc}</div>
                            </div>
                            {selectedBetType === type.id && <CheckCircle2 size={16} />}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-racing-900 border border-racing-800 p-5 rounded-2xl shadow-lg">
                <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-4 border-b border-racing-800 pb-2">
                    Koşu Seçimi
                </h3>
                
                {selectedBetInfo?.multiLeg ? (
                     <div>
                        <label className="block text-xs text-gray-500 mb-2">Başlangıç Ayağı</label>
                        <select 
                            value={startRaceIndex}
                            onChange={(e) => setStartRaceIndex(Number(e.target.value))}
                            className="w-full bg-racing-950 border border-racing-700 text-white rounded-lg p-3 text-sm outline-none focus:border-blue-500"
                        >
                            {program.races.map((race, idx) => (
                                <option key={race.id} value={idx}>{race.id}. Koşu ({race.time})</option>
                            ))}
                        </select>
                     </div>
                ) : (
                    <div>
                        <label className="block text-xs text-gray-500 mb-2">Oynanacak Koşu</label>
                        <select 
                            value={targetRaceId}
                            onChange={(e) => setTargetRaceId(Number(e.target.value))}
                            className="w-full bg-racing-950 border border-racing-700 text-white rounded-lg p-3 text-sm outline-none focus:border-blue-500"
                        >
                             {program.races.map((race) => (
                                <option key={race.id} value={race.id}>{race.id}. Koşu ({race.time})</option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            <button 
                onClick={handleGenerate}
                className="w-full bg-gradient-to-r from-racing-gold to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-racing-950 font-bold py-4 rounded-xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2"
            >
                <Wand2 size={20} />
                Kuponu Hazırla
            </button>
        </div>

        {/* Sonuç Paneli */}
        <div className="lg:col-span-2">
            {!generatedCoupon ? (
                <div className="h-full min-h-[300px] bg-racing-900/30 border-2 border-dashed border-racing-800 rounded-2xl flex flex-col items-center justify-center text-gray-600">
                    <Calculator size={48} className="mb-4 opacity-20" />
                    <p>Seçim yapın ve kupon oluşturun.</p>
                </div>
            ) : (
                <div className="bg-white text-gray-900 rounded-2xl overflow-hidden shadow-2xl animate-slide-up">
                    <div className="bg-racing-900 text-white p-6 border-b-4 border-racing-gold flex justify-between items-center">
                        <div>
                            <h3 className="text-xl font-bold font-mono">{selectedBetInfo?.label}</h3>
                            <p className="text-xs text-gray-400 mt-1">{program.city} • {program.date}</p>
                        </div>
                        <div className="text-right">
                             <div className="text-2xl font-bold text-racing-gold font-mono">
                                {generatedCoupon.estimatedCost.toFixed(2)} ₺
                             </div>
                             <div className="text-[10px] text-gray-500">Tahmini Tutar</div>
                        </div>
                    </div>

                    <div className="p-4 bg-gray-50 space-y-2">
                        {generatedCoupon.legs.map((leg, index) => (
                            <div key={index} className="flex items-center bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                                <div className="w-8 h-8 flex items-center justify-center bg-racing-900 text-white font-bold rounded mr-3 shrink-0 text-xs">
                                    {leg.raceNo}.K
                                </div>
                                <div className="flex-1 flex flex-wrap gap-1.5">
                                    {leg.selectedHorses.map(horse => (
                                        <span key={horse} className={`w-7 h-7 flex items-center justify-center rounded-full font-bold text-xs border ${leg.isBanko ? 'bg-racing-gold text-racing-900 border-racing-gold' : 'bg-white text-gray-700 border-gray-300'}`}>
                                            {horse}
                                        </span>
                                    ))}
                                    {leg.isBanko && <span className="text-[10px] font-bold text-racing-gold bg-black/80 px-1.5 rounded ml-auto self-center">BANKO</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    <div className="bg-gray-100 p-3 border-t border-gray-200 flex items-center gap-2">
                         <AlertCircle className="text-gray-400" size={16} />
                         <p className="text-[10px] text-gray-500">Yapay zeka tahminidir, garanti içermez.</p>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};