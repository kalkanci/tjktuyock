import React, { useState, useCallback } from 'react';
import { Layout } from './components/Layout';
import { FilterBar } from './components/FilterBar';
import { RaceCard } from './components/RaceCard';
import { analyzeRaces } from './services/geminiService';
import { AnalysisState, CityOption } from './types';
import { AlertTriangle, ExternalLink } from 'lucide-react';

const App: React.FC = () => {
  const [city, setCity] = useState<string>(CityOption.ISTANBUL);
  const [state, setState] = useState<AnalysisState>({
    loading: false,
    data: null,
    error: null,
  });

  const handleAnalyze = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const data = await analyzeRaces(city);
      setState({
        loading: false,
        data,
        error: null
      });
    } catch (err: any) {
      setState({
        loading: false,
        data: null,
        error: err.message || "Bilinmeyen bir hata oluştu"
      });
    }
  }, [city]);

  return (
    <Layout>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-1">Yarış Kontrol Paneli</h2>
        <p className="text-gray-400 text-sm">Yapay zeka destekli analiz ve tahminler</p>
      </div>

      <FilterBar 
        selectedCity={city}
        onCityChange={setCity}
        onAnalyze={handleAnalyze}
        loading={state.loading}
      />

      {state.error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-200 p-4 rounded-xl flex items-center gap-3 mb-6">
          <AlertTriangle className="shrink-0" />
          <p>{state.error}</p>
        </div>
      )}

      {!state.data && !state.loading && !state.error && (
        <div className="text-center py-20 opacity-50">
          <div className="bg-racing-800 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-dashed border-racing-600">
            <span className="text-4xl">🏇</span>
          </div>
          <p className="text-lg font-medium">Başlamak için bir şehir seçin ve "Analizi Başlat" butonuna tıklayın.</p>
          <p className="text-sm mt-2">Gemini AI güncel bülteni tarayarak size özel tüyolar hazırlayacak.</p>
        </div>
      )}

      {state.data && (
        <div className="animate-fade-in space-y-8">
          
          {/* Summary Section */}
          <section className="bg-gradient-to-br from-racing-800 to-racing-900 border border-racing-700 p-6 rounded-xl shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-racing-accent/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
            <h3 className="text-lg font-bold text-racing-gold mb-2 flex items-center gap-2">
              <span>⚡</span> Günlük Rapor: {state.data.city} ({state.data.date})
            </h3>
            <p className="text-gray-300 leading-relaxed text-sm md:text-base">
              {state.data.summary}
            </p>
          </section>

          {/* Races Grid */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Koşu Analizleri</h3>
              <span className="text-xs bg-racing-700 px-2 py-1 rounded text-gray-300">
                {state.data.races.length} Koşu
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {state.data.races.map((race) => (
                <RaceCard key={race.id} race={race} />
              ))}
            </div>
          </section>

          {/* Sources Section (Grounding) */}
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