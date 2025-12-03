import { GoogleGenAI } from "@google/genai";
import { DailyProgram } from "../types";

// --- API CLIENT MANAGEMENT ---

let aiInstance: GoogleGenAI | null = null;

const getAI = () => {
  if (aiInstance) return aiInstance;

  // The API key must be obtained exclusively from the environment variable process.env.API_KEY.
  // Assume this variable is pre-configured, valid, and accessible.
  aiInstance = new GoogleGenAI({ apiKey: process.env.API_KEY });
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
    
    // Prompt, Google Search'ü spesifik sitelere yönlendiriyor
    const prompt = `
    GÖREV: ${dateStr} tarihi için "TJK Yarış Programı"nı ara.
    SORU: Bugün hangi şehirlerde at yarışı var?
    ÇIKTI: Sadece şehir isimlerini içeren JSON Array döndür. Örn: ["İstanbul", "Elazığ"]. 
    Eğer program yoksa [] döndür.
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
  } catch (error: any) {
    console.error("Şehir verisi alınamadı:", error);
    // Hata mesajını yukarı fırlat ki UI'da görünsün
    throw new Error(error.message || "Şehir listesi alınırken hata oluştu.");
  }
};

export const analyzeRaces = async (city: string, dateStr: string): Promise<DailyProgram> => {
  try {
    const ai = getAI();
    
    // --- KRİTİK GÜNCELLEME: Prompt artık veriyi "üretmiyor", "bulup çıkarıyor" ---
    const prompt = `
    GÖREV: TJK (Türkiye Jokey Kulübü) ${dateStr} tarihli ${city} hipodromu RESMİ yarış programını bul ve verileri çıkar.
    
    AŞAMA 1: İNTERNET ARAMASI
    Şu terimleri kullanarak Google'da arama yap: "TJK ${dateStr} ${city} yarış programı", "TJK ${dateStr} ${city} bülteni", "Nesine at yarışı bülteni ${dateStr} ${city}".

    AŞAMA 2: VERİ ÇIKARMA KURALLARI (ÇOK ÖNEMLİ)
    1. **SAATLER:** Asla tahmin etme. Arama sonuçlarında gördüğün GERÇEK saatleri yaz. (Örn: İstanbul 1. koşu 15:00 ise 15:00 yaz, 13:30 yazma).
    2. **SIRT NUMARASI (no):** Atların "no" alanı, listedeki sırası (1,2,3,4) DEĞİLDİR. Atın formasında yazan "Sırt Numarası"dır. Arama sonuçlarında genelde at isminin yanında parantez içinde veya solunda yazar (Örn: "5. BOLD PILOT" -> No: 5). ASLA 1'den başlayıp sıralı numara verme. Karışık olmalı (Örn: 3, 7, 1, 9...).
    3. **TÜM KOŞULAR:** O gün 9 koşu varsa 9'unu da getir. 10 varsa 10'unu da getir. Kesme yapma.
    4. **PUANLAMA:** "power_score" değerini favori atlara (AGF oranı yüksek olanlara) yüksek ver (85-100 arası). Sürprizlere düşük ver.

    AŞAMA 3: JSON FORMATI
    Sadece aşağıdaki formatta saf JSON döndür. Yorum yapma.

    {
      "city": "${city}",
      "date": "${dateStr}",
      "summary": "Program hakkında kısa, gerçekçi bir özet (Örn: 9 koşulu program 15:00'te başlıyor. Favori...)",
      "races": [
        {
          "id": 1,
          "time": "15:00", 
          "name": "ŞARTLI-3/Dişi",
          "distance": "1400m",
          "trackType": "Sentetik",
          "horses": [
            { "no": 4, "name": "AT İSMİ", "jockey": "JOKEY", "weight": "58", "power_score": 92, "risk_level": "düşük" },
            { "no": 11, "name": "DİĞER AT", "jockey": "JOKEY", "weight": "50", "power_score": 60, "risk_level": "yüksek" }
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
        tools: [{ googleSearch: {} }] // Google Search ZORUNLU
      }
    });

    if (!response.text) throw new Error("AI yanıtı boş.");

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
    throw new Error(error.message || "Analiz sırasında hata oluştu. Lütfen tekrar deneyin.");
  }
};

export const getRaceResults = async (city: string, dateStr: string): Promise<DailyProgram> => {
  try {
    const ai = getAI();

    const prompt = `
    GÖREV: ${dateStr} - ${city} at yarışı RESMİ SONUÇLARINI bul.
    KURALLAR:
    1. Sadece biten koşuları getir.
    2. Atların bitiriş sırasını, ganyanını ve derecesini gerçek verilerden al.
    3. JSON formatında döndür.
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