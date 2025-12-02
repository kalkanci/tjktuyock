import { GoogleGenAI } from "@google/genai";
import { DailyProgram, Race, Horse } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `
Sen profesyonel bir at yarışı (TJK) analiz uzmanısın. 
Görevin: İnternetteki güncel TJK bültenlerini, yazar tahminlerini ve istatistikleri arayarak kullanıcıya o günkü şehir için en iyi tüyoları sağlamak.

Çıktı Formatı: Sadece geçerli bir JSON objesi döndür. Markdown formatı veya code block kullanma.
JSON Şeması şu şekilde olmalı:
{
  "city": "Şehir Adı",
  "date": "Gün Ay Yıl",
  "summary": "Günün genel analizi ve dikkat edilmesi gereken noktalar hakkında kısa bir özet (max 2 cümle).",
  "races": [
    {
      "id": 1,
      "time": "Saat (Örn: 14:30)",
      "name": "Koşu Şartı (Örn: Handikap 15)",
      "distance": "Mesafe (Örn: 1400m)",
      "trackType": "Kum" veya "Çim",
      "bestPick": "Favori Atın Adı",
      "horses": [
        {
          "name": "At Adı",
          "jockey": "Jokey Adı (biliniyorsa)",
          "isFavorite": boolean,
          "score": 0-100 arası kazanma ihtimali puanı,
          "reasoning": "Neden bu atın seçildiği (kısa açıklama)"
        }
      ]
    }
  ]
}

Kurallar:
1. Sadece o günün gerçek programını bulmaya çalış.
2. Eğer net program bulunamazsa, tahmini verilere dayalı genel bir analiz yap ama bunu özet kısmında belirt.
3. Her koşu için en az 1, en fazla 3 öne çıkan at ekle.
`;

export const analyzeRaces = async (city: string): Promise<DailyProgram> => {
  const today = new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
  
  const prompt = `Bugün (${today}) ${city} hipodromunda yapılacak TJK at yarışları için bülteni ve uzman tahminlerini internette ara.
  Hangi atların favori olduğunu, pist durumunu ve koşu saatlerini bul.
  Bulduğun verileri analiz ederek JSON formatında raporla.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ googleSearch: {} }],
        // responseMimeType cannot be used with googleSearch tools
      },
    });

    let text = response.text;
    if (!text) {
      throw new Error("Analiz oluşturulamadı (Boş yanıt).");
    }

    // Remove markdown code blocks if present (e.g. ```json ... ```)
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();

    let data: DailyProgram;
    try {
      data = JSON.parse(text) as DailyProgram;
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError, "Raw Text:", text);
      throw new Error("Veri formatı hatalı geldi. Lütfen tekrar deneyin.");
    }

    // Extract sources from grounding metadata if available
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = chunks
      .filter((c: any) => c.web?.uri && c.web?.title)
      .map((c: any) => ({ title: c.web.title, uri: c.web.uri }));

    // De-duplicate sources
    const uniqueSources = Array.from(new Map(sources.map((item:any) => [item.uri, item])).values());

    return {
      ...data,
      sources: uniqueSources as Array<{ title: string; uri: string }>
    };

  } catch (error) {
    console.error("Gemini Error:", error);
    throw new Error("Güncel veriler alınırken bir hata oluştu. Lütfen API anahtarını kontrol et veya daha sonra tekrar dene.");
  }
};