import { GoogleGenAI } from "@google/genai";
import { DailyProgram } from "../types";

// --- GÜVENLİ API KEY YÖNETİMİ ---
// Not: 'import.meta' kullanımı bazı build araçlarında (eski Webpack vb.) syntax error verip 
// uygulamanın hiç açılmamasına (siyah ekran) sebep olabilir. Bu yüzden sadece process.env kullanıyoruz.
const getSafeApiKey = (): string => {
  try {
    // process nesnesinin varlığını güvenli bir şekilde kontrol et
    if (typeof process !== 'undefined' && process.env) {
      return process.env.API_KEY || 
             process.env.REACT_APP_API_KEY || 
             process.env.NEXT_PUBLIC_API_KEY || 
             '';
    }
  } catch (e) {
    // Erişim hatası olursa yut ve boş dön
    console.warn("Environment access error:", e);
  }
  return '';
};

// Lazy initialization (Sadece ihtiyaç duyulduğunda başlatılır)
let aiInstance: GoogleGenAI | null = null;

const getAI = () => {
  if (!aiInstance) {
    const apiKey = getSafeApiKey();
    if (!apiKey) {
      throw new Error("API Anahtarı Bulunamadı. Lütfen .env dosyasını veya Vercel ayarlarını kontrol edin.");
    }
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

// JSON Temizleme (Optimize Edildi)
const cleanJsonString = (str: string) => {
  if (!str) return "{}";
  // Markdown bloklarını temizle
  const cleaned = str.replace(/```json|```/g, '').trim();
  
  // İlk { veya [ ile Son } veya ] arasını al
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
    
    // Kaynakları ekle
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    data.sources = chunks
      .filter((c: any) => c.web?.uri && c.web?.title)
      .map((c: any) => ({ title: c.web.title, uri: c.web.uri }))
      .slice(0, 3); // Max 3 kaynak yeterli

    return data;
  } catch (error: any) {
    console.error("Analiz hatası:", error);
    throw new Error(error.message || "Analiz yapılamadı.");
  }
};

export const getRaceResults = async (city: string, dateStr: string): Promise<DailyProgram> => {
  try {
    const ai = getAI();
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