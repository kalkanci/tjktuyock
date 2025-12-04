
import { GoogleGenAI } from "@google/genai";
import { Race, AgentLog } from "../types";

export const runAutonomousAgent = async (
  onLog: (log: AgentLog) => void
): Promise<Race[]> => {
  
  const log = (msg: string, type: 'info' | 'success' | 'warning' = 'info') => {
    onLog({
      id: Date.now(),
      message: msg,
      timestamp: new Date().toLocaleTimeString(),
      type
    });
  };

  // Vercel veya yerel .env dosyasından okur
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    throw new Error("API Anahtarı bulunamadı. Lütfen Vercel Environment Variables ayarlarını kontrol edin.");
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    log("Ajan başlatıldı. Gemini 2.5 Flash motoruna bağlanılıyor...", "info");
    
    const today = new Date();
    const dateStr = today.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
    const timeStr = today.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

    log(`Tarih: ${dateStr}, Saat: ${timeStr}. Yarış programı ve kesin sonuçlar taranıyor...`, "warning");

    const model = 'gemini-2.5-flash';
    
    const prompt = `
      Sen uzman bir at yarışı analistisin. Şu anki Tarih ve Saat: ${dateStr} ${timeStr}.
      
      GÖREV:
      Bugün Türkiye'de (TJK) koşulan yarışları analiz et. 
      
      KRİTİK KURAL (ÇOK ÖNEMLİ):
      - Şu an saat ${timeStr}. 
      - Saati henüz gelmemiş veya yeni geçmiş ama sonuçlanmamış koşular için KESİNLİKLE sonuç uydurma. Simülasyon yapma.
      - Gelecek koşuların durumu "PENDING" olmalı.
      - Sadece resmi sonuçları açıklanmış koşular için "FINISHED" işaretle ve kazananı yaz.
      
      BEKLENEN ANALİZ DETAYLARI:
      1. **Zaman Kontrolü:** Her koşunun saatini kontrol et. Eğer Koşu Saati > ${timeStr} ise sonuç verisi BOŞ olmalı.
      2. **Sonuç Analizi:** Sadece geçmiş koşular için Google Search ile "TJK sonuçları"nı arayarak kazananı bul. Bulamazsan boş bırak.
      3. **Bahis Önerileri:** Her koşu için (Geçmiş veya Gelecek) mantıklı "İkili", "Çifte", "Sıralı İkili" önerileri ver.
      
      ÇIKTI FORMATI (JSON):
      Yanıtını SADECE aşağıdaki JSON şemasına uygun bir dizi olarak döndür.
      
      [
        {
          "city": "İstanbul",
          "race_no": 1,
          "time": "13:30",
          "status": "FINISHED", // Veya "PENDING" (Gelecekse) veya "RUNNING" (Şu an koşuluyorsa)
          "actual_winner_no": 5, // Sadece status=FINISHED ise ve KESİN SONUÇ varsa. Yoksa null/undefined.
          "result_summary": "5 numara kazandı.", // Sadece finished ise.
          "success_rate": "MISS", 
          "runners": [
             { "horse_no": 1, "horse_name": "BOLD PILOT", "is_banko": true, "is_surprise": false, "confidence": 95, "reason": "Çok formda." }
          ],
          "bets": [
             { "type": "İKİLİ", "combination": "1/2", "confidence": 80 }
          ]
        }
      ]
    `;

    log("Koşu saatleri ve sonuçlar kontrol ediliyor...", "warning");

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      }
    });

    log("Veriler işleniyor...", "info");

    let jsonText = response.text;
    if (!jsonText) throw new Error("Model boş yanıt döndürdü.");

    // Cleanup: Find the JSON array part
    const startIndex = jsonText.indexOf('[');
    const endIndex = jsonText.lastIndexOf(']');
    
    if (startIndex !== -1 && endIndex !== -1) {
        jsonText = jsonText.substring(startIndex, endIndex + 1);
    } else {
        // Fallback cleanup
        jsonText = jsonText.replace(/```json/g, '').replace(/```/g, '').trim();
    }

    let races: Race[];
    try {
        races = JSON.parse(jsonText);
    } catch (e) {
        console.error("JSON Parse Hatası:", jsonText);
        throw new Error("Veri formatı hatalı geldi. AI yanıtı JSON değildi.");
    }
    
    // Validate
    if (!Array.isArray(races)) throw new Error("Beklenen format gelmedi.");

    // POST-PROCESSING: Strict Time Validation
    // AI bazen halüsinasyon görebilir, bu yüzden saat kontrolünü manuel olarak zorluyoruz.
    log("Veri doğrulama ve zaman senkronizasyonu yapılıyor...", "info");
    
    const nowCheck = new Date();
    
    races = races.map(race => {
      // Saat formatı "HH:mm" varsayılıyor
      try {
        const [hours, minutes] = race.time.split(':').map(Number);
        const raceDate = new Date(nowCheck);
        raceDate.setHours(hours, minutes, 0, 0);

        // Eğer koşu saati şu andan ilerideyse, kesinlikle PENDING olmalı
        // 5 dakika tolerans (sonuçların açıklanması için) ekleyelim, yani koşu saati + 5dk > şimdi ise sonuç olmamalı
        const toleranceTime = new Date(raceDate.getTime() + 5 * 60000);

        if (raceDate > nowCheck) {
           return {
             ...race,
             status: 'PENDING',
             actual_winner_no: undefined,
             result_summary: undefined,
             success_rate: undefined
           };
        }
      } catch (e) {
        console.warn("Saat formatı ayrıştırılamadı:", race.time);
      }
      return race;
    });

    // Extract sources
    const sources: string[] = [];
    if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
      response.candidates[0].groundingMetadata.groundingChunks.forEach(chunk => {
        if (chunk.web?.uri) {
          sources.push(chunk.web.uri);
        }
      });
    }
    const uniqueSources = Array.from(new Set(sources));
    
    if (uniqueSources.length > 0) {
      races.forEach(race => {
        race.sources = uniqueSources;
      });
    }

    log(`Analiz tamamlandı. ${races.length} koşu listelendi.`, "success");
    
    return races.sort((a, b) => {
        if (a.city === b.city) {
            return a.race_no - b.race_no;
        }
        return a.city.localeCompare(b.city);
    });

  } catch (error: any) {
    console.error("Agent Error:", error);
    log(`HATA: ${error.message}`, "warning");
    throw error;
  }
};
