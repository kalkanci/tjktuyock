export type Page = 'welcome' | 'bulletin' | 'results' | 'coupon-creator';

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

// --- KUPON ve BAHİS TİPLERİ ---

export type BetType = 
  | '6G' // Altılı Ganyan
  | '5G' // Beşli Ganyan
  | '4G' // Dörtlü Ganyan
  | '3G' // Üçlü Ganyan
  | 'IKILI' // İkili Bahis
  | 'SIRALI' // Sıralı İkili
  | 'CIFTE' // Çifte Bahis
  | 'TABELA'; // Tabela Bahis

export interface CouponLeg {
  raceId: number;
  raceNo: number; // Yarışın resmi numarası
  selectedHorses: number[]; // Seçilen at numaraları
  isBanko: boolean; // Tek at mı?
}

export interface Coupon {
  type: BetType;
  legs: CouponLeg[];
  totalCombinations: number;
  estimatedCost: number; // Tahmini Tutar
  strategy: 'guvenli' | 'surpriz' | 'dengeli';
  raceIndexStart?: number; // Hangi koşudan başlıyor (Ganyanlar için)
  targetRaceId?: number; // Tek koşuluk oyunlar için hedef koşu
}