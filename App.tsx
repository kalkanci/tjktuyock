
import React, { useState, useCallback, useMemo, useRef } from 'react';
import { Layout } from './components/Layout';
import { FilterBar } from './components/FilterBar';
import { RaceCard } from './components/RaceCard';
import { LoadingOverlay, LoadingType } from './components/LoadingOverlay';
import { fetchBasicProgram, analyzeSingleRace, getDailyCities, getRaceResults } from './services/geminiService';
import { AnalysisState, Page } from './types';
import { AlertTriangle, ExternalLink, Filter, RefreshCw, Loader2 } from 'lucide-react';
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
  
  // Background Analysis State
  const [analysisProgress, setAnalysisProgress] = useState<{current: number, total: number} | null>(null);
  const isAnalyzingRef = useRef(false); 
  
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
    setAvailableCities([]);
    setSelectedCity(null);
    setBulletinState({ loading: false, data: null, error: null });
    setResultsState({ loading: false, data: null, error: null });
    setAnalysisProgress(null);
    isAnalyzingRef.current = false;
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
       const errorMsg = error.message || "Şehir listesi alınamadı.";
       if (currentPage === 'bulletin' || currentPage === 'coupon-creator') setBulletinState(prev => ({ ...prev, error: errorMsg }));
       else setResultsState(prev => ({ ...prev, error: errorMsg }));
    } finally {
      setLoadingType(null);
    }
  }, [date, currentPage]);

  // SEQUENTIAL ANALYSIS FUNCTION
  const startSequentialAnalysis = async (programData: any) => {
    if (isAnalyzingRef.current) return;
    isAnalyzingRef.current = true;

    const races = programData.races;
    setAnalysisProgress({ current: 0, total: races.length });

    // Iterate through races one by one
    for (let i = 0; i < races.length; i++) {
        const race = races[i];
        
        // Update UI: Mark this race as analyzing
        setBulletinState(prev => {
            if (!prev.data) return prev;
            const updatedRaces = [...prev.data.races];
            updatedRaces[i] = { ...updatedRaces[i], status: 'analyzing' };
            return { ...prev, data: { ...prev.data, races: updatedRaces } };
        });

        // Perform Analysis with DELAY
        try {
            // Analiz hissi vermek için kısa bir gecikme (Local motor çok hızlı olduğu için)
            if (i > 0) await new Promise(res => setTimeout(res, 500));

            const analyzedRace = await analyzeSingleRace(race, programData.city);
            
            // Update UI: Mark as completed and save data
            setBulletinState(prev => {
                if (!prev.data) return prev;
                const updatedRaces = [...prev.data.races];
                updatedRaces[i] = analyzedRace;
                return { ...prev, data: { ...prev.data, races: updatedRaces } };
            });
        } catch (error) {
            console.error("Race analysis error", error);
            setBulletinState(prev => {
                if (!prev.data) return prev;
                const updatedRaces = [...prev.data.races];
                updatedRaces[i] = { ...updatedRaces[i], status: 'failed' };
                return { ...prev, data: { ...prev.data, races: updatedRaces } };
            });
        }

        setAnalysisProgress({ current: i + 1, total: races.length });
    }

    isAnalyzingRef.current = false;
    setAnalysisProgress(null);
  };

  const handleCitySelect = useCallback(async (city: string) => {
    setSelectedCity(city);
    isAnalyzingRef.current = false; // Reset lock
    
    const isResultsPage = currentPage === 'results';
    
    if (isResultsPage) {
        setResultsState(prev => ({ ...prev, loading: true, error: null }));
        setLoadingType('results');
        try {
            const data = await getRaceResults(city, date);
            setResultsState({ loading: false, data, error: null });
        } catch (err: any) {
            setResultsState({ loading: false, data: null, error: err.message });
        } finally {
            setLoadingType(null);
        }
        return;
    }

    // --- BÜLTEN: AŞAMALI YÜKLEME ---
    setBulletinState(prev => ({ ...prev, loading: true, error: null }));
    setLoadingType('analysis'); 

    try {
      const basicData = await fetchBasicProgram(city, date);
      
      setBulletinState({ loading: false, data: basicData, error: null });
      setLoadingType(null);
      setSelectedRaceId('all');

      startSequentialAnalysis(basicData);
      
    } catch (err: any) {
      setBulletinState({
        loading: false,
        data: null,
        error: err.message || "Program verisi alınamadı."
      });
      setLoadingType(null);
    } 

  }, [date, currentPage]);

  const currentState = currentPage === 'results' ? resultsState : bulletinState;
  
  const filteredRaces = useMemo(() => {
    if (!currentState.data || !Array.isArray(currentState.data.races)) return [];
    
    return currentState.data.races.filter(race => {
      if (selectedRaceId !== 'all' && race.id !== selectedRaceId) return false;
      return true;
    });
  }, [currentState.data, selectedRaceId]);

  const renderContent = () => {
    if (currentPage === 'welcome') {
      return <WelcomeScreen onStart={handleStartApp} />;
    }

    return (
      <>
        <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-2">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">
              {currentPage === 'results' ? 'Simüle Sonuçlar' : 
               currentPage === 'coupon-creator' ? 'Kupon Oluşturucu' : 'Yerel Analiz Motoru'}
            </h2>
            <p className="text-gray-400 text-sm">
              {currentPage === 'results' 
                ? 'Analiz motoruna göre tahmini yarış sonuçları.' 
                : currentPage === 'coupon-creator'
                ? 'İstatistiksel verilere dayalı akıllı kuponlar.'
                : 'Dahili Expert System (Uzman Sistem) ile API bağımsız analiz.'}
            </p>
          </div>
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
          <div className="bg-red-900/20 border border-red-500/30 text-red-200 p-4 rounded-xl flex items-center justify-between gap-3 mb-6 animate-fade-in">
            <div className="flex items-center gap-3">
              <AlertTriangle className="shrink-0 text-red-400" />
              <div>
                <p className="font-bold text-sm">Bir Sorun Oluştu</p>
                <p className="text-xs opacity-80">{currentState.error}</p>
              </div>
            </div>
            {selectedCity && (
              <button 
                onClick={() => handleCitySelect(selectedCity)}
                className="bg-red-800/50 hover:bg-red-800 px-3 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
              >
                <RefreshCw size={12} />
                Tekrar Dene
              </button>
            )}
          </div>
        )}

        {analysisProgress && currentPage === 'bulletin' && (
          <div className="sticky top-20 md:top-4 z-40 mb-4 animate-slide-up">
            <div className="bg-gradient-to-r from-blue-900/90 to-indigo-900/90 border border-blue-500/50 backdrop-blur-md text-white px-4 py-3 rounded-xl shadow-xl flex items-center justify-between">
               <div className="flex items-center gap-3">
                 <div className="relative">
                   <Loader2 size={20} className="animate-spin text-blue-300" />
                   <div className="absolute inset-0 bg-blue-400 blur-lg opacity-30 animate-pulse"></div>
                 </div>
                 <div>
                   <p className="font-bold text-sm">Yerel Analiz Sürüyor</p>
                   <p className="text-[10px] text-blue-200">
                      {analysisProgress.current} / {analysisProgress.total} koşu hesaplanıyor. İstatistikler işleniyor...
                   </p>
                 </div>
               </div>
            </div>
          </div>
        )}

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

        {currentState.data && (
           <div className="animate-fade-in space-y-6 pb-8">
             
             {currentPage === 'coupon-creator' && (
                <CouponCreator 
                   program={bulletinState.data} 
                   onNavigateToBulletin={() => setCurrentPage('bulletin')} 
                />
             )}

             {currentPage !== 'coupon-creator' && (
                <>
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
                  
                  {/* Race Grid */}
                  {filteredRaces.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        {currentState.data.races.length === 0 
                           ? "Bu bülten için detaylı koşu verisi bulunamadı." 
                           : "Seçili koşu bulunamadı."}
                    </div>
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
                      <p className="text-[10px] text-gray-500 mb-2 uppercase font-bold">Veri Kaynakları:</p>
                      <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                        {currentState.data.sources.map((source, idx) => (
                          <a 
                            key={idx}
                            href={source.uri}
                            className="flex items-center gap-1 text-[10px] bg-racing-900 text-gray-400 hover:text-white px-2 py-1 rounded border border-racing-800 transition-colors cursor-default"
                          >
                            <ExternalLink size={8} />
                            {source.title}
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
