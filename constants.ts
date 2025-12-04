
export const PYTHON_CODE = `
# main.py
# Gereksinimler: pip install fastapi uvicorn duckduckgo-search newspaper3k google-generativeai pydantic

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from duckduckgo_search import DDGS
from newspaper import Article
import google.generativeai as genai
import json
import os

app = FastAPI(title="TJK Race Agent")

# --- YAPILANDIRMA ---
# Buraya kendi Gemini API anahtarınızı yapıştırın veya environment variable kullanın
API_KEY = os.getenv("GEMINI_API_KEY", "BURAYA_API_KEY_YAZIN")
genai.configure(api_key=API_KEY)

# Hızlı analiz için 'flash', derin analiz için 'pro' kullanabilirsiniz
model = genai.GenerativeModel('gemini-2.5-flash')

class AnalysisRequest(BaseModel):
    query: str = "bugünkü at yarışı tahminleri banko"

@app.get("/")
def home():
    return {"status": "Ajan Hazır", "docs": "/docs"}

def search_web(query):
    """DuckDuckGo kullanarak web'de arama yapar"""
    print(f"[*] Aranıyor: {query}")
    results = []
    try:
        with DDGS() as ddgs:
            # Son 5 alakalı sonucu getir
            ddg_results = list(ddgs.text(query, region='tr-tr', max_results=5))
            for r in ddg_results:
                results.append(r['href'])
    except Exception as e:
        print(f"[!] Arama hatası: {e}")
    return results

def scrape_content(urls):
    """Bulunan URL'lerin içeriğini okur"""
    contents = []
    print(f"[*] {len(urls)} site taranacak...")
    
    for url in urls:
        try:
            print(f" -> Okunuyor: {url}")
            article = Article(url)
            article.download()
            article.parse()
            # Sadece ilk 4000 karakteri al (Token tasarrufu ve hız için)
            if len(article.text) > 100:
                contents.append({
                    "source": article.title,
                    "url": url,
                    "text": article.text[:4000]
                })
        except Exception as e:
            print(f" [X] Hata ({url}): {e}")
            continue
    return contents

def analyze_with_ai(scraped_data):
    """Gemini AI ile verileri yorumlar"""
    if not scraped_data:
        return []

    print("[*] AI Analizi Başlıyor...")
    
    prompt = f"""
    Sen uzman bir at yarışı tahmincisisin. Aşağıdaki web sitesi içeriklerini analiz et.
    Amacın: Farklı yazarların ve kaynakların ORTAKLAŞTIĞI atları bulmak.
    
    GİRDİ VERİLERİ:
    {json.dumps(scraped_data, ensure_ascii=False)}
    
    GÖREV:
    1. Her koşu için en çok önerilen atı bul.
    2. 'BANKO' olarak nitelendirilen atları işaretle.
    3. Yazarların güven derecesini (1-100) tahmin et.
    
    ÇIKTI FORMATI (JSON Listesi):
    [
      {{
        "race_no": 1,
        "horse_name": "AT ADI",
        "confidence": 90,
        "type": "BANKO",
        "reason": "Fanatik ve Fotomaç yazarları hemfikir.",
        "sources": ["Kaynak1", "Kaynak2"]
      }}
    ]
    Sadece JSON döndür. Markdown kullanma.
    """
    
    try:
        response = model.generate_content(prompt, generation_config={"response_mime_type": "application/json"})
        return json.loads(response.text)
    except Exception as e:
        print(f"[!] AI Hatası: {e}")
        return []

@app.post("/analyze")
async def run_analysis(request: AnalysisRequest):
    # 1. Adım: Kaynak Keşfi
    urls = search_web(request.query)
    if not urls:
        raise HTTPException(status_code=404, detail="Güncel veri bulunamadı.")
    
    # 2. Adım: Akıllı İçerik Çekme
    raw_data = scrape_content(urls)
    if not raw_data:
        raise HTTPException(status_code=400, detail="Sitelerden içerik çekilemedi.")
    
    # 3. Adım: AI Analizi
    predictions = analyze_with_ai(raw_data)
    
    return {"status": "success", "data": predictions}

if __name__ == "__main__":
    import uvicorn
    # Sunucuyu başlat
    uvicorn.run(app, host="0.0.0.0", port=8000)
`;

export const FLUTTER_CODE = `
// main.dart
// Gereksinimler: pubspec.yaml -> http: ^1.1.0, animate_do: ^3.0.0, google_fonts: ^6.1.0

import 'package:flutter/material.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:google_fonts/google_fonts.dart';

void main() {
  runApp(const RacingApp());
}

class RacingApp extends StatelessWidget {
  const RacingApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'AI Racing Analyst',
      theme: ThemeData.dark().copyWith(
        scaffoldBackgroundColor: const Color(0xFF121212),
        primaryColor: Colors.greenAccent,
      ),
      home: const AnalysisScreen(),
    );
  }
}

class AnalysisScreen extends StatefulWidget {
  const AnalysisScreen({super.key});

  @override
  State<AnalysisScreen> createState() => _AnalysisScreenState();
}

class _AnalysisScreenState extends State<AnalysisScreen> {
  List<dynamic> _predictions = [];
  bool _loading = false;
  String _status = "Analiz için butona basın";

  // Backend URL (Emulator için 10.0.2.2, Gerçek cihaz için PC IP'si)
  final String apiUrl = "http://10.0.2.2:8000/analyze";

  Future<void> fetchAnalysis() async {
    setState(() {
      _loading = true;
      _status = "Ajan İnterneti Tarıyor...";
    });

    try {
      final response = await http.post(
        Uri.parse(apiUrl),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({"query": "bugünkü at yarışı tahminleri banko"}),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(utf8.decode(response.bodyBytes));
        setState(() {
          _predictions = data['data'];
          _status = "Analiz Tamamlandı";
        });
      } else {
        setState(() => _status = "Sunucu Hatası: \${response.statusCode}");
      }
    } catch (e) {
      setState(() => _status = "Bağlantı Hatası: \$e");
    } finally {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text("TJK AI ANALİST", style: GoogleFonts.chivoMono()),
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: true,
      ),
      body: Column(
        children: [
          // Status Monitor
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            color: Colors.black26,
            child: Row(
              children: [
                Icon(
                  _loading ? Icons.radar : Icons.check_circle, 
                  color: _loading ? Colors.green : Colors.grey
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    _status,
                    style: const TextStyle(color: Colors.greenAccent, fontFamily: 'monospace'),
                  ),
                ),
              ],
            ),
          ),
          
          // List
          Expanded(
            child: _loading 
              ? const Center(child: CircularProgressIndicator(color: Colors.greenAccent))
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: _predictions.length,
                  itemBuilder: (context, index) {
                    final item = _predictions[index];
                    return Card(
                      color: const Color(0xFF1E1E1E),
                      margin: const EdgeInsets.only(bottom: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                        side: BorderSide(
                          color: item['type'] == 'BANKO' ? Colors.green : Colors.grey[800]!,
                        )
                      ),
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  "\${item['race_no']}. KOŞU",
                                  style: const TextStyle(color: Colors.grey, fontWeight: FontWeight.bold),
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: item['type'] == 'BANKO' ? Colors.green.withOpacity(0.2) : Colors.blue.withOpacity(0.2),
                                    borderRadius: BorderRadius.circular(4),
                                  ),
                                  child: Text(
                                    item['type'],
                                    style: TextStyle(
                                      color: item['type'] == 'BANKO' ? Colors.greenAccent : Colors.blueAccent,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 12
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            Text(
                              item['horse_name'],
                              style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white),
                            ),
                            const SizedBox(height: 8),
                            LinearProgressIndicator(
                              value: (item['confidence'] ?? 50) / 100,
                              backgroundColor: Colors.grey[900],
                              valueColor: AlwaysStoppedAnimation(
                                item['type'] == 'BANKO' ? Colors.green : Colors.amber
                              ),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              item['reason'] ?? "",
                              style: const TextStyle(color: Colors.grey, fontSize: 12),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _loading ? null : fetchAnalysis,
        backgroundColor: Colors.greenAccent,
        child: const Icon(Icons.search, color: Colors.black),
      ),
    );
  }
}
`;
