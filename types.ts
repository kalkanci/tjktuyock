
export type RaceStatus = 'PENDING' | 'RUNNING' | 'FINISHED';

export interface BetSuggestion {
  type: 'GANYAN' | 'İKİLİ' | 'SIRALI İKİLİ' | 'ÇİFTE' | 'PLASE' | 'ÜÇLÜ BAHİS';
  combination: string; // Örn: "1/2", "5 Tek"
  confidence: number;
}

export interface Runner {
  horse_no: number;
  horse_name: string;
  is_banko: boolean;
  is_surprise: boolean;
  confidence: number;
  reason: string;
}

export interface Race {
  city: string;
  race_no: number;
  time: string; // "14:30"
  status: RaceStatus;
  runners: Runner[];
  
  // Sonuç Verileri
  actual_winner_no?: number; // Eğer bittiyse kazanan at no
  result_summary?: string; // "1 numaralı at kazandı, favori geldi."
  success_rate?: 'HIT' | 'MISS' | 'CLOSE'; // Tahmin tuttu mu?
  
  // Bahis Önerileri
  bets: BetSuggestion[];
  
  // Grounding
  sources?: string[];
}

export interface Prediction {
  race_no: number;
  city: string;
  horse_name: string;
  type: string;
  confidence: number;
  reason: string;
  sources: string[];
}

export interface AgentLog {
  id: number;
  message: string;
  timestamp: string;
  type: 'info' | 'success' | 'warning';
}

export type FilterType = 'TÜMÜ' | 'BANKO' | 'SÜRPRİZ';
