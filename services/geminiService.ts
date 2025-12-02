import { GoogleGenAI } from "@google/genai";
import { DailyProgram } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `
Sen "Yarış Analiz Motoru"sun.
GÖREV: TJK Yarış Bültenini hızlıca analiz etmek.

KRİTİK HIZ KURALLARI:
1. "Bütün atları tek tek internette arama." Bu işlem zaman aşımına sebep olur.
2. Bunun yerine, o günün ve şehrin "Genel Yarış Bülteni"ni veya "Yarış Programı"nı tek bir arama ile bul.
3. Bulduğun bültendeki puanları, favorileri ve yorumları baz alarak "Power Score" üret.
4. Hızlı yanıt ver.

ÇIKTI FORMATI:
Sadece saf JSON döndür. Markdown ('''json) kullanma.

JSON ŞEMASI:
{
  "city": "Şehir",
  "date": "Gün Ay Yıl",
  "summary": "Program hakkında 1 cümlelik özet.",
  "races": [
    {
      "id": 1,
      "time": "HH:MM",
      "name": "Şart",
      "distance": "Mesafe",
      "trackType": "Pist",
      "race_summary": "Kısa teknik yorum",
      "track_surface_comment": "Pist durumu",
      "notes": "Varsa not",
      "disclaimer": "Tahmindir",
      "power_ranking": [AtNo],
      "tempo_map": { "front_runners": [], "stalkers": [], "closers": [] },
      "horses": [
         { 
           "no": 1, "name": "AT ADI", "jockey": "Jokey", "power_score": 85, 
           "risk_level": "düşük", "tempo_style": "lider", 
           "form_comment": "Son form durumu", "last_races_summary": "Son dereceler",
           "jockey_quality": "yüksek", "weight_effect": "nötr",
           "distance_surface_fit": "uygun", "workout_comment": "idman notu"
         }
      ]
    }
  ]
}
`;

export const getDailyCities = async (dateStr: string): Promise<string[]> => {
  const dateObj = new Date(dateStr);
  const formattedDate = dateObj.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
  
  const prompt = `
  TARİH: ${formattedDate}
  SORU: Bugün (${formattedDate}) Türkiye'de hangi hipodromlarda (şehirlerde) TJK at yarışı koşuluyor?
  
  Sadece Türkiye'deki şehir isimlerini içeren bir JSON dizisi (array) döndür.
  Yurt dışı yarışlarını dahil etme.
  
  Örnek Çıktı: ["İstanbul", "Adana"]
  Eğer koşu yoksa boş liste: []
  
  Sadece JSON array döndür.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.1,
      },
    });

    let text = response.text || "[]";
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const firstBracket = text.indexOf('[');
    const lastBracket = text.lastIndexOf(']');
    
    if (firstBracket !== -1 && lastBracket !== -1) {
      text = text.substring(firstBracket, lastBracket + 1);
      return JSON.parse(text);
    }
    
    return [];
  } catch (error) {
    console.error("City Discovery Error:", error);
    return [];
  }
};

export const analyzeRaces = async (city: string, dateStr: string): Promise<DailyProgram> => {
  // Format date for better search results
  const dateObj = new Date(dateStr);
  const formattedDate = dateObj.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
  
  const prompt = `
  HIZLI ANALİZ İSTEĞİ:
  TARİH: ${formattedDate}
  ŞEHİR: ${city}

  Lütfen bu tarihteki ${city} at yarışı bültenini bul.
  Programdaki tüm koşuları listele.
  Bültendeki puanlara veya favori durumlarına göre atlara "Power Score" (0-100) ver.
  
  DİKKAT: Yanıtın tamamı geçerli bir JSON olmalı. Yarım bırakma.
  "time" alanı kesinlikle "HH:MM" formatında olmalı (Örn: 14:30).
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        // Using googleSearch to find the bulletin, but the system instruction prevents deep-diving every horse
        tools: [{ googleSearch: {} }],
        temperature: 0.3, // Lower temperature for more consistent formatting
      },
    });

    let text = response.text;
    if (!text) throw new Error("Analiz oluşturulamadı.");

    // Clean markdown manually just in case
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();

    // Extract JSON substring to handle potential intro/outro text
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    
    if (firstBrace === -1 || lastBrace === -1) {
      throw new Error("JSON formatı bulunamadı.");
    }

    text = text.substring(firstBrace, lastBrace + 1);

    let data: DailyProgram;
    try {
      data = JSON.parse(text) as DailyProgram;
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError);
      // Attempt to salvage if it's a minor trailing comma issue, otherwise fail
      throw new Error("Veri işlenirken hata oluştu. Lütfen tekrar deneyin.");
    }

    // Extract sources if available
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = chunks
      .filter((c: any) => c.web?.uri && c.web?.title)
      .map((c: any) => ({ title: c.web.title, uri: c.web.uri }));

    // Deduplicate sources
    const uniqueSources = Array.from(new Map(sources.map((item:any) => [item.uri, item])).values());

    return {
      ...data,
      sources: uniqueSources as Array<{ title: string; uri: string }>
    };

  } catch (error: any) {
    console.error("Gemini Service Error:", error);
    
    // Provide a more user-friendly error message for specific cases
    if (error.message?.includes('429') || error.message?.includes('Quota')) {
      throw new Error("Çok fazla istek yapıldı. Lütfen biraz bekleyin.");
    }
    if (error.message?.includes('xhr') || error.message?.includes('Rpc')) {
      throw new Error("Bağlantı zaman aşımına uğradı. İnternetinizi kontrol edip tekrar deneyin.");
    }

    throw new Error(error.message || "Veriler alınırken beklenmedik bir hata oluştu.");
  }
};