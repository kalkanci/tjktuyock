
import React, { useState, useEffect, useMemo } from 'react';
import { runAutonomousAgent } from './services/geminiService';
import { AgentLog, Race, FilterType } from './types';
import { TerminalLog } from './components/TerminalLog';
import { RaceGroup } from './components/RaceGroup';
import { CouponCard } from './components/CouponCard';
import { FilterBar } from './components/FilterBar';
import { Zap, Settings, RefreshCw, AlertTriangle } from 'lucide-react';

const App: React.FC = () => {
  // --- STATE ---
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [races, setRaces] = useState<Race[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedCity, setSelectedCity] = useState<string>(''); 
  const [selectedType, setSelectedType] = useState<FilterType>('TÜMÜ');

  // --- ACTIONS ---

  const handleStartAgent = async () => {
    setIsRunning(true);
    setError(null);
    setLogs([]);
    setRaces([]);

    try {
      // API Key artık servisin içinde process.env'den okunuyor
      const results = await runAutonomousAgent((log) => {
        setLogs(prev => [...prev, log]);
      });
      setRaces(results);
      
      // İlk şehri otomatik seç
      if (results.length > 0) {
        setSelectedCity(results[0].city);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsRunning(false);
    }
  };

  // --- DATA PROCESSING ---

  const availableCities = useMemo(() => {
    const cities = new Set(races.map(r => r.city));
    return Array.from(cities).sort();
  }, [races]);

  useEffect(() => {
    if (!selectedCity && availableCities.length > 0) {
      setSelectedCity(availableCities[0]);
    }
  }, [availableCities, selectedCity]);

  const currentCityRaces = useMemo(() => {
    if (!selectedCity) return [];
    return races.filter(r => r.city === selectedCity);
  }, [races, selectedCity]);

  // KUPON OLUŞTURMA MANTIĞI (DİNAMİK)
  const generatedCoupon = useMemo(() => {
    if (!selectedCity || currentCityRaces.length === 0) return null;

    // Sadece "BİTMEMİŞ" (PENDING veya RUNNING) koşuları al
    const pendingRaces = currentCityRaces.filter(r => r.status !== 'FINISHED').sort((a,b) => a.race_no - b.race_no);
    
    if (pendingRaces.length === 0) return null;

    const couponLegs: number[][] = [];
    const maxLegs = Math.min(6, pendingRaces.length); // 6'lı, 5'li, 4'lü, 3'lü...

    for (let i = 0; i < maxLegs; i++) {
        const race = pendingRaces[i];
        
        // Bu ayakta banko var mı?
        const banko = race.runners.find(r => r.is_banko);
        
        if (banko) {
            couponLegs.push([banko.horse_no]);
        } else {
            // Favori + Plase (Confidence'a göre ilk 3-4 at)
            const sortedRunners = [...race.runners].sort((a,b) => b.confidence - a.confidence);
            // Sürpriz varsa 4 at, yoksa 3 at
            const count = race.runners.some(r => r.is_surprise) ? 4 : 3;
            couponLegs.push(sortedRunners.slice(0, count).map(r => r.horse_no));
        }
    }
    
    // Kupon Türü Adı (Altılı, Beşli vs.)
    const couponName = ["Tekli", "Çifte", "Üçlü", "Dörtlü", "Beşli", "Altılı"][maxLegs - 1] + " Ganyan";
    
    return { legs: couponLegs, name: couponName };
  }, [currentCityRaces]);


  // --- RENDER ---

  return (
    <div className="min-h-screen bg-[#09090b] text-white font-sans max-w-md mx-auto relative shadow-2xl overflow-hidden">
      
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-[#09090b]/90 backdrop-blur border-b border-gray-800 h-16 max-w-md mx-auto px-4 flex items-center justify-between">
        <div>
          <h1 className="font-black text-lg tracking-tight flex items-center gap-1">
            TJK <span className="text-green-500">AI</span>
          </h1>
          <p className="text-[10px] text-gray-500 font-medium">
            {new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex gap-2">
            <button onClick={handleStartAgent} className="p-2 text-green-500 hover:text-green-400">
                <RefreshCw size={20} />
            </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="pt-16 pb-24 min-h-screen">
        
        {isRunning && (
          <div className="fixed inset-0 z-50 bg-[#09090b] pt-20 px-4 flex flex-col">
            <div className="flex-1 flex flex-col justify-center items-center mb-8">
               <div className="w-16 h-16 border-4 border-green-500/20 border-t-green-500 rounded-full animate-spin mb-4"></div>
               <h2 className="text-xl font-bold animate-pulse">Analiz Yapılıyor...</h2>
               <p className="text-sm text-gray-500 mt-2">Geçmiş koşu sonuçları ve anlık tahminler taranıyor.</p>
            </div>
            <div className="mb-8">
               <TerminalLog logs={logs} />
            </div>
          </div>
        )}

        {!isRunning && races.length === 0 && !error && (
           <div className="flex flex-col items-center justify-center h-[70vh] px-8 text-center">
              <div className="w-20 h-20 bg-gray-800/50 rounded-full flex items-center justify-center mb-6">
                <RefreshCw size={32} className="text-gray-500" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Günlük Bülten & Sonuçlar</h2>
              <p className="text-gray-400 mb-6 text-sm">
                 Yapay zeka, koşu saatine göre hem sonuçları analiz eder hem de kalan koşular için kupon oluşturur.
              </p>
              <button 
                onClick={handleStartAgent}
                className="w-full bg-green-500 text-black font-bold text-lg py-4 rounded-2xl shadow-[0_0_20px_rgba(34,197,94,0.4)]"
              >
                Taramayı Başlat
              </button>
           </div>
        )}

        {error && (
          <div className="p-4 m-4 bg-red-900/20 border border-red-900/50 rounded-xl">
             <div className="text-red-400 text-sm mb-2 font-bold flex items-center gap-2">
                <AlertTriangle size={16} /> Hata Oluştu
             </div>
             <div className="text-gray-400 text-xs mb-4">{error}</div>
             <button onClick={handleStartAgent} className="w-full text-xs bg-red-900/50 hover:bg-red-900 px-3 py-2 rounded text-white transition-colors">
               Tekrar Dene
             </button>
          </div>
        )}

        {/* Results */}
        {!isRunning && races.length > 0 && (
          <>
            <FilterBar 
              cities={availableCities}
              selectedCity={selectedCity}
              onCitySelect={setSelectedCity}
              selectedType={selectedType}
              onTypeSelect={setSelectedType}
            />
            
            <div className="px-4 py-4 space-y-6">
              
              {/* Dynamic Coupon Suggestion */}
              {generatedCoupon && (
                 <CouponCard 
                    legs={generatedCoupon.legs} 
                    city={`${selectedCity} - ${generatedCoupon.name}`} 
                 />
              )}

              {/* Race List */}
              <div className="space-y-4">
                  <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest pl-1 mt-6">
                      Bülten Detayı
                  </h3>
                  {currentCityRaces.map((race) => (
                    <RaceGroup key={race.race_no} race={race} />
                  ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default App;
