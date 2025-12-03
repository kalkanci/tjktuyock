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
  temperature: 0.2, // Daha tutarlı veri için düşürüldü
  topK: 40,
  topP: 0.95,
  maxOutputTokens: 8192, // Tüm programı çekebilmek için limit artırıldı
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
    ROL: Uzman TJK At Yarışı Analisti.
    GÖREV: ${dateStr} tarihli ${city} hipodromundaki yarış programını eksiksiz analiz et.
    
    KURALLAR:
    1. O gün kaç koşu varsa (Örn: 9 koşu) HEPSİNİ JSON'a ekle. Asla 3-4 koşudan sonra kesme.
    2. "no" alanı atın GERÇEK SIRT NUMARASI olmalı. (Asla 1'den başlayıp sıralı gitme, gerçek bültendeki numarayı yaz).
    3. "power_score" (Güç Puanı) alanını, favori atlar için 85-100 arası, sürprizler için 50-80 arası gerçekçi verilerle doldur. Asla tüm atlara 1,2,3 diye sıra verme.
    4. Her koşu için en az 6-7 at listele.
    5. Geriye SADECE saf JSON döndür. Markdown kullanma.
    
    JSON ŞEMASI:
    {
      "city": "${city}",
      "date": "${dateStr}",
      "summary": "Programın genel zorluk derecesi ve öne çıkan jokeyler hakkında kısa bilgi.",
      "races": [
        {
          "id": 1,
          "time": "13:30",
          "name": "ŞARTLI-3",
          "distance": "1400m",
          "trackType": "Kum",
          "horses": [
            { "no": 4, "name": "BOLD PILOT", "jockey": "H.KARATAŞ", "weight": "60", "power_score": 95, "risk_level": "düşük" },
            { "no": 8, "name": "GRAND EKINOKS", "jockey": "S.BOYRAZ", "weight": "58", "power_score": 88, "risk_level": "orta" }
          ]
        },
        ... (TÜM KOŞULAR BURAYA EKLENECEK)
      ]
    }
    `;

    // Daha uzun yanıtlar için output token limitini artırmamız gerekebilir ama
    // standart config genellikle yeterlidir. Prompt'u güçlendirmek en iyisi.
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: { 
        ...COMMON_CONFIG, 
        tools: [{ googleSearch: {} }],
        // responseMimeType: "application/json" // Bazen bu hata verebilir, plain text alıp parse etmek daha güvenli
      }
    });

    if (!response.text) throw new Error("AI yanıtı boş.");

    console.log("AI Response Length:", response.text.length); // Debug için

    const data = JSON.parse(cleanJsonString(response.text));
    
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    data.sources = chunks
      .filter((c: any) => c.web?.uri && c.web?.title)
      .map((c: any) => ({ title: c.web.title, uri: c.web.uri }))
      .slice(0, 3);

    return data;
  } catch (error: any) {
    console.error("Analiz hatası:", error);
    throw new Error(error.message || "Analiz sırasında hata oluştu. Lütfen tekrar deneyin.");
  }
};

export const getRaceResults = async (city: string, dateStr: string): Promise<DailyProgram> => {
  try {
    const ai = getAI();
    if (!hasValidApiKey()) throw new Error("API Anahtarı bulunamadı.");

    const prompt = `
    GÖREV: ${dateStr} - ${city} yarışlarının RESMİ SONUÇLARINI JSON olarak getir.
    Atların ganyanlarını ve derecelerini mutlaka ekle. Tüm koşuları getir.
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