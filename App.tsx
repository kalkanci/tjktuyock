import React, { useState, useCallback, useMemo } from 'react';
import { Layout } from './components/Layout';
import { FilterBar } from './components/FilterBar';
import { RaceCard } from './components/RaceCard';
import { LoadingOverlay, LoadingType } from './components/LoadingOverlay';
import { analyzeRaces, getDailyCities, getRaceResults } from './services/geminiService';
import { AnalysisState, Page } from './types';
import { AlertTriangle, ExternalLink, Filter, Info, ChevronRight } from 'lucide-react';
import { DashboardChart } from './components/DashboardChart';
import { WelcomeScreen } from './components/WelcomeScreen';
import { CouponCreator } from './components/CouponCreator';

const App: React.FC = () => {
  // Navigation State
  const [currentPage, setCurrentPage] = useState<Page>('welcome');
  
  // Common Data State
  const todayStr = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState<string>(todayStr);
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [loadingType, setLoadingType] = useState<LoadingType>(null);
  
  // --- PERSISTENT STATES ---
  const [bulletinState, setBulletinState] = useState<AnalysisState>({
    loading: false, data: null, error: null
  });
  const [resultsState, setResultsState] = useState<AnalysisState>({
    loading: false, data: null, error: null
  });

  const [selectedRaceId, setSelectedRaceId] = useState<number | 'all'>('all');

  // --- HANDLERS ---

  const handleNavigate = (page: Page) => {
    setCurrentPage(page);
    setSelectedRaceId('all');
  };

  const handleStartApp = () => {
    setCurrentPage('bulletin');
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
        const errorMsg = "Bu tarihte kayıtlı bir yarış programı bulunamadı.";
        if (currentPage === 'bulletin' || currentPage === 'coupon-creator') setBulletinState(prev => ({ ...prev, error: errorMsg }));
        else setResultsState(prev => ({ ...prev, error: errorMsg }));
      }
    } catch (error: any) {
       // Hata mesajını servisten gelen detayla göster
       const errorMsg = error.message || "Şehir listesi alınamadı.";
       if (currentPage === 'bulletin' || currentPage === 'coupon-creator') setBulletinState(prev => ({ ...prev, error: errorMsg }));
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
  
  const currentState = currentPage === 'results' ? resultsState : bulletinState;
  
  const filteredRaces = useMemo(() => {
    if (!currentState.data || !Array.isArray(currentState.data.races)) return [];
    
    return currentState.data.races.filter(race => {
      if (selectedRaceId !== 'all' && race.id !== selectedRaceId) return false;
      return true;
    });
  }, [currentState.data, selectedRaceId]);

  // --- RENDER CONTENT ---

  const renderContent = () => {
    if (currentPage === 'welcome') {
      return <WelcomeScreen onStart={handleStartApp} />;
    }

    return (
      <>
        {/* Page Header */}
        <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-2">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">
              {currentPage === 'results' ? 'Yarış Sonuçları' : 
               currentPage === 'coupon-creator' ? 'Kupon Oluşturucu' : 'Günlük Bülten'}
            </h2>
            <p className="text-gray-400 text-sm">
              {currentPage === 'results' 
                ? 'Geçmiş yarışların resmi sonuçlarını ve ganyanlarını görüntüleyin.' 
                : currentPage === 'coupon-creator'
                ? 'Analiz verilerine dayalı akıllı kuponlar oluşturun.'
                : 'Canlı veri taraması ile yapay zeka destekli detaylı analiz.'}
            </p>
          </div>
        </div>

        {/* Common Filter Bar (Always visible for main pages) */}
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

        {/* Error Display */}
        {currentState.error && (
          <div className="bg-red-900/20 border border-red-500/30 text-red-200 p-4 rounded-xl flex items-center gap-3 mb-6 animate-fade-in">
            <AlertTriangle className="shrink-0" />
            <div>
              <p className="font-bold">Bir Hata Oluştu</p>
              <p className="text-sm opacity-80">{currentState.error}</p>
            </div>
          </div>
        )}

        {/* Empty State / Prompt */}
        {!currentState.data && !loadingType && !currentState.error && (
          <div className="text-center py-12 opacity-50">
            <div className="bg-racing-800 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-dashed border-racing-700">
              <span className="text-3xl grayscale">🏁</span>
            </div>
            <p className="text-md font-medium text-gray-400">
              Devam etmek için lütfen yukarıdan Tarih ve Şehir seçiniz.
            </p>
          </div>
        )}

        {/* Main Content Area */}
        {currentState.data && (
           <div className="animate-fade-in space-y-6 pb-8">
             
             {/* 1. COUPON CREATOR VIEW */}
             {currentPage === 'coupon-creator' && (
                <CouponCreator 
                   program={bulletinState.data} 
                   onNavigateToBulletin={() => setCurrentPage('bulletin')} 
                />
             )}

             {/* 2. BULLETIN & RESULTS VIEW */}
             {currentPage !== 'coupon-creator' && (
                <>
                  {/* Summary Box */}
                  <div className="bg-gradient-to-r from-racing-900 to-racing-800 border border-racing-800 p-4 rounded-xl shadow-lg flex flex-col gap-4">
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
                                className="w-full bg-racing-950 border border-racing-700 text-white pl-8 pr-2 py-2 text-xs rounded-lg focus:border-racing-accent appearance-none"
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
                  
                  {/* Analysis Chart (Bulletin only) */}
                  {currentPage === 'bulletin' && selectedRaceId === 'all' && (
                    <div className="bg-racing-900/50 rounded-xl p-4 border border-racing-800">
                        <div className="flex items-center gap-2 mb-2">
                          <Info size={14} className="text-racing-accent" />
                          <span className="text-xs text-gray-400">Günün en yüksek puanlı atları</span>
                        </div>
                        <DashboardChart horses={currentState.data.races?.flatMap(r => r.horses) || []} />
                    </div>
                  )}

                  {/* Race Grid */}
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
                    <div className="border-t border-racing-800 pt-4 mt-6">
                      <p className="text-[10px] text-gray-500 mb-2 uppercase font-bold">İncelenen Kaynaklar:</p>
                      <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                        {currentState.data.sources.map((source, idx) => (
                          <a 
                            key={idx}
                            href={source.uri}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 text-[10px] bg-racing-900 text-gray-400 hover:text-white px-2 py-1 rounded border border-racing-800 transition-colors"
                          >
                            <ExternalLink size={8} />
                            {source.title.length > 25 ? source.title.substring(0, 25) + '...' : source.title}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </>
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