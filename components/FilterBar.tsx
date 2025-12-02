import React from 'react';
import { MapPin } from 'lucide-react';
import { CityOption } from '../types';

interface FilterBarProps {
  selectedCity: string;
  onCityChange: (city: string) => void;
  onAnalyze: () => void;
  loading: boolean;
}

export const FilterBar: React.FC<FilterBarProps> = ({ selectedCity, onCityChange, onAnalyze, loading }) => {
  return (
    <div className="bg-racing-800 rounded-xl p-4 shadow-lg border border-racing-700 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
      
      <div className="flex items-center gap-3 w-full md:w-auto">
        <div className="p-2 bg-racing-700 rounded-lg text-racing-gold">
          <MapPin size={24} />
        </div>
        <div className="flex-1">
          <label className="block text-xs text-gray-400 mb-1">Şehir Seçimi</label>
          <select 
            value={selectedCity}
            onChange={(e) => onCityChange(e.target.value)}
            className="w-full md:w-48 bg-racing-900 border border-racing-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-racing-accent transition-colors appearance-none cursor-pointer"
          >
            {Object.values(CityOption).map((city) => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </div>
      </div>

      <button
        onClick={onAnalyze}
        disabled={loading}
        className={`w-full md:w-auto px-8 py-3 rounded-lg font-bold text-white shadow-lg transition-all transform active:scale-95 flex items-center justify-center gap-2
          ${loading 
            ? 'bg-gray-600 cursor-not-allowed opacity-75' 
            : 'bg-gradient-to-r from-racing-accent to-emerald-600 hover:from-emerald-400 hover:to-emerald-700 hover:shadow-emerald-500/20'
          }`}
      >
        {loading ? (
          <>
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Analiz Yapılıyor...</span>
          </>
        ) : (
          <>
            <span>Analizi Başlat</span>
          </>
        )}
      </button>
    </div>
  );
};