import React from 'react';
import { Calendar, Search, MapPin } from 'lucide-react';

interface FilterBarProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  onFindCities: () => void;
  availableCities: string[];
  selectedCity: string | null;
  onCitySelect: (city: string) => void;
  loadingCities: boolean;
  loadingAnalysis: boolean;
}

export const FilterBar: React.FC<FilterBarProps> = ({ 
  selectedDate,
  onDateChange,
  onFindCities,
  availableCities,
  selectedCity,
  onCitySelect,
  loadingCities,
  loadingAnalysis
}) => {
  return (
    <div className="bg-racing-800 rounded-xl p-6 shadow-lg border border-racing-700 mb-6 space-y-6">
      
      {/* Step 1: Date Selection & Find Cities */}
      <div className="flex flex-col md:flex-row gap-4 items-end md:items-center">
        <div className="flex-1 w-full">
          <label className="block text-xs text-gray-400 mb-2 uppercase font-bold flex items-center gap-2">
            <Calendar size={14} /> Tarih Seçimi
          </label>
          <div className="flex gap-2">
            <input 
              type="date"
              value={selectedDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="flex-1 bg-racing-900 border border-racing-600 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-racing-accent transition-colors shadow-inner"
            />
            <button
              onClick={onFindCities}
              disabled={loadingCities}
              className={`px-6 py-3 rounded-lg font-bold text-white shadow-lg transition-all flex items-center gap-2
                ${loadingCities 
                  ? 'bg-gray-600 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-500 active:scale-95'}`}
            >
              {loadingCities ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Search size={18} />
              )}
              <span className="hidden md:inline">Şehirleri Bul</span>
            </button>
          </div>
        </div>
      </div>

      {/* Step 2: Available Cities Display */}
      {availableCities.length > 0 && (
        <div className="animate-fade-in border-t border-racing-700 pt-4">
           <label className="block text-xs text-gray-400 mb-3 uppercase font-bold flex items-center gap-2">
            <MapPin size={14} /> Programı Olan Şehirler
          </label>
          <div className="flex flex-wrap gap-3">
            {availableCities.map((city) => (
              <button
                key={city}
                onClick={() => onCitySelect(city)}
                disabled={loadingAnalysis}
                className={`group relative px-6 py-4 rounded-xl border transition-all duration-200 flex flex-col items-center justify-center min-w-[120px]
                  ${selectedCity === city 
                    ? 'bg-racing-accent border-racing-accent text-white shadow-lg shadow-racing-accent/20' 
                    : 'bg-racing-900 border-racing-600 text-gray-300 hover:border-gray-400 hover:bg-racing-800'
                  }
                  ${loadingAnalysis && selectedCity !== city ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                 <span className="text-lg font-bold">{city}</span>
                 {selectedCity === city && loadingAnalysis && (
                   <span className="absolute inset-0 flex items-center justify-center bg-racing-accent rounded-xl">
                      <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                   </span>
                 )}
                 {selectedCity === city && !loadingAnalysis && (
                    <span className="text-[10px] opacity-80 mt-1">Görüntüleniyor</span>
                 )}
                 {selectedCity !== city && (
                    <span className="text-[10px] text-gray-500 group-hover:text-gray-400 mt-1">Analiz Et</span>
                 )}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Empty State hint */}
      {availableCities.length === 0 && !loadingCities && (
        <div className="text-center py-2 text-sm text-gray-500 italic">
          Yarış olan şehirleri görmek için tarih seçip "Şehirleri Bul" butonuna basın.
        </div>
      )}
    </div>
  );
};