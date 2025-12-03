import React, { useState, useCallback, useMemo } from 'react';
import { Layout } from './components/Layout';
import { FilterBar } from './components/FilterBar';
import { RaceCard } from './components/RaceCard';
import { LoadingOverlay, LoadingType } from './components/LoadingOverlay';
import { analyzeRaces, getDailyCities, getRaceResults } from './services/geminiService';
import { AnalysisState, Page, AppSettings } from './types';
import { AlertTriangle, ExternalLink, Filter, Save, Info } from 'lucide-react';
import { DashboardChart } from './components/DashboardChart';

const App: React.FC = () => {
  // Navigation State
  const [currentPage, setCurrentPage] = useState<Page>('bulletin');
  
  // Common Data State
  const todayStr = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState<string>(todayStr);
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [loadingType, setLoadingType] = useState<LoadingType>(null);
  
  // --- PERSISTENT STATES ---
  // Bülten ve Sonuçlar için ayrı hafıza tutuyoruz
  const [bulletinState, setBulletinState] = useState<AnalysisState>({
    loading: false, data: null, error: null
  });
  const [resultsState, setResultsState] = useState<AnalysisState>({
    loading: false, data: null, error: null
  });

  const [selectedRaceId, setSelectedRaceId] = useState<number | 'all'>('all');
  
  // Settings State
  const [settings, setSettings] = useState<AppSettings>({
    showGanyan: true,
    compactMode: false
  });

  // --- HANDLERS ---

  // Sayfa değişiminde veriyi sıfırlama, sadece görünümü değiştir
  const handleNavigate = (page: Page) => {
    setCurrentPage(page);
    setSelectedRaceId('all');
    // Not: Verileri burada temizlemiyoruz, böylece geri gelince kalıyor.
  };

  const handleDateChange = (newDate: string) => {
    setDate(newDate);
    // Tarih değişince her şeyi sıfırla
    setAvailableCities([]);
    setSelectedCity(null);
    setBulletinState({ loading: false, data: null, error: null });
    setResultsState({ loading: false, data: null, error: null });
  };

  const handleFindCities = useCallback(async () => {
    setLoadingType('cities');
    setAvailableCities([]);
    setSelectedCity(null);
    setBulletinState(prev => ({ ...prev, error: null }));
    setResultsState(prev => ({ ...prev, error: null }));
    
    try {
      const cities = await getDailyCities(date);
      setAvailableCities(cities);
      if (cities.length === 0) {
        // Hata mesajını aktif sayfaya yaz
        const errorMsg = "Bu tarihte kayıtlı bir yarış programı bulunamadı.";
        if (currentPage === 'bulletin') setBulletinState(prev => ({ ...prev, error: errorMsg }));
        else setResultsState(prev => ({ ...prev, error: errorMsg }));
      }
    } catch (error) {
       const errorMsg = "Şehir listesi alınamadı.";
       if (currentPage === 'bulletin') setBulletinState(prev => ({ ...prev, error: errorMsg }));
       else setResultsState(prev => ({ ...prev, error: errorMsg }));
    } finally {
      setLoadingType(null);
    }
  }, [date, currentPage]);

  const handleCitySelect = useCallback(async (city: string) => {
    setSelectedCity(city);
    
    const isResultsPage = currentPage === 'results';
    const activeSetState = isResultsPage ? setResultsState : setBulletinState;
    const currentState = isResultsPage ? resultsState : bulletinState;

    // Eğer o şehir için veri zaten hafızada varsa tekrar çekme (Cache mantığı)
    if (currentState.data && currentState.data.city === city && currentState.data.date === date) {
      return;
    }

    setLoadingType(isResultsPage ? 'results' : 'analysis');
    activeSetState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      let data;
      if (isResultsPage) {
        data = await getRaceResults(city, date);
      } else {
        data = await analyzeRaces(city, date);
      }
      
      activeSetState({ loading: false, data, error: null });
      setSelectedRaceId('all');
    } catch (err: any) {
      activeSetState({
        loading: false,
        data: null,
        error: err.message || "Veri alınamadı."
      });
    } finally {
      setLoadingType(null);
    }
  }, [date, currentPage, bulletinState.data, resultsState.data]);

  // --- DERIVED STATE ---
  
  // Aktif sayfaya göre hangi veriyi göstereceğiz?
  const currentState = currentPage === 'results' ? resultsState : bulletinState;
  
  const filteredRaces = useMemo(() => {
    // GÜVENLİK KONTROLÜ: data veya races undefined ise boş dizi dön
    if (!currentState.data || !Array.isArray(currentState.data.races)) return [];
    
    return currentState.data.races.filter(race => {
      if (selectedRaceId !== 'all' && race.id !== selectedRaceId) return false;
      return true;
    });
  }, [currentState.data, selectedRaceId]);

  // --- RENDER CONTENT ---

  const renderContent = () => {
    if (currentPage === 'settings') {
      return (
        <div className="max-w-2xl mx-auto bg-racing-800 rounded-xl p-6 border border-racing-700 animate-fade-in">
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
             Versiyon 1.4.1 (Stable)
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
              : 'Canlı veri taraması ile yapay zeka destekli detaylı analiz.'}
          </p>
        </div>

        <FilterBar 
          selectedDate={date}
          onDateChange={handleDateChange}
          onFindCities={handleFindCities}
          availableCities={availableCities}
          selectedCity={selectedCity}
          onCitySelect={handleCitySelect}
          loadingCities={loadingType === 'cities'}
          loadingAnalysis={!!loadingType}
        />

        {currentState.error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-200 p-4 rounded-xl flex items-center gap-3 mb-6 animate-fade-in">
            <AlertTriangle className="shrink-0" />
            <p>{currentState.error}</p>
          </div>
        )}

        {!currentState.data && !loadingType && !currentState.error && (
          <div className="text-center py-12 opacity-50">
            <div className="bg-racing-800 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-dashed border-racing-600">
              <span className="text-3xl">🏁</span>
            </div>
            <p className="text-md font-medium">Tarih ve Şehir seçerek {currentPage === 'results' ? 'sonuçları' : 'bülteni'} getirin.</p>
          </div>
        )}

        {currentState.data && (
          <div className="animate-fade-in space-y-6">
            
            {/* Summary Box */}
            <div className="bg-gradient-to-r from-racing-800 to-racing-900 border border-racing-700 p-4 rounded-xl shadow-lg flex flex-col gap-4">
               <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                      <h3 className="text-sm font-bold text-racing-gold uppercase tracking-wider mb-1">
                        {currentState.data.city} - {currentState.data.date}
                      </h3>
                      <p className="text-gray-300 text-sm leading-relaxed">
                        {currentState.data.summary}
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
                          {currentState.data.races?.map(r => (
                            <option key={r.id} value={r.id}>{r.id}. Koşu ({r.time})</option>
                          ))}
                        </select>
                      </div>
                  </div>
               </div>
            </div>
            
            {/* Analiz Grafiği (Sadece bültende ve tümü seçiliyken göster) */}
            {currentPage === 'bulletin' && selectedRaceId === 'all' && (
               <div className="bg-racing-800 rounded-xl p-4 border border-racing-700">
                  <div className="flex items-center gap-2 mb-2">
                     <Info size={14} className="text-racing-accent" />
                     <span className="text-xs text-gray-400">Günün en yüksek puanlı atları</span>
                  </div>
                  {/* Tüm yarışlardaki atları birleştirip grafiğe gönder */}
                  <DashboardChart horses={currentState.data.races?.flatMap(r => r.horses) || []} />
               </div>
            )}

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
            {currentState.data.sources && currentState.data.sources.length > 0 && (
              <div className="border-t border-racing-700 pt-4 mt-6">
                 <p className="text-[10px] text-gray-500 mb-2 uppercase font-bold">İncelenen Kaynaklar:</p>
                 <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                   {currentState.data.sources.map((source, idx) => (
                     <a 
                      key={idx}
                      href={source.uri}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 text-[10px] bg-racing-800 text-gray-400 hover:text-white px-2 py-1 rounded border border-racing-700 transition-colors"
                     >
                       <ExternalLink size={8} />
                       {source.title.length > 25 ? source.title.substring(0, 25) + '...' : source.title}
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
      <LoadingOverlay type={loadingType} />
      {renderContent()}
    </Layout>
  );
};

export default App;
