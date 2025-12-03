import { GoogleGenAI } from "@google/genai";
import { DailyProgram } from "../types";

// --- GÜVENLİ API KEY YÖNETİMİ ---
const getSafeApiKey = (): string => {
  let key = '';

  // 1. Vite / Modern Tarayıcı Kontrolü (import.meta)
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      // @ts-ignore
      // Vite ortamlarında VITE_API_KEY önceliklidir
      key = import.meta.env.VITE_API_KEY || import.meta.env.API_KEY || '';
    }
  } catch (e) {
    // import.meta erişimi başarısız olursa sessizce geç
  }

  // 2. Process Env Kontrolü (Fallback)
  if (!key) {
    try {
      // Doğrudan process erişimi yerine window.process veya global process kontrolü
      const p = (typeof process !== 'undefined') ? process : 
                (typeof window !== 'undefined' && (window as any).process) ? (window as any).process : 
                {};
      
      const env = p.env || {};
      
      key = env.VITE_API_KEY ||
            env.API_KEY || 
            env.REACT_APP_API_KEY || 
            env.NEXT_PUBLIC_API_KEY || 
            '';
    } catch (e) {
      // process erişimi hatası
    }
  }
  
  // Debug için (Key'in kendisini gizle, sadece varlığını yaz)
  if (key) {
    console.log("API Key loaded successfully from environment.");
  } else {
    console.warn("API Key could not be found in VITE_API_KEY or API_KEY.");
  }

  return key;
};

// API Key kontrolü için helper
export const hasValidApiKey = (): boolean => {
  const key = getSafeApiKey();
  return !!key && key.length > 0 && key !== 'missing_api_key';
};

// Lazy initialization
let aiInstance: GoogleGenAI | null = null;

const getAI = () => {
  if (!aiInstance) {
    const apiKey = getSafeApiKey();
    // Boş key ile başlatırsak istek anında hata döner, app çökmez.
    aiInstance = new GoogleGenAI({ apiKey: apiKey || 'missing_api_key' });
  }
  return aiInstance;
};

const modelId = "gemini-2.5-flash";

const COMMON_CONFIG = {
  temperature: 0.3,
  topK: 40,
  topP: 0.95,
};

const cleanJsonString = (str: string) => {
  if (!str) return "{}";
  // Regex kullanarak tüm markdown bloklarını temizle (Global flag 'g' önemli)
  const cleaned = str.replace(/```json/g, "").replace(/```/g, "").trim();
  
  const start = cleaned.search(/[{[]/);
  const end = Math.max(cleaned.lastIndexOf('}'), cleaned.lastIndexOf(']'));
  
  if (start !== -1 && end !== -1 && end > start) {
    return cleaned.substring(start, end + 1);
  }
  return cleaned;
};

// --- API FONKSİYONLARI ---

export const getDailyCities = async (dateStr: string): Promise<string[]> => {
  try {
    const ai = getAI();
    if (!hasValidApiKey()) {
        console.error("API Key eksik.");
        return [];
    }

    const prompt = `Bugün (${dateStr}) Türkiye'de TJK yarış programı olan şehirleri JSON array olarak döndür. Örn: ["Bursa", "Şanlıurfa"]. Yoksa [] dön.`;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: { ...COMMON_CONFIG, tools: [{ googleSearch: {} }] }
    });

    if (response.text) {
      const parsed = JSON.parse(cleanJsonString(response.text));
      return Array.isArray(parsed) ? parsed : [];
    }
    return [];
  } catch (error) {
    console.error("Şehir verisi alınamadı:", error);
    return [];
  }
};

export const analyzeRaces = async (city: string, dateStr: string): Promise<DailyProgram> => {
  try {
    const ai = getAI();
    if (!hasValidApiKey()) throw new Error("API Anahtarı bulunamadı.");

    const prompt = `
    ROL: Uzman At Yarışı Analisti.
    GÖREV: ${dateStr} - ${city} yarış programını analiz et.
    ÇIKTI: SADECE JSON formatında veri.
    
    JSON ŞEMASI:
    {
      "city": "${city}",
      "date": "${dateStr}",
      "summary": "Kısa genel değerlendirme",
      "races": [
        {
          "id": 1,
          "time": "14:00",
          "name": "Yarış Adı",
          "distance": "Mesafe",
          "trackType": "Pist",
          "horses": [
            { "no": 1, "name": "AT ADI", "jockey": "Jokey", "weight": "Kilo", "power_score": 90 }
          ]
        }
      ]
    }
    `;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: { ...COMMON_CONFIG, tools: [{ googleSearch: {} }] }
    });

    if (!response.text) throw new Error("AI yanıtı boş.");

    const data = JSON.parse(cleanJsonString(response.text));
    
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    data.sources = chunks
      .filter((c: any) => c.web?.uri && c.web?.title)
      .map((c: any) => ({ title: c.web.title, uri: c.web.uri }))
      .slice(0, 3);

    return data;
  } catch (error: any) {
    console.error("Analiz hatası:", error);
    throw new Error(error.message || "Analiz sırasında hata oluştu.");
  }
};

export const getRaceResults = async (city: string, dateStr: string): Promise<DailyProgram> => {
  try {
    const ai = getAI();
    if (!hasValidApiKey()) throw new Error("API Anahtarı bulunamadı.");

    const prompt = `
    GÖREV: ${dateStr} - ${city} yarışlarının RESMİ SONUÇLARINI JSON olarak getir.
    Atların ganyanlarını ve derecelerini mutlaka ekle.
    `;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: { ...COMMON_CONFIG, tools: [{ googleSearch: {} }] }
    });

    if (!response.text) throw new Error("Sonuç verisi boş.");
    
    const data = JSON.parse(cleanJsonString(response.text));
    return data;
  } catch (error: any) {
    console.error("Sonuç hatası:", error);
    throw new Error("Sonuçlar alınamadı.");
  }
};