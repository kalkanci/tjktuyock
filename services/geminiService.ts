import { GoogleGenAI } from "@google/genai";
import { DailyProgram } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `
Sen "Yarış Analiz Motoru"sun.
GÖREV: TJK Yarış Bültenini veya Sonuçlarını analiz etmek.

KURALLAR:
1. Hızlı ol. Tek seferde tüm sayfayı analiz et.
2. At isimlerini temiz yaz (Örn: "BOLD PILOT" - Ekler olmasın).
3. Sonuçlar için Ganyan ve Derece bilgisini mutlaka bulmaya çalış.

ÇIKTI FORMATI:
Sadece geçerli bir JSON objesi döndür.
`;

export const getDailyCities = async (dateStr: string): Promise<string[]> => {
  const dateObj = new Date(dateStr);
  const formattedDate = dateObj.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
  
  const prompt = `
  TARİH: ${formattedDate}
  SORU: Bugün (${formattedDate}) Türkiye'de hangi hipodromlarda (şehirlerde) TJK at yarışı var?
  Sadece şehir isimlerini içeren JSON array döndür. Örn: ["İstanbul", "Adana"]
  Eğer veri yoksa [] döndür.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { tools: [{ googleSearch: {} }], temperature: 0.1 },
    });
    let text = response.text || "[]";
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const firstBracket = text.indexOf('[');
    const lastBracket = text.lastIndexOf(']');
    if (firstBracket !== -1 && lastBracket !== -1) {
      return JSON.parse(text.substring(firstBracket, lastBracket + 1));
    }
    return [];
  } catch (error) {
    console.error("City Discovery Error:", error);
    return [];
  }
};

export const analyzeRaces = async (city: string, dateStr: string): Promise<DailyProgram> => {
  const dateObj = new Date(dateStr);
  const formattedDate = dateObj.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
  
  const prompt = `
  TARİH: ${formattedDate}
  ŞEHİR: ${city}
  GÖREV: Yarış Bülteni Tahmini
  
  Bu tarihteki yarış programını bul ve analiz et.
  Her koşu için favori atlara "power_score" (80-100 arası favoriler, 50-80 arası plaseler) ver.
  
  JSON FORMATI:
  {
    "city": "${city}",
    "date": "${formattedDate}",
    "summary": "Program hakkında 1 cümlelik özet (Örn: İstanbul'da çim pist yarışları ağırlıkta, favoriler şanslı görünüyor).",
    "races": [
      {
        "id": 1, 
        "time": "14:30", 
        "name": "Şartlı 4", 
        "distance": "1400m Çim", 
        "trackType": "Çim",
        "race_summary": "Bu koşuda seri safkanlar ön planda.",
        "horses": [
           { "no": 1, "name": "AT ADI", "jockey": "A.Çelik", "power_score": 95, "risk_level": "düşük" },
           { "no": 2, "name": "AT ADI 2", "jockey": "H.Karataş", "power_score": 88, "risk_level": "orta" }
        ]
      }
    ]
  }
  
  ÖNEMLİ: Sadece JSON döndür.
  `;

  return fetchFromGemini(prompt);
};

export const getRaceResults = async (city: string, dateStr: string): Promise<DailyProgram> => {
  const dateObj = new Date(dateStr);
  const formattedDate = dateObj.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });

  const prompt = `
  TARİH: ${formattedDate}
  ŞEHİR: ${city}
  GÖREV: Yarış Sonuçlarını Bul (TJK Resmi Sonuçları)
  
  Bu tarihte ${city} hipodromunda koşulan yarışların KESİN SONUÇLARINI bul.
  
  JSON FORMATI:
  {
    "city": "${city}", 
    "date": "${formattedDate}", 
    "summary": "Günün sonuç özeti (Örn: Favorilerin kazandığı bir gün oldu).",
    "races": [
      {
        "id": 1, 
        "time": "13:30", 
        "name": "Maiden", 
        "distance": "1200m Kum", 
        "trackType": "Kum",
        "horses": [
           { "no": 1, "name": "KAZANAN AT", "jockey": "Jokey", "ganyan": "2.35", "finish_time": "1.12.45" },
           { "no": 2, "name": "İKİNCİ AT", "jockey": "Jokey", "ganyan": "1.80", "finish_time": "1.12.80" },
           { "no": 3, "name": "ÜÇÜNCÜ AT", "jockey": "Jokey", "ganyan": "5.40", "finish_time": "" },
           { "no": 4, "name": "DÖRDÜNCÜ AT", "jockey": "Jokey", "ganyan": "", "finish_time": "" }
        ]
      }
    ]
  }
  
  DİKKAT: "horses" dizisinde "no" alanı bitiriş sırasını temsil etsin (1 = Birinci, 2 = İkinci).
  Ganyanları TL cinsinden yaz.
  `;

  return fetchFromGemini(prompt);
};

async function fetchFromGemini(prompt: string): Promise<DailyProgram> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ googleSearch: {} }],
        temperature: 0.2, // Low temperature for deterministic formatting
      },
    });

    let text = response.text || "";
    
    // Clean markdown
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();

    // Find JSON object
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    
    if (firstBrace === -1 || lastBrace === -1) {
      throw new Error("Veri formatı hatalı.");
    }

    text = text.substring(firstBrace, lastBrace + 1);
    
    const data = JSON.parse(text) as DailyProgram;

    // Extract sources
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = chunks
      .filter((c: any) => c.web?.uri && c.web?.title)
      .map((c: any) => ({ title: c.web.title, uri: c.web.uri }));
    
    // Deduplicate sources
    const uniqueSources = Array.from(new Map(sources.map((item:any) => [item.uri, item])).values());

    return { ...data, sources: uniqueSources as any[] };

  } catch (error: any) {
    console.error("Gemini Error:", error);
    throw new Error("Veriler alınırken bir sorun oluştu. Lütfen tekrar deneyin.");
  }
}