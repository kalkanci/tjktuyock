import { GoogleGenAI } from "@google/genai";
import { DailyProgram } from "../types";

// --- API CLIENT MANAGEMENT ---

let aiInstance: GoogleGenAI | null = null;

// Helper to safely retrieve API Key from various environment configurations
const getApiKey = (): string | undefined => {
  // 1. Standard process.env (Node, Webpack, Next.js, CRA)
  if (typeof process !== 'undefined' && process.env?.API_KEY) {
    return process.env.API_KEY;
  }
  
  // 2. Vite / Modern Bundlers (often used in Vercel)
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      // @ts-ignore
      // Vercel environment variables usually need VITE_ prefix for client-side access in Vite
      return import.meta.env.VITE_API_KEY || import.meta.env.API_KEY;
    }
  } catch (e) {
    // ignore
  }
  
  return undefined;
};

const getAI = () => {
  if (aiInstance) return aiInstance;

  const apiKey = getApiKey();
  
  if (!apiKey) {
    throw new Error("API Anahtarı bulunamadı. Vercel ayarlarında 'VITE_API_KEY' değişkenini kontrol edin.");
  }

  aiInstance = new GoogleGenAI({ apiKey });
  return aiInstance;
};

// Modeli biraz daha "yaratıcılıktan uzak, veriye sadık" moda çekiyoruz
const modelId = "gemini-2.5-flash"; 

const COMMON_CONFIG = {
  temperature: 0.0, // SIFIR YAPILDI: Halüsinasyonu engellemek için en kritik ayar.
  topK: 20,
  topP: 0.8,
  maxOutputTokens: 8192,
};

const cleanJsonString = (str: string) => {
  if (!str) return "{}";
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
    
    // Prompt'u İngilizce komutlarla güçlendirdik, Türkçe içerik aratıyoruz.
    // JSON yapısını daha sıkı zorluyoruz.
    const prompt = `
    TASK: Find the official "TJK Yarış Programı" (Turkish Jockey Club Race Schedule) for the date: ${dateStr}.
    
    ACTION: Use Google Search to find which cities have horse races on ${dateStr}.
    
    OUTPUT: Return ONLY a valid JSON Array of strings containing the city names. 
    Example: ["İstanbul", "Adana"]
    If no races are found or the date is in the past/future with no schedule, return [].
    
    STRICT: Do not write any text outside the JSON.
    `;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: { ...COMMON_CONFIG, tools: [{ googleSearch: {} }] }
    });

    if (response.text) {
      const cleaned = cleanJsonString(response.text);
      try {
        const parsed = JSON.parse(cleaned);
        return Array.isArray(parsed) ? parsed : [];
      } catch (parseError) {
        console.error("JSON Parse Error:", parseError, response.text);
        return [];
      }
    }
    return [];
  } catch (error: any) {
    console.error("Şehir verisi hatası:", error);
    // Hata detayını fırlat ki arayüzde görebilelim
    throw new Error(error.message || "Şehir listesi alınırken bağlantı hatası oluştu.");
  }
};

export const analyzeRaces = async (city: string, dateStr: string): Promise<DailyProgram> => {
  try {
    const ai = getAI();
    
    const prompt = `
    TASK: Analyze the official TJK (Türkiye Jokey Kulübü) race program for ${city} on ${dateStr}.
    
    STEP 1: SEARCH
    Search for "TJK ${dateStr} ${city} yarış programı", "TJK ${dateStr} ${city} bülteni puanlı".
    
    STEP 2: EXTRACT DATA
    Extract the following details for EVERY race (Koşu) of the day:
    1. Race Time (Saat) - Use real times found in search.
    2. Race Name/Type (e.g. Şartlı 4, Handikap 15)
    3. Distance & Track (e.g. 1400m Kum/Sentetik)
    4. Horses: Extract 'Sırt No' (Horse Number), 'At İsmi' (Name), 'Jokey' (Jockey).
    
    STEP 3: ANALYZE & SCORE
    Assign a 'power_score' (0-100) to each horse based on the 'AGF' (Six Ganyard Favorites) or expert predictions found in search results.
    - Favorites (AGF 1-2-3) should have scores > 80.
    - Underdogs should have scores < 60.
    
    STEP 4: OUTPUT JSON
    Return valid JSON with this structure:
    {
      "city": "${city}",
      "date": "${dateStr}",
      "summary": "Brief analysis of the day's program in Turkish.",
      "races": [
        {
          "id": 1,
          "time": "HH:MM", 
          "name": "Race Name",
          "distance": "Distance",
          "trackType": "Track",
          "horses": [
            { "no": 1, "name": "HORSE NAME", "jockey": "Jockey Name", "weight": "58", "power_score": 85, "risk_level": "düşük" }
          ]
        }
      ]
    }
    `;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: { 
        ...COMMON_CONFIG, 
        tools: [{ googleSearch: {} }]
      }
    });

    if (!response.text) throw new Error("AI yanıt vermedi (Boş İçerik).");

    const data = JSON.parse(cleanJsonString(response.text));
    
    // Kaynakları ekle
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    data.sources = chunks
      .filter((c: any) => c.web?.uri && c.web?.title)
      .map((c: any) => ({ title: c.web.title, uri: c.web.uri }))
      .slice(0, 4);

    return data;
  } catch (error: any) {
    console.error("Analiz hatası:", error);
    throw new Error(error.message || "Analiz verisi işlenemedi.");
  }
};

export const getRaceResults = async (city: string, dateStr: string): Promise<DailyProgram> => {
  try {
    const ai = getAI();

    const prompt = `
    TASK: Find official TJK race results for ${city} on ${dateStr}.
    OUTPUT: JSON format with finished races, including winning horse, ganyan, and finish time.
    `;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: { ...COMMON_CONFIG, tools: [{ googleSearch: {} }] }
    });

    if (!response.text) throw new Error("Sonuç verisi bulunamadı.");
    
    const data = JSON.parse(cleanJsonString(response.text));
    return data;
  } catch (error: any) {
    console.error("Sonuç hatası:", error);
    throw new Error(error.message || "Sonuçlar alınamadı.");
  }
};