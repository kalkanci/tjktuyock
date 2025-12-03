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
    console.error("API Key missing. Checked process.env.API_KEY and import.meta.env.VITE_API_KEY");
    throw new Error("API Anahtarı bulunamadı. Vercel'de 'VITE_API_KEY' tanımlı olduğundan emin olun.");
  }

  aiInstance = new GoogleGenAI({ apiKey });
  return aiInstance;
};

const modelId = "gemini-2.5-flash"; 

const COMMON_CONFIG = {
  temperature: 0.0, // KESİN VERİ: Yaratıcılık tamamen kapatıldı. Sadece gerçek veri.
  topK: 40,
  topP: 0.95,
  maxOutputTokens: 8192, // Maksimum çıktı uzunluğu (Tüm koşular sığsın diye)
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
    
    const prompt = `
    TASK: Search for official Turkish Jockey Club (TJK) race schedule for ${dateStr}.
    GOAL: List cities hosting races today.
    
    OUTPUT: JSON Array of strings. e.g. ["İstanbul", "Kocaeli"].
    Use Google Search to verify exact dates. If no races, return [].
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
    
    // Prompt "Derinlemesine Tarama" moduna geçirildi.
    const prompt = `
    MODE: OFFICIAL DATA SCRAPING (STRICT)
    TARGET: Retrieve the COMPLETE TJK race program for ${city} on ${dateStr}.
    
    INSTRUCTIONS:
    1. PERFORM A DEEP SEARCH: Use Google Search to find the official "TJK Yarış Programı" or reliable sources like "Nalkapon", "Liderform", "Fanatik" for this specific date and city.
    
    2. RETRIEVE ALL RACES (CRITICAL): 
       - A typical racing day has between 6 to 10 races.
       - You MUST extract EVERY SINGLE RACE (Koşu 1, Koşu 2, ... up to the last one).
       - DO NOT Summarize. DO NOT stop after 2 races.
       - If there are 9 races, your JSON must contain 9 objects in the "races" array.
    
    3. DATA ACCURACY:
       - Use ONLY real data found in the search. Do not guess.
       - For Horses: Get the exact "Sırt No" (Horse Number), "At İsmi" (Name), "Jokey" (Jockey), "Kilo" (Weight).
       - For Race Info: Get exact Time, Distance (m), and Track Type (Çim/Kum/Sentetik).
    
    4. ANALYSIS (Power Score):
       - Assign a 'power_score' (0-100) to each horse based on AGF (Altılı Ganyan Favorisi) rankings found in search. 
       - Favori 1: 90-100 pts, Favori 2: 80-90 pts... Sürpriz: <60 pts.
    
    OUTPUT FORMAT (JSON ONLY):
    {
      "city": "${city}",
      "date": "${dateStr}",
      "summary": "Summarize the program (e.g., 'Today there are 9 races in ${city} starting at...'). Mention the favorites.",
      "races": [
        {
          "id": 1,
          "time": "HH:MM", 
          "name": "ŞARTLI-1",
          "distance": "1200m",
          "trackType": "Kum",
          "horses": [
            { "no": 1, "name": "REAL NAME", "jockey": "REAL JOCKEY", "weight": "58", "power_score": 95, "risk_level": "düşük" },
            ... (List ALL horses in this race)
          ]
        },
        ... (Repeat for ALL races. Do not skip any.)
      ]
    }
    `;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: { 
        ...COMMON_CONFIG, 
        // Google Search aracı veri doğruluğu için zorunlu
        tools: [{ googleSearch: {} }]
      }
    });

    if (!response.text) {
        throw new Error("Yapay zeka veri oluşturamadı. Lütfen tekrar deneyin.");
    }

    const data = JSON.parse(cleanJsonString(response.text));
    
    // Kaynakları ekle
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    data.sources = chunks
      .filter((c: any) => c.web?.uri && c.web?.title)
      .map((c: any) => ({ title: c.web.title, uri: c.web.uri }))
      .slice(0, 4);
    
    // Boş veri kontrolü
    if (!data.races || !Array.isArray(data.races)) {
        data.races = [];
    }
    
    // Eğer az koşu geldiyse (örn: 2 tane), kullanıcıya uyarı eklenebilir ama şu an sessizce dönüyoruz.
    // Prompt'un gücü ile hepsini almaya çalışacağız.

    return data;
  } catch (error: any) {
    console.error("Analiz hatası:", error);
    let msg = error.message || "Analiz yapılamadı.";
    if (msg.includes("JSON")) msg = "Veri işlenirken hata oluştu (JSON Parse).";
    throw new Error(msg);
  }
};

export const getRaceResults = async (city: string, dateStr: string): Promise<DailyProgram> => {
  try {
    const ai = getAI();

    const prompt = `
    TASK: Find OFFICIAL TJK race results for ${city} on ${dateStr}.
    OUTPUT: JSON format containing ALL completed races.
    Include: Winner horse name, Ganyan, Finish time.
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