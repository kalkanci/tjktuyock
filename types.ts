export interface Horse {
  no: number;
  name: string;
  jockey?: string;
  weight?: string;
  isFavorite?: boolean; // Kept for backward compat or UI highlighting
  
  // New Engine Fields
  power_score: number; // 0-100
  risk_level: 'düşük' | 'orta' | 'yüksek';
  tempo_style: 'lider/ön grup' | 'orta grup' | 'geriden sprint' | string;
  form_comment: string;
  last_races_summary: string;
  jockey_quality: 'yüksek' | 'orta' | 'düşük';
  weight_effect: 'avantajlı' | 'nötr' | 'dezavantajlı';
  distance_surface_fit: string;
  workout_comment: string;
}

export interface TempoMap {
  front_runners: number[];
  stalkers: number[];
  closers: number[];
}

export interface Race {
  id: number;
  time: string;
  name: string; // "race_type" in new format
  distance: string; // Combined distance + surface for display
  trackType: string;
  
  horses: Horse[];
  
  // New Engine Fields
  power_ranking: number[];
  tempo_map: TempoMap;
  race_summary: string;
  track_surface_comment: string;
  notes: string;
  disclaimer: string;
}

export interface DailyProgram {
  city: string;
  date: string;
  races: Race[];
  summary: string; // General summary for the day
  sources: Array<{ title: string; uri: string }>;
}

export enum CityOption {
  ISTANBUL = 'İstanbul',
  ANKARA = 'Ankara',
  IZMIR = 'İzmir',
  ADANA = 'Adana',
  BURSA = 'Bursa',
  KOCAELI = 'Kocaeli',
  ELAZIG = 'Elazığ',
  DIYARBAKIR = 'Diyarbakır',
  SANLIURFA = 'Şanlıurfa',
  ANTALYA = 'Antalya'
}

export interface AnalysisState {
  loading: boolean;
  data: DailyProgram | null;
  error: string | null;
}