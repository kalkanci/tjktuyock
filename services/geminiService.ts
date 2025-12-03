import { GoogleGenAI } from "@google/genai";
import { DailyProgram, Race, Horse } from "../types";

// --- API CLIENT MANAGEMENT ---

let aiInstance: GoogleGenAI | null = null;

const getAI = () => {
  if (aiInstance) return aiInstance;

  // Ortam değişkeninden API anahtarını alıyoruz
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    console.error("API Key missing. process.env.API_KEY is not defined.");
    throw new Error("API Anahtarı bulunamadı. Gerçek veri çekmek için API anahtarı gereklidir.");
  }

  aiInstance = new GoogleGenAI({ apiKey });
  return aiInstance;
};

// Gerçek zamanlı arama ve hız için Flash modeli
const MODEL_ID = "gemini-2.5-flash"; 

const cleanJsonString = (str: string) => {
  if (!str) return "{}";
  // Markdown code block temizliği
  let cleaned = str.replace(/```json/g, "").replace(/```/g, "");
  
  // İlk '{' veya '[' karakterini bul
  const start = cleaned.search(/[{[]/);
  // Son '}' veya ']' karakterini bul
  const end = Math.max(cleaned.lastIndexOf('}'), cleaned.lastIndexOf(']'));
  
  if (start !== -1 && end !== -1 && end > start) {
    cleaned = cleaned.substring(start, end + 1);
  }
  
  return cleaned.trim();
};

/**
 * Gemini API Çağrısı (Retry Mekanizmalı)
 */
const generateContentWithRetry = async (prompt: string, retries = 1) => {
    const ai = getAI();
    let lastError: any;
    
    for (let i = 0; i <= retries; i++) {
        try {
            // Google Search Tool aktif ediyoruz - Gerçek veri için kritik
            const response = await ai.models.generateContent({
                model: MODEL_ID,
                contents: prompt,
                config: { 
                    temperature: 0.2, // Daha tutarlı sonuçlar için düşük sıcaklık
                    tools: [{ googleSearch: {} }] // İNTERNET ERİŞİMİ
                }
            });
            return response;
        } catch (e: any) {
            console.warn(`Gemini API Request failed (Attempt ${i + 1}):`, e.message);
            lastError = e;
            await new Promise(res => setTimeout(res, 1500)); // Bekleme süresi
        }
    }
    throw lastError;
};

// --- SERVİS FONKSİYONLARI ---

export const getDailyCities = async (dateStr: string): Promise<string[]> => {
  try {
    const prompt = `
    GÖREV: Bugün (${dateStr}) Türkiye'de TJK tarafından düzenlenen resmi at yarışlarının olduğu şehirleri bul.
    
    SADECE JSON DİZİSİ DÖNDÜR:
    ["Şehir1", "Şehir2"]
    
    Eğer yarış yoksa boş dizi [] döndür. Başka hiçbir metin yazma.
    `;

    const response = await generateContentWithRetry(prompt);
    
    if (response.text) {
      const cleaned = cleanJsonString(response.text);
      try {
        const parsed = JSON.parse(cleaned);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        console.warn("City parse failed", e);
        return [];
      }
    }
    return [];
  } catch (error: any) {
    console.error("Şehir verisi hatası:", error);
    return []; // Hata durumunda boş dön
  }
};

/**
 * PROGRAM ÇEKME (ATLAR DAHİL)
 */
export const fetchBasicProgram = async (city: string, dateStr: string): Promise<DailyProgram> => {
  try {
    const prompt = `
    GÖREV: ${dateStr} tarihinde ${city} hipodromundaki RESMİ TJK yarış programını bul.
    
    ÖNEMLİ: Gerçek verileri kullan. Asla uydurma veri yazma.
    
    İSTENEN FORMAT (JSON):
    {
      "city": "${city}",
      "date": "${dateStr}",
      "summary": "${city} programı detayları aşağıdadır.",
      "races": [
        {
          "id": 1,
          "time": "Saat (Örn: 14:30)", 
          "name": "Yarış Adı (Örn: Maiden/DHÖW)",
          "distance": "Mesafe (Örn: 1400m)",
          "trackType": "Pist (Kum/Çim/Sentetik)",
          "horses": [
             { "no": 1, "name": "AT ADI", "jockey": "Jokey Adı", "weight": "58", "power_score": 0 }
          ]
        }
      ]
    }
    
    KURALLAR:
    1. Her yarış için en az 5-6 at ismini bulmaya çalış.
    2. At isimleri GERÇEK olmalı.
    3. JSON dışında hiçbir şey yazma.
    `;

    const response = await generateContentWithRetry(prompt);

    if (!response.text) throw new Error("Program verisi boş geldi.");

    const cleaned = cleanJsonString(response.text);
    const data = JSON.parse(cleaned);

    // Kaynakları ekle (Grounding Metadata)
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    data.sources = chunks
      .filter((c: any) => c.web?.uri && c.web?.title)
      .map((c: any) => ({ title: c.web.title, uri: c.web.uri }))
      .slice(0, 4);
    
    // Status düzeltme
    if (data.races) {
        data.races = data.races.map((r: any) => ({ 
            ...r, 
            status: 'waiting'
        }));
    }

    return data;
  } catch (error: any) {
    console.error("Program çekme hatası:", error);
    throw new Error("Gerçek yarış programı alınamadı: " + error.message);
  }
};

/**
 * DETAYLI ANALİZ
 */
export const analyzeSingleRace = async (race: Race, city: string): Promise<Race> => {
  try {
    // Veri tasarrufu için sadece at isimlerini gönderiyoruz
    const horseNames = race.horses.map(h => `${h.no}-${h.name}`).join(", ");
    
    const prompt = `
    GÖREV: ${city} ${race.id}. Koşu için detaylı at yarışı analizi yap.
    KOŞU BİLGİSİ: ${race.distance} ${race.trackType}.
    ATLAR: ${horseNames}
    
    TALİMATLAR:
    1. Bu atların son yarışlarını ve form durumlarını Google'dan araştır.
    2. Buna göre Favori (Kazanmaya yakın), Plase (Sürpriz) ve Normal atları belirle.
    3. Her ata 0-100 arası bir "power_score" ver. (Favoriler 85+, Sürprizler 70+)
    
    ÇIKTI (JSON):
    {
      "raceId": ${race.id},
      "analysisResult": [
        { 
           "no": 1, 
           "prediction_type": "favorite", 
           "power_score": 90, 
           "confidence": 0.9,
           "analysis_reason": "Son yarışını çok rahat kazandı, formda.",
           "tags": ["Favori", "Formda"]
        }
      ],
      "race_summary": "Yarışın genel yorumu (Kısa)."
    }
    
    Sadece JSON döndür.
    `;

    const response = await generateContentWithRetry(prompt);

    if (!response.text) return { ...race, status: 'failed' };

    const cleaned = cleanJsonString(response.text);
    const result = JSON.parse(cleaned);
    const analysisMap = result.analysisResult || [];

    // Mevcut at listesini analiz verileriyle güncelle
    const updatedHorses: Horse[] = race.horses.map((horse) => {
        const analysis = analysisMap.find((a: any) => a.no === horse.no);
        
        if (analysis) {
            return {
                ...horse,
                power_score: analysis.power_score || 50,
                prediction_type: (analysis.prediction_type as 'favorite' | 'surprise' | 'normal') || 'normal',
                confidence: analysis.confidence || 0.5,
                analysis_reason: analysis.analysis_reason || "",
                tags: analysis.tags || []
            };
        }
        return { ...horse, power_score: 40, prediction_type: 'normal' };
    });

    return {
        ...race,
        horses: updatedHorses,
        race_summary: result.race_summary || "Analiz tamamlandı.",
        status: 'completed'
    };

  } catch (error) {
    console.error(`Koşu ${race.id} analiz hatası:`, error);
    // Hata olsa bile yarışı 'completed' işaretle ki UI takılmasın, ama eski veriyi koru
    return { ...race, status: 'completed', race_summary: "Analiz verisi alınamadı." };
  }
};

export const getRaceResults = async (city: string, dateStr: string): Promise<DailyProgram> => {
  try {
    const prompt = `
    GÖREV: ${dateStr} tarihinde ${city} hipodromunda koşulan yarışların RESMİ SONUÇLARINI getir.
    
    ÇIKTI FORMATI (JSON):
    {
      "city": "${city}",
      "date": "${dateStr}",
      "summary": "Resmi Sonuçlar",
      "races": [
        { 
           "id": 1, 
           "horses": [
              { "no": 1, "name": "KAZANAN AT", "ganyan": "2.50", "finish_time": "1.35.00" }
           ] 
        }
      ]
    }
    `;

    const response = await generateContentWithRetry(prompt);

    if (!response.text) throw new Error("Sonuç verisi bulunamadı.");
    
    const cleaned = cleanJsonString(response.text);
    return JSON.parse(cleaned);
  } catch (error: any) {
    console.error("Sonuç hatası:", error);
    throw new Error("Sonuç verisi alınamadı.");
  }
};
