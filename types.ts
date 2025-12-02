export interface Horse {
  name: string;
  jockey?: string;
  weight?: string;
  odds?: number; // Ganyan
  isFavorite: boolean;
  score: number; // 0-100 confidence
  reasoning: string;
}

export interface Race {
  id: number;
  time: string;
  name: string;
  distance: string; // e.g., "1400m"
  trackType: 'Kum' | 'Çim' | 'Sentetik';
  horses: Horse[];
  bestPick?: string; // Name of the top horse
}

export interface DailyProgram {
  city: string;
  date: string;
  races: Race[];
  summary: string;
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