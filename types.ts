export type Page = 'bulletin' | 'results' | 'settings';

export interface Horse {
  no: number;
  name: string;
  jockey?: string;
  weight?: string; // Kilo
  
  // Analiz Alanları
  power_score: number; // 0-100 arası güç puanı
  risk_level?: 'düşük' | 'orta' | 'yüksek';
  
  // Sonuç Alanları
  finish_time?: string; // Derece
  ganyan?: string; // Ganyan
  difference?: string; // Fark (Boy)
}

export interface Race {
  id: number;
  time: string;
  name: string;
  distance: string;
  trackType: string; // Çim/Kum
  
  horses: Horse[];
  
  race_summary?: string; // Koşu yorumu
}

export interface DailyProgram {
  city: string;
  date: string;
  races: Race[];
  summary: string;
  sources: Array<{ title: string; uri: string }>;
}

export interface AnalysisState {
  loading: boolean;
  data: DailyProgram | null;
  error: string | null;
}

// Basit ayarlar
export interface AppSettings {
  showGanyan: boolean;
  compactMode: boolean;
}