import React, { useState, useEffect } from 'react';
import { Loader2, Server, Globe, Cpu } from 'lucide-react';

export type LoadingType = 'cities' | 'analysis' | 'results' | null;

interface LoadingOverlayProps {
  type: LoadingType;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ type }) => {
  const [messageIndex, setMessageIndex] = useState(0);

  // Define steps for each operation type to simulate detailed progress
  const steps: Record<string, string[]> = {
    cities: [
      "TJK.org sunucularına bağlanılıyor...",
      "Güncel yarış takvimi taranıyor...",
      "Hipodrom bilgileri alınıyor...",
      "Şehir listesi hazırlanıyor..."
    ],
    analysis: [
      "TJK.org resmi bülteni çekiliyor...",
      "Popüler yarış siteleri taranıyor (Fanatik, Liderform, Nalkapon)...",
      "Yazar yorumları ve tahminler toplanıyor...",
      "Galoplar ve geçmiş dereceler işleniyor...",
      "Yapay zeka puanlaması yapılıyor...",
      "Risk analizi tamamlanıyor..."
    ],
    results: [
      "TJK Sonuç veritabanına erişiliyor...",
      "Resmi sonuçlar ve ganyanlar alınıyor...",
      "Foto-finiş verileri işleniyor...",
      "Tablo oluşturuluyor..."
    ]
  };

  useEffect(() => {
    if (!type) return;
    setMessageIndex(0);

    const interval = setInterval(() => {
      setMessageIndex((prev) => {
        const max = steps[type].length - 1;
        return prev < max ? prev + 1 : prev;
      });
    }, 2000); // Change message every 2 seconds

    return () => clearInterval(interval);
  }, [type]);

  if (!type) return null;

  const currentMessages = steps[type];
  const activeMessage = currentMessages[messageIndex];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-racing-800 border border-racing-700 rounded-2xl p-8 max-w-sm w-full shadow-2xl relative overflow-hidden">
        
        {/* Background Accents */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-racing-accent/10 rounded-full -mr-16 -mt-16 blur-xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-racing-gold/10 rounded-full -ml-12 -mb-12 blur-xl animate-pulse"></div>

        <div className="flex flex-col items-center text-center relative z-10">
          
          {/* Animated Icon */}
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-racing-accent/20 rounded-full blur-lg animate-pulse"></div>
            <div className="bg-racing-900 p-4 rounded-full border border-racing-600 relative">
              <Loader2 className="w-10 h-10 text-racing-accent animate-spin" />
            </div>
            {/* Small status icons */}
            <div className="absolute -right-2 -top-2 bg-racing-800 p-1.5 rounded-full border border-racing-700 text-racing-gold">
              <Globe size={12} />
            </div>
            <div className="absolute -left-2 -bottom-2 bg-racing-800 p-1.5 rounded-full border border-racing-700 text-blue-400">
              <Server size={12} />
            </div>
          </div>

          <h3 className="text-xl font-bold text-white mb-2">Veriler İşleniyor</h3>
          
          {/* Dynamic Message Area */}
          <div className="h-12 flex items-center justify-center w-full">
            <p className="text-sm text-gray-300 font-mono animate-pulse">
              {activeMessage}
            </p>
          </div>

          {/* Progress Bar Simulation */}
          <div className="w-full bg-racing-900 h-1.5 rounded-full mt-6 overflow-hidden border border-racing-700">
            <div 
              className="h-full bg-gradient-to-r from-racing-accent to-blue-500 transition-all duration-500 ease-out"
              style={{ width: `${((messageIndex + 1) / currentMessages.length) * 100}%` }}
            ></div>
          </div>
          
          <div className="mt-4 flex items-center gap-2 text-[10px] text-gray-500 uppercase tracking-widest">
            <Cpu size={12} />
            <span>AI Processing Node</span>
          </div>

        </div>
      </div>
    </div>
  );
};