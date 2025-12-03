import { GoogleGenAI } from "@google/genai";
import { DailyProgram } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const modelId = "gemini-2.5-flash";

const COMMON_CONFIG = {
  temperature: 0.3, // Daha tutarlı ve gerçekçi veriler için düşük sıcaklık
  topK: 40,
  topP: 0.95,
};

// Yardımcı Fonksiyon: JSON temizleme ve çıkarma
const cleanJsonString = (str: string) => {
  let cleaned = str.replace(/```json/g, '').replace(/```/g, '').trim();
  
  // JSON başlangıç ve bitiş karakterlerini bul
  const firstBrace = cleaned.indexOf('{');
  const firstBracket = cleaned.indexOf('[');
  
  // Hangisi önce geliyorsa onu başlangıç noktası al (Array veya Object)
  let start = -1;
  if (firstBrace !== -1 && firstBracket !== -1) {
    start = Math.min(firstBrace, firstBracket);
  } else if (firstBrace !== -1) {
    start = firstBrace;
  } else {
    start = firstBracket;
  }

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
    const prompt = `
    Bugün (${dateStr}) Türkiye'de hangi şehirlerde at yarışı (TJK) programı var?
    
    Lütfen sadece şehir isimlerini içeren bir JSON dizisi döndür.
    Örnek: ["İstanbul", "Adana"]
    Eğer program yoksa [] döndür.
    SADECE JSON DÖNDÜR, BAŞKA METİN YAZMA.
    `;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        ...COMMON_CONFIG,
        tools: [{ googleSearch: {} }]
      }
    });

    if (response.text) {
      const parsed = JSON.parse(cleanJsonString(response.text));
      // Dizi olduğundan emin ol
      return Array.isArray(parsed) ? parsed : [];
    }
    return [];
  } catch (error) {
    console.error("Şehirler alınırken hata:", error);
    return [];
  }
};

export const analyzeRaces = async (city: string, dateStr: string): Promise<DailyProgram> => {
  const prompt = `
  SEN UZMAN BİR AT YARIŞI ANALİSTİSİN.
  
  GÖREV: ${dateStr} tarihinde ${city} hipodromundaki yarış programını detaylı analiz et.
  
  KAYNAKLAR:
  - Google Search aracını kullanarak TJK.org resmi programını, "Liderform", "Fanatik", "Nalkapon" ve "Yarış Dergisi" gibi kaynakları tara.
  - Güncel AGF (Altılı Ganyan Favorisi) tablolarını bulmaya çalış.

  KURALLAR (KESİN UYULACAK):
  1. **ASLA "Bilinmiyor", "Unknown" veya "X" YAZMA.** Bir veriyi bulamıyorsan, tahmin etme, o alanı boş bırak veya bağlama en uygun teknik terimi kullan.
  2. **Koşu İsimleri:** Eğer özel bir isim (Örn: Çaldıran Koşusu) yoksa, teknik şartı yaz (Örn: "Maiden", "Şartlı-4", "Handikap-15"). Bunu atların yaş ve kazançlarından çıkarabilirsin.
  3. **Güç Puanı (Power Score):** 
     - Favori atlara (AGF oranı yüksek veya yazarların ilk atı) 85-99 arası puan ver.
     - Plase atlara 70-84 arası puan ver.
     - Sürpriz atlara 40-69 arası puan ver.
     - Puanlar tutarlı olmalı, rastgele olmamalı.
  4. **Risk Seviyesi:** Favori çok netse "düşük", yarış denkse "yüksek" risk yaz.
  
  İSTENEN JSON FORMATI:
  {
    "city": "${city}",
    "date": "${dateStr}",
    "summary": "Programın genel değerlendirmesi (pist durumu, hava durumu, günün en sağlam kalesi vb.)",
    "sources": [ { "title": "Kaynak Adı", "uri": "Link" } ],
    "races": [
      {
        "id": 1,
        "time": "13:30",
        "name": "Şartlı 3 / Dişi",
        "distance": "1400m",
        "trackType": "Kum",
        "race_summary": "Yarışın kısa taktik analizi.",
        "horses": [
          {
            "no": 1,
            "name": "BOLD PILOT",
            "jockey": "H.KARATAŞ",
            "weight": "60",
            "power_score": 95,
            "risk_level": "düşük"
          }
          // Diğer atlar... (En az 6-7 at ekle)
        ]
      }
      // Diğer koşular...
    ]
  }
  
  SADECE JSON DÖNDÜR. MARKDOWN VEYA AÇIKLAMA EKLEME.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        ...COMMON_CONFIG,
        tools: [{ googleSearch: {} }]
      }
    });

    if (!response.text) throw new Error("Veri alınamadı");

    const data = JSON.parse(cleanJsonString(response.text));
    
    // races dizisinin varlığını garanti et
    if (!Array.isArray(data.races)) {
      data.races = [];
    }

    // Grounding metadata'dan kaynakları ekle (varsa)
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const webSources = chunks
      .filter((c: any) => c.web?.uri && c.web?.title)
      .map((c: any) => ({ title: c.web.title, uri: c.web.uri }));
    
    if (webSources.length > 0) {
      data.sources = webSources.slice(0, 5); // İlk 5 kaynağı al
    }

    return data;
  } catch (error) {
    console.error("Analiz hatası:", error);
    throw new Error("Yarış verileri analiz edilirken bir sorun oluştu. Lütfen tekrar deneyin.");
  }
};

export const getRaceResults = async (city: string, dateStr: string): Promise<DailyProgram> => {
  const prompt = `
  GÖREV: ${dateStr} tarihinde ${city} hipodromunda koşulan yarışların RESMİ SONUÇLARINI getir.
  
  Arama Terimleri: "TJK ${dateStr} ${city} sonuçları", "${city} at yarışı sonuçları ${dateStr}".
  
  KURALLAR:
  1. Sadece koşulmuş ve sonucu kesinleşmiş yarışları getir.
  2. **Ganyan:** Kazanan atın ganyanını mutlaka bul (Örn: "3.45"). Bulamazsan "-" yaz ama "Bilinmiyor" yazma.
  3. **Sıralama:** Her koşunun ilk 4 atını doğru sırayla getir.
  4. **Derece:** Bitiriş derecesini (Örn: "1.24.56") bulmaya çalış.
  
  İSTENEN JSON FORMATI:
  (DailyProgram interface yapısına uygun olmalı, horses dizisi içinde finish_time, ganyan, ve difference alanlarını doldur. power_score yerine 0 verebilirsin.)
  
  Örnek At Obj:
  {
    "no": 1, // Bitiriş sırası değil, atın numarası
    "name": "AT ADI",
    "jockey": "JOKEY ADI",
    "finish_time": "1.35.22",
    "ganyan": "4.25",
    "power_score": 0
  }
  
  SADECE JSON DÖNDÜR. MARKDOWN VEYA AÇIKLAMA EKLEME.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        ...COMMON_CONFIG,
        tools: [{ googleSearch: {} }]
      }
    });

    if (!response.text) throw new Error("Sonuç verisi alınamadı");
    
    const data = JSON.parse(cleanJsonString(response.text));
    
    // races dizisinin varlığını garanti et
    if (!Array.isArray(data.races)) {
      data.races = [];
    }
    
    // Kaynakları ekle
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const webSources = chunks
      .filter((c: any) => c.web?.uri && c.web?.title)
      .map((c: any) => ({ title: c.web.title, uri: c.web.uri }));
    
    if (webSources.length > 0) {
      data.sources = webSources.slice(0, 5);
    }

    return data;
  } catch (error) {
    console.error("Sonuç hatası:", error);
    throw new Error("Sonuçlar alınırken hata oluştu.");
  }
};
