import React, { useState, useCallback, useMemo } from 'react';
import { Layout } from './components/Layout';
import { FilterBar } from './components/FilterBar';
import { RaceCard } from './components/RaceCard';
import { analyzeRaces, getDailyCities, getRaceResults } from './services/geminiService';
import { AnalysisState, Page, AppSettings } from './types';
import { AlertTriangle, ExternalLink, Filter, Save } from 'lucide-react';

const App: React.FC = () => {
  // Navigation State
  const [currentPage, setCurrentPage] = useState<Page>('bulletin');
  
  // Data State
  const todayStr = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState<string>(todayStr);
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  
  // Loading States
  const [loadingCities, setLoadingCities] = useState<boolean>(false);
  const [selectedRaceId, setSelectedRaceId] = useState<number | 'all'>('all');
  
  // Content State
  const [state, setState] = useState<AnalysisState>({
    loading: false,
    data: null,
    error: null,
  });

  // Settings State
  const [settings, setSettings] = useState<AppSettings>({
    showGanyan: true,
    compactMode: false
  });

  // Handlers
  const handleNavigate = (page: Page) => {
    setCurrentPage(page);
    // Reset data when switching main context, keep date
    setState({ loading: false, data: null, error: null });
    setAvailableCities([]);
    setSelectedCity(null);
  };

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
       setState(prev => ({ ...prev, error: "Şehir listesi alınamadı." }));
    } finally {
      setLoadingCities(false);
    }
  }, [date]);

  const handleCitySelect = useCallback(async (city: string) => {
    setSelectedCity(city);
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      let data;
      if (currentPage === 'results') {
        data = await getRaceResults(city, date);
      } else {
        data = await analyzeRaces(city, date);
      }
      
      setState({ loading: false, data, error: null });
      setSelectedRaceId('all');
    } catch (err: any) {
      setState({
        loading: false,
        data: null,
        error: err.message || "Veri alınamadı."
      });
    }
  }, [date, currentPage]);

  const filteredRaces = useMemo(() => {
    if (!state.data) return [];
    return state.data.races.filter(race => {
      if (selectedRaceId !== 'all' && race.id !== selectedRaceId) return false;
      return true;
    });
  }, [state.data, selectedRaceId]);

  // --- RENDER CONTENT BASED ON PAGE ---

  const renderContent = () => {
    if (currentPage === 'settings') {
      return (
        <div className="max-w-2xl mx-auto bg-racing-800 rounded-xl p-6 border border-racing-700">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Save size={20} className="text-racing-accent" />
            Uygulama Ayarları
          </h2>
          
          <div className="space-y-6">
             <div className="flex items-center justify-between p-4 bg-racing-900 rounded-lg">
                <div>
                  <h4 className="font-medium text-white">Ganyanları Göster</h4>
                  <p className="text-xs text-gray-500">Sonuç ekranında ganyan bilgilerini göster.</p>
                </div>
                <button 
                  onClick={() => setSettings(s => ({...s, showGanyan: !s.showGanyan}))}
                  className={`w-12 h-6 rounded-full transition-colors relative ${settings.showGanyan ? 'bg-racing-accent' : 'bg-racing-700'}`}
                >
                  <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${settings.showGanyan ? 'translate-x-6' : ''}`} />
                </button>
             </div>

             <div className="flex items-center justify-between p-4 bg-racing-900 rounded-lg">
                <div>
                  <h4 className="font-medium text-white">Kompakt Görünüm</h4>
                  <p className="text-xs text-gray-500">Tabloları daha sıkışık göster.</p>
                </div>
                <button 
                  onClick={() => setSettings(s => ({...s, compactMode: !s.compactMode}))}
                  className={`w-12 h-6 rounded-full transition-colors relative ${settings.compactMode ? 'bg-racing-accent' : 'bg-racing-700'}`}
                >
                  <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${settings.compactMode ? 'translate-x-6' : ''}`} />
                </button>
             </div>
          </div>
          
          <div className="mt-8 text-center text-xs text-gray-500">
             Versiyon 1.2.0
          </div>
        </div>
      );
    }

    return (
      <>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-1">
            {currentPage === 'results' ? 'Yarış Sonuçları' : 'Günlük Bülten'}
          </h2>
          <p className="text-gray-400 text-sm">
            {currentPage === 'results' 
              ? 'Geçmiş yarışların resmi sonuçlarını ve ganyanlarını görüntüleyin.' 
              : 'Yapay zeka destekli analizler ve güç puanları.'}
          </p>
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
          <div className="bg-red-500/10 border border-red-500/50 text-red-200 p-4 rounded-xl flex items-center gap-3 mb-6 animate-fade-in">
            <AlertTriangle className="shrink-0" />
            <p>{state.error}</p>
          </div>
        )}

        {!state.data && !state.loading && !state.error && (
          <div className="text-center py-12 opacity-50">
            <div className="bg-racing-800 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-dashed border-racing-600">
              <span className="text-3xl">🏁</span>
            </div>
            <p className="text-md font-medium">Tarih ve Şehir seçerek {currentPage === 'results' ? 'sonuçları' : 'bülteni'} getirin.</p>
          </div>
        )}

        {state.data && (
          <div className="animate-fade-in space-y-6">
            
            {/* Summary Box */}
            <div className="bg-gradient-to-r from-racing-800 to-racing-900 border border-racing-700 p-4 rounded-xl shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
               <div>
                  <h3 className="text-sm font-bold text-racing-gold uppercase tracking-wider mb-1">
                    {state.data.city} - {state.data.date}
                  </h3>
                  <p className="text-gray-300 text-sm">
                    {state.data.summary}
                  </p>
               </div>
               
               {/* Quick Filter */}
               <div className="min-w-[150px] w-full md:w-auto">
                  <div className="relative">
                    <Filter className="absolute left-2 top-2.5 text-gray-400" size={14} />
                    <select 
                      value={selectedRaceId}
                      onChange={(e) => setSelectedRaceId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                      className="w-full bg-racing-950 border border-racing-600 text-white pl-8 pr-2 py-2 text-xs rounded-lg focus:border-racing-accent appearance-none"
                    >
                      <option value="all">Tüm Program</option>
                      {state.data.races.map(r => (
                        <option key={r.id} value={r.id}>{r.id}. Koşu ({r.time})</option>
                      ))}
                    </select>
                  </div>
               </div>
            </div>

            {/* Grid */}
            {filteredRaces.length === 0 ? (
               <div className="text-center py-8 text-gray-500">Seçili koşu bulunamadı.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                {filteredRaces.map((race) => (
                  <RaceCard 
                    key={race.id} 
                    race={race} 
                    isResultView={currentPage === 'results'} 
                  />
                ))}
              </div>
            )}

            {/* Sources Footer */}
            {state.data.sources && state.data.sources.length > 0 && (
              <div className="border-t border-racing-700 pt-4 mt-6">
                 <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                   {state.data.sources.map((source, idx) => (
                     <a 
                      key={idx}
                      href={source.uri}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 text-[10px] bg-racing-800 text-gray-400 hover:text-white px-2 py-1 rounded border border-racing-700 transition-colors"
                     >
                       <ExternalLink size={8} />
                       {source.title.substring(0, 20)}...
                     </a>
                   ))}
                 </div>
              </div>
            )}
          </div>
        )}
      </>
    );
  };

  return (
    <Layout currentPage={currentPage} onNavigate={handleNavigate}>
      {renderContent()}
    </Layout>
  );
};

export default App;