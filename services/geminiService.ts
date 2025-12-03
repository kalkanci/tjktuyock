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
    // Detailed error for debugging
    console.error("API Key missing. Checked process.env.API_KEY and import.meta.env.VITE_API_KEY");
    throw new Error("API Anahtarı bulunamadı. Vercel'de 'VITE_API_KEY' tanımlı olduğundan emin olun.");
  }

  aiInstance = new GoogleGenAI({ apiKey });
  return aiInstance;
};

const modelId = "gemini-2.5-flash"; 

const COMMON_CONFIG = {
  temperature: 0.3, // Biraz esneklik tanıdık (0.0 bazen tıkanıyor)
  topK: 40,
  topP: 0.95,
  maxOutputTokens: 8192,
};

const cleanJsonString = (str: string) => {
  if (!str) return "{}";
  let cleaned = str.replace(/```json/g, "").replace(/```/g, "");
  
  const start = cleaned.search(/[{[]/);
  const end = Math.max(cleaned.lastIndexOf('}'), cleaned.lastIndexOf(']'));
  
  if (start !== -1 && end !== -1 && end > start) {
    cleaned = cleaned.substring(start, end + 1);
  }
  return cleaned.trim();
};

// --- API FONKSİYONLARI ---

export const getDailyCities = async (dateStr: string): Promise<string[]> => {
  try {
    const ai = getAI();
    
    // Prompt güncellendi: Daha basit ve hata toleranslı
    const prompt = `
    TASK: Search for Turkish Jockey Club (TJK) race program for ${dateStr}.
    GOAL: Identify which cities have horse races today.
    
    OUTPUT: A JSON Array of city names (strings). e.g. ["İstanbul", "Adana"].
    If you cannot find any info, or if there are no races, return [].
    
    IMPORTANT: Respond ONLY with the JSON array.
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
        console.warn("City Parse Error, returning empty:", parseError);
        return [];
      }
    }
    return [];
  } catch (error: any) {
    console.error("Şehir verisi hatası:", error);
    throw new Error("Şehir listesi alınamadı: " + (error.message || "Bilinmeyen hata"));
  }
};

export const analyzeRaces = async (city: string, dateStr: string): Promise<DailyProgram> => {
  try {
    const ai = getAI();
    
    const prompt = `
    You are a Horse Racing Analyst.
    TARGET: TJK (Türkiye Jokey Kulübü) race program for ${city} on ${dateStr}.
    
    INSTRUCTIONS:
    1. Search for "TJK ${dateStr} ${city} yarış programı" and "TJK ${dateStr} ${city} bülteni".
    2. Extract ALL races (Koşu 1, Koşu 2, etc.).
    3. For each race, get: Time, Race Name, Distance, Track Type.
    4. For horses: Get Number (No), Name, Jockey.
    5. PREDICTION: Assign a 'power_score' (0-100) based on favorites found in search.
    
    CRITICAL OUTPUT RULE:
    - You MUST return a valid JSON object.
    - If you cannot find data, return a JSON with an empty "races" array and explain why in "summary".
    - DO NOT return empty text.
    
    JSON FORMAT:
    {
      "city": "${city}",
      "date": "${dateStr}",
      "summary": "Detailed summary in Turkish...",
      "races": [
        {
          "id": 1,
          "time": "14:30", 
          "name": "Maiden",
          "distance": "1400m",
          "trackType": "Kum",
          "horses": [
            { "no": 1, "name": "BOLD PILOT", "jockey": "H.Karataş", "weight": "60", "power_score": 95, "risk_level": "düşük" }
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

    if (!response.text) {
        // Fallback: Model search tool başarısız olduysa veya metin dönmediyse
        console.error("AI returned empty text. Candidates:", response.candidates);
        throw new Error("Yapay zeka bu şehir için veri oluşturamadı. Lütfen başka bir şehir veya tarih deneyin.");
    }

    const data = JSON.parse(cleanJsonString(response.text));
    
    // Kaynakları ekle
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    data.sources = chunks
      .filter((c: any) => c.web?.uri && c.web?.title)
      .map((c: any) => ({ title: c.web.title, uri: c.web.uri }))
      .slice(0, 4);
    
    // Veri kontrolü
    if (!data.races || !Array.isArray(data.races)) {
        data.races = [];
        if (!data.summary) data.summary = "Program detayları alınamadı.";
    }

    return data;
  } catch (error: any) {
    console.error("Analiz hatası:", error);
    // Hata mesajını temizle
    let msg = error.message || "Analiz yapılamadı.";
    if (msg.includes("JSON")) msg = "Veri formatı hatalı geldi.";
    if (msg.includes("API Key")) msg = "API Anahtarı hatası.";
    
    throw new Error(msg);
  }
};

export const getRaceResults = async (city: string, dateStr: string): Promise<DailyProgram> => {
  try {
    const ai = getAI();

    const prompt = `
    Find TJK race results for ${city} on ${dateStr}.
    Return JSON with finished races.
    Format: { "city": "${city}", "date": "${dateStr}", "races": [...] }
    `;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: { ...COMMON_CONFIG, tools: [{ googleSearch: {} }] }
    });

    if (!response.text) throw new Error("Sonuç bulunamadı.");
    
    const data = JSON.parse(cleanJsonString(response.text));
    return data;
  } catch (error: any) {
    console.error("Sonuç hatası:", error);
    throw new Error("Sonuç verisi alınamadı.");
  }
};