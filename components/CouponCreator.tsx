import React, { useState, useMemo } from 'react';
import { Ticket, Wand2, Info, ChevronRight, Calculator, AlertCircle, CheckCircle2, ArrowUp } from 'lucide-react';
import { DailyProgram, BetType, Coupon } from '../types';
import { generateAdvancedCoupon } from '../services/couponService';

interface CouponCreatorProps {
  program: DailyProgram | null;
  onNavigateToBulletin: () => void;
}

export const CouponCreator: React.FC<CouponCreatorProps> = ({ program, onNavigateToBulletin }) => {
  const [selectedBetType, setSelectedBetType] = useState<BetType>('6G');
  const [startRaceIndex, setStartRaceIndex] = useState(0); // For multi-leg
  const [targetRaceId, setTargetRaceId] = useState<number>(0);
  const [generatedCoupon, setGeneratedCoupon] = useState<Coupon | null>(null);

  // Veri geldiğinde varsayılan targetRaceId'yi ayarla
  React.useEffect(() => {
    if (program?.races && program.races.length > 0 && targetRaceId === 0) {
      setTargetRaceId(program.races[0].id);
    }
  }, [program, targetRaceId]);

  // Bahis Tipleri Tanımları
  const betTypes: { id: BetType; label: string; desc: string; multiLeg: boolean }[] = [
    { id: '6G', label: 'Altılı Ganyan', desc: '6 koşunun birincisini tahmin et.', multiLeg: true },
    { id: '5G', label: 'Beşli Ganyan', desc: '5 koşunun birincisini tahmin et.', multiLeg: true },
    { id: '4G', label: 'Dörtlü Ganyan', desc: '4 koşunun birincisini tahmin et.', multiLeg: true },
    { id: '3G', label: 'Üçlü Ganyan', desc: '3 koşunun birincisini tahmin et.', multiLeg: true },
    { id: 'TABELA', label: 'Tabela Bahis', desc: 'İlk 4 atı bil.', multiLeg: false },
    { id: 'SIRALI', label: 'Sıralı İkili', desc: 'İlk 2 atı sırasıyla bil.', multiLeg: false },
    { id: 'IKILI', label: 'İkili Bahis', desc: 'İlk 2 atı sırasız bil.', multiLeg: false },
    { id: 'CIFTE', label: 'Çifte Bahis', desc: 'Peş peşe 2 koşunun birincisini bil.', multiLeg: false },
  ];

  const handleGenerate = () => {
    if (!program) return;
    
    const coupon = generateAdvancedCoupon(
        program, 
        selectedBetType, 
        startRaceIndex, 
        targetRaceId
    );
    
    setGeneratedCoupon(coupon);
  };

  const selectedBetInfo = betTypes.find(b => b.id === selectedBetType);

  // --- PROGRAM SEÇİLMEDİYSE UYARI GÖSTER ---
  if (!program) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-8 bg-racing-900/50 rounded-2xl border border-dashed border-racing-800 animate-fade-in mt-4">
        <div className="w-16 h-16 bg-racing-800 rounded-full flex items-center justify-center mb-4 border border-racing-700 animate-bounce">
          <ArrowUp size={28} className="text-racing-gold" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Veri Seçimi Gerekli</h3>
        <p className="text-gray-400 mb-6 max-w-sm">
          Kupon oluşturabilmek için önce yukarıdaki panelden <span className="text-racing-gold font-bold">Tarih</span> seçip <span className="text-blue-400 font-bold">Şehri Analiz Et</span> butonuna basınız.
        </p>
        <div className="text-xs text-gray-500 bg-racing-950 p-3 rounded-lg border border-racing-800">
          <Info size={14} className="inline mr-1 mb-0.5" />
          Yapay zeka önce o günün koşularını analiz etmeli, ardından size özel kuponu üretebilir.
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Settings */}
        <div className="space-y-6">
            
            {/* 1. Oyun Türü Seçimi */}
            <div className="bg-racing-900 border border-racing-800 p-5 rounded-2xl shadow-lg">
                <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-4 border-b border-racing-800 pb-2">
                    1. Oyun Türü Seç
                </h3>
                <div className="space-y-2">
                    {betTypes.map((type) => (
                        <button
                            key={type.id}
                            onClick={() => {
                                setSelectedBetType(type.id);
                                setGeneratedCoupon(null);
                            }}
                            className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between group
                                ${selectedBetType === type.id 
                                    ? 'bg-blue-600/10 border-blue-500/50 text-blue-400' 
                                    : 'bg-racing-800/50 border-racing-700/50 text-gray-400 hover:bg-racing-800 hover:border-racing-600'
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

            {/* 2. Koşu Seçimi */}
            <div className="bg-racing-900 border border-racing-800 p-5 rounded-2xl shadow-lg">
                <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-4 border-b border-racing-800 pb-2">
                    2. Hedef Koşu
                </h3>
                
                {selectedBetInfo?.multiLeg ? (
                    // Çok ayaklı oyunlar için başlangıç koşusu
                     <div>
                        <label className="block text-xs text-gray-500 mb-2">Başlangıç Ayağı</label>
                        <select 
                            value={startRaceIndex}
                            onChange={(e) => setStartRaceIndex(Number(e.target.value))}
                            className="w-full bg-racing-950 border border-racing-700 text-white rounded-lg p-3 text-sm focus:border-blue-500 outline-none"
                        >
                            {program.races.map((race, idx) => (
                                <option key={race.id} value={idx}>
                                    {race.id}. Koşu ({race.time})
                                </option>
                            ))}
                        </select>
                        <p className="text-[10px] text-gray-500 mt-2 flex items-start gap-1">
                            <Info size={12} className="mt-0.5 shrink-0" />
                            {selectedBetInfo.label} bu koşudan itibaren {selectedBetInfo.id === '6G' ? 6 : parseInt(selectedBetInfo.id)} koşu sürecektir.
                        </p>
                     </div>
                ) : (
                    // Tek ayaklı oyunlar için tek koşu
                    <div>
                        <label className="block text-xs text-gray-500 mb-2">Oynanacak Koşu</label>
                        <select 
                            value={targetRaceId}
                            onChange={(e) => setTargetRaceId(Number(e.target.value))}
                            className="w-full bg-racing-950 border border-racing-700 text-white rounded-lg p-3 text-sm focus:border-blue-500 outline-none"
                        >
                             {program.races.map((race) => (
                                <option key={race.id} value={race.id}>
                                    {race.id}. Koşu ({race.time}) - {race.name}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {/* Generate Button */}
            <button 
                onClick={handleGenerate}
                className="w-full bg-gradient-to-r from-racing-gold to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-racing-950 font-bold py-4 rounded-xl shadow-lg shadow-yellow-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
                <Wand2 size={20} />
                AI Kuponu Hazırla
            </button>
        </div>

        {/* Right Column: Result */}
        <div className="lg:col-span-2">
            {!generatedCoupon ? (
                <div className="h-full min-h-[300px] bg-racing-900/30 border-2 border-dashed border-racing-800 rounded-2xl flex flex-col items-center justify-center text-gray-600">
                    <Calculator size={48} className="mb-4 opacity-20" />
                    <p>Soldaki menüden seçim yapın ve kuponu oluşturun.</p>
                </div>
            ) : (
                <div className="bg-white text-gray-900 rounded-2xl overflow-hidden shadow-2xl animate-slide-up">
                    {/* Ticket Header */}
                    <div className="bg-racing-900 text-white p-6 border-b-4 border-racing-gold flex justify-between items-start">
                        <div>
                            <h3 className="text-2xl font-bold font-mono tracking-tighter">{selectedBetInfo?.label}</h3>
                            <p className="text-sm text-gray-400 mt-1 uppercase tracking-widest">{program.city} • {program.date}</p>
                        </div>
                        <div className="text-right">
                             <div className="text-3xl font-bold text-racing-gold font-mono">
                                {generatedCoupon.estimatedCost.toFixed(2)} ₺
                             </div>
                             <div className="text-xs text-gray-500">Tahmini Tutar</div>
                        </div>
                    </div>

                    {/* Ticket Legs */}
                    <div className="p-6 bg-gray-50">
                        <div className="space-y-3">
                            {generatedCoupon.legs.map((leg, index) => (
                                <div key={index} className="flex items-center bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                                    <div className="w-12 h-12 flex items-center justify-center bg-racing-900 text-white font-bold rounded-lg mr-4 shrink-0">
                                        {leg.raceNo}.K
                                    </div>
                                    
                                    <div className="flex-1">
                                        <div className="flex flex-wrap gap-2">
                                            {leg.selectedHorses.map(horse => (
                                                <span 
                                                    key={horse}
                                                    className={`w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm border-2
                                                        ${leg.isBanko 
                                                            ? 'bg-racing-gold border-racing-gold text-racing-900' 
                                                            : 'bg-white border-gray-300 text-gray-700'}`}
                                                >
                                                    {horse}
                                                </span>
                                            ))}
                                            {leg.isBanko && <span className="ml-2 px-2 py-1 bg-racing-gold/20 text-racing-900 text-[10px] font-bold uppercase rounded self-center">Banko</span>}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Footer Warning */}
                    <div className="bg-gray-100 p-4 border-t border-gray-200 flex items-start gap-3">
                         <AlertCircle className="text-gray-400 shrink-0" size={18} />
                         <p className="text-xs text-gray-500 leading-relaxed">
                            Bu kupon yapay zeka analizlerine dayalı bir tahmindir. TJK bayisinden oynarken kuponunuzu kontrol ediniz. Bol şanslar!
                         </p>
                    </div>
                </div>
            )}
        </div>

      </div>
    </div>
  );
};