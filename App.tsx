import React, { useState, useCallback, useMemo } from 'react';
import { Layout } from './components/Layout';
import { FilterBar } from './components/FilterBar';
import { RaceCard } from './components/RaceCard';
import { analyzeRaces, getDailyCities } from './services/geminiService';
import { AnalysisState } from './types';
import { AlertTriangle, ExternalLink, Filter } from 'lucide-react';

const App: React.FC = () => {
  // Initialize date to today YYYY-MM-DD
  const todayStr = new Date().toISOString().split('T')[0];
  
  const [date, setDate] = useState<string>(todayStr);
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  
  const [loadingCities, setLoadingCities] = useState<boolean>(false);
  const [selectedRaceId, setSelectedRaceId] = useState<number | 'all'>('all');
  
  const [state, setState] = useState<AnalysisState>({
    loading: false,
    data: null,
    error: null,
  });

  const handleFindCities = useCallback(async () => {
    setLoadingCities(true);
    setAvailableCities([]);
    setSelectedCity(null);
    setState(prev => ({ ...prev, data: null, error: null }));
    
    try {
      const cities = await getDailyCities(date);
      setAvailableCities(cities);
      if (cities.length === 0) {
        setState(prev => ({ ...prev, error: "Bu tarihte kayıtlı bir yarış programı bulunamadı." }));
      }
    } catch (error) {
       setState(prev => ({ ...prev, error: "Şehirler getirilemedi." }));
    } finally {
      setLoadingCities(false);
    }
  }, [date]);

  const handleCitySelect = useCallback(async (city: string) => {
    setSelectedCity(city);
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const data = await analyzeRaces(city, date);
      setState({
        loading: false,
        data,
        error: null
      });
      // Reset race selection on new search
      setSelectedRaceId('all');
    } catch (err: any) {
      setState({
        loading: false,
        data: null,
        error: err.message || "Bilinmeyen bir hata oluştu"
      });
    }
  }, [date]);

  // Filtering Logic
  const filteredRaces = useMemo(() => {
    if (!state.data) return [];

    return state.data.races.filter(race => {
      // Filter by specific race ID if selected
      if (selectedRaceId !== 'all' && race.id !== selectedRaceId) return false;
      return true;
    });
  }, [state.data, selectedRaceId]);

  return (
    <Layout>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-1">Yarış Kontrol Paneli</h2>
        <p className="text-gray-400 text-sm">Canlı veri takibi ve yapay zeka destekli analiz</p>
      </div>

      <FilterBar 
        selectedDate={date}
        onDateChange={setDate}
        onFindCities={handleFindCities}
        availableCities={availableCities}
        selectedCity={selectedCity}
        onCitySelect={handleCitySelect}
        loadingCities={loadingCities}
        loadingAnalysis={state.loading}
      />

      {state.error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-200 p-4 rounded-xl flex items-center gap-3 mb-6">
          <AlertTriangle className="shrink-0" />
          <p>{state.error}</p>
        </div>
      )}

      {!state.data && !state.loading && !state.error && (
        <div className="text-center py-12 opacity-50">
          <div className="bg-racing-800 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-dashed border-racing-600">
            <span className="text-3xl">🏇</span>
          </div>
          <p className="text-md font-medium">Başlamak için tarih seçin ve şehirleri aratın.</p>
        </div>
      )}

      {state.data && (
        <div className="animate-fade-in space-y-8">
          
          {/* Summary Section */}
          <section className="bg-gradient-to-br from-racing-800 to-racing-900 border border-racing-700 p-6 rounded-xl shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-racing-accent/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
               <div>
                  <h3 className="text-lg font-bold text-racing-gold flex items-center gap-2">
                    <span>⚡</span> Günlük Rapor: {state.data.city} ({state.data.date})
                  </h3>
                  <p className="text-gray-300 leading-relaxed text-sm mt-2">
                    {state.data.summary}
                  </p>
               </div>
               
               {/* Quick Race Selector (Specific Race No) */}
               <div className="min-w-[140px]">
                  <label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Koşu Filtrele</label>
                  <div className="relative">
                    <Filter className="absolute left-2 top-2.5 text-gray-400" size={14} />
                    <select 
                      value={selectedRaceId}
                      onChange={(e) => setSelectedRaceId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                      className="w-full bg-racing-950 border border-racing-600 text-white pl-8 pr-2 py-2 text-sm rounded focus:border-racing-accent appearance-none cursor-pointer"
                    >
                      <option value="all">Tüm Koşular</option>
                      {state.data.races.map(r => (
                        <option key={r.id} value={r.id}>{r.id}. Koşu ({r.time})</option>
                      ))}
                    </select>
                  </div>
               </div>
            </div>
          </section>

          {/* Races Grid */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                Koşu Analizleri
              </h3>
              <span className="text-xs bg-racing-700 px-2 py-1 rounded text-gray-300">
                Gösterilen: {filteredRaces.length} / {state.data.races.length}
              </span>
            </div>

            {filteredRaces.length === 0 ? (
               <div className="bg-racing-800/50 p-8 rounded-xl text-center border border-racing-700 border-dashed">
                  <p className="text-gray-400">Bu kriterlere uygun koşu bulunamadı.</p>
               </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRaces.map((race) => (
                  <RaceCard key={race.id} race={race} />
                ))}
              </div>
            )}
          </section>

          {/* Sources Section */}
          {state.data.sources && state.data.sources.length > 0 && (
            <section className="border-t border-racing-700 pt-6">
               <h4 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">Kaynaklar</h4>
               <div className="flex flex-wrap gap-2">
                 {state.data.sources.map((source, idx) => (
                   <a 
                    key={idx}
                    href={source.uri}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-xs bg-racing-800 hover:bg-racing-700 text-racing-accent px-3 py-1.5 rounded-full transition-colors border border-racing-700"
                   >
                     <ExternalLink size={10} />
                     {source.title.length > 30 ? source.title.substring(0, 30) + '...' : source.title}
                   </a>
                 ))}
               </div>
            </section>
          )}

          <div className="text-center text-xs text-gray-600 mt-12 pb-8">
             ⚠️ Bu uygulama sadece eğlence ve bilgi amaçlıdır. Finansal tavsiye niteliği taşımaz. 
             Yapay zeka çıktıları hatalı olabilir. Lütfen TJK resmi sonuçlarını kontrol ediniz.
          </div>
        </div>
      )}
    </Layout>
  );
};

export default App;