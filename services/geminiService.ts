import { GoogleGenAI } from "@google/genai";
import { DailyProgram } from "../types";

// Lazy initialization to prevent "process is not defined" crash in browser environments
let aiInstance: GoogleGenAI | null = null;

const getAI = () => {
  if (!aiInstance) {
    // Safety check for process.env
    const apiKey = (typeof process !== 'undefined' && process.env && process.env.API_KEY) 
      ? process.env.API_KEY 
      : ''; 
    aiInstance = new GoogleGenAI({ apiKey });
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
  let cleaned = str.replace(/```json/g, '').replace(/```/g, '').trim();
  const firstBrace = cleaned.indexOf('{');
  const firstBracket = cleaned.indexOf('[');
  let start = -1;
  if (firstBrace !== -1 && firstBracket !== -1) start = Math.min(firstBrace, firstBracket);
  else if (firstBrace !== -1) start = firstBrace;
  else start = firstBracket;

  const lastBrace = cleaned.lastIndexOf('}');
  const lastBracket = cleaned.lastIndexOf(']');
  const end = Math.max(lastBrace, lastBracket);
  
  if (start !== -1 && end !== -1 && end > start) {
    return cleaned.substring(start, end + 1);
  }
  return cleaned;
};

export const getDailyCities = async (dateStr: string): Promise<string[]> => {
  try {
    const ai = getAI();
    const prompt = `
    Bugün (${dateStr}) Türkiye'de hangi şehirlerde at yarışı (TJK) programı var?
    Lütfen sadece şehir isimlerini içeren bir JSON dizisi döndür. Örnek: ["İstanbul", "Adana"]. Eğer yoksa [] döndür.
    `;

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
    console.error("Şehirler alınırken hata:", error);
    return [];
  }
};

export const analyzeRaces = async (city: string, dateStr: string): Promise<DailyProgram> => {
  try {
    const ai = getAI();
    const prompt = `
    SEN UZMAN BİR AT YARIŞI ANALİSTİSİN.
    GÖREV: ${dateStr} tarihinde ${city} hipodromundaki yarış programını detaylı analiz et.
    KAYNAKLAR: TJK.org, Liderform, Fanatik, Nalkapon.
    
    KURALLAR:
    1. Bilinmeyen verilere asla "Bilinmiyor" yazma, tahmin et veya boş bırak.
    2. Koşu tiplerini (Maiden, Handikap vb.) belirt.
    3. Güç Puanı: Favorilere 85-99, Plaselere 70-84, Sürprizlere 40-69 ver.
    
    İSTENEN JSON FORMATI:
    {
      "city": "${city}",
      "date": "${dateStr}",
      "summary": "Genel analiz...",
      "sources": [ { "title": "Kaynak", "uri": "URL" } ],
      "races": [
        {
          "id": 1,
          "time": "13:30",
          "name": "Yarış Adı",
          "distance": "1400m",
          "trackType": "Kum",
          "race_summary": "Kısa analiz",
          "horses": [
            { "no": 1, "name": "AT ADI", "jockey": "JOKEY", "weight": "60", "power_score": 95, "risk_level": "düşük" }
          ]
        }
      ]
    }
    SADECE JSON DÖNDÜR.
    `;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: { ...COMMON_CONFIG, tools: [{ googleSearch: {} }] }
    });

    if (!response.text) throw new Error("Veri alınamadı");

    const data = JSON.parse(cleanJsonString(response.text));
    if (!Array.isArray(data.races)) data.races = [];

    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const webSources = chunks
      .filter((c: any) => c.web?.uri && c.web?.title)
      .map((c: any) => ({ title: c.web.title, uri: c.web.uri }));
    
    if (webSources.length > 0) data.sources = webSources.slice(0, 5);

    return data;
  } catch (error) {
    console.error("Analiz hatası:", error);
    throw new Error("Analiz sırasında bir hata oluştu. Lütfen tekrar deneyin.");
  }
};

export const getRaceResults = async (city: string, dateStr: string): Promise<DailyProgram> => {
  try {
    const ai = getAI();
    const prompt = `
    GÖREV: ${dateStr} tarihinde ${city} hipodromunda koşulan yarışların RESMİ SONUÇLARINI getir.
    Ganyanları ve dereceleri bul. Sıralamayı doğru yap.
    
    İSTENEN JSON FORMATI:
    (DailyProgram yapısında, horses dizisi içinde finish_time, ganyan alanları dolu olmalı)
    SADECE JSON DÖNDÜR.
    `;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: { ...COMMON_CONFIG, tools: [{ googleSearch: {} }] }
    });

    if (!response.text) throw new Error("Sonuç verisi alınamadı");
    
    const data = JSON.parse(cleanJsonString(response.text));
    if (!Array.isArray(data.races)) data.races = [];
    
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const webSources = chunks
      .filter((c: any) => c.web?.uri && c.web?.title)
      .map((c: any) => ({ title: c.web.title, uri: c.web.uri }));
    
    if (webSources.length > 0) data.sources = webSources.slice(0, 5);

    return data;
  } catch (error) {
    console.error("Sonuç hatası:", error);
    throw new Error("Sonuçlar alınırken hata oluştu.");
  }
};