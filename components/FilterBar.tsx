
import React from 'react';
import { FilterType } from '../types';

interface FilterBarProps {
  cities: string[];
  selectedCity: string;
  onCitySelect: (city: string) => void;
  selectedType: FilterType;
  onTypeSelect: (type: FilterType) => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({ 
  cities, selectedCity, onCitySelect, selectedType, onTypeSelect 
}) => {
  return (
    <div className="sticky top-16 z-30 bg-[#09090b]/95 backdrop-blur border-b border-gray-800 pb-2">
      {/* City Filters */}
      <div className="flex overflow-x-auto px-4 py-3 gap-2 no-scrollbar">
        <button
          onClick={() => onCitySelect('TÜMÜ')}
          className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
            selectedCity === 'TÜMÜ'
              ? 'bg-white text-black'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          Tümü
        </button>
        {cities.map((city) => (
          <button
            key={city}
            onClick={() => onCitySelect(city)}
            className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
              selectedCity === city
                ? 'bg-green-500 text-black shadow-[0_0_10px_rgba(34,197,94,0.3)]'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {city}
          </button>
        ))}
      </div>

      {/* Type Filters (Banko/Sürpriz) */}
      <div className="px-4 flex gap-4 text-xs font-medium text-gray-500 border-t border-gray-800/50 pt-2 mx-4">
        <button 
          onClick={() => onTypeSelect('TÜMÜ')}
          className={`${selectedType === 'TÜMÜ' ? 'text-white' : ''} hover:text-white transition-colors`}
        >
          Hepsi
        </button>
        <button 
          onClick={() => onTypeSelect('BANKO')}
          className={`${selectedType === 'BANKO' ? 'text-green-400' : ''} hover:text-green-300 transition-colors`}
        >
          Bankolar
        </button>
        <button 
          onClick={() => onTypeSelect('SÜRPRİZ')}
          className={`${selectedType === 'SÜRPRİZ' ? 'text-blue-400' : ''} hover:text-blue-300 transition-colors`}
        >
          Sürprizler
        </button>
      </div>
    </div>
  );
};
