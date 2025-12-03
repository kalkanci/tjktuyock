import React, { useState, useEffect } from 'react';
import { Loader2, Server, Globe, Cpu } from 'lucide-react';

export type LoadingType = 'cities' | 'analysis' | 'results' | null;

interface LoadingOverlayProps {
  type: LoadingType;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ type }) => {
  const [messageIndex, setMessageIndex] = useState(0);

  // Deep Scan Steps
  const steps: Record<string, string[]> = {
    cities: [
      "TJK.org yarış takvimi kontrol ediliyor...",
      "Güncel hipodrom bilgileri alınıyor...",
    ],
    analysis: [
      "Resmi TJK bülteni taranıyor (Bu işlem detaylıdır)...",
      "Tüm koşular (1-10) tek tek inceleniyor...",
      "Atların güncel form durumları ve jokey bilgileri çekiliyor...",
      "İnternet üzerindeki uzman yorumları analiz ediliyor...",
      "Yapay zeka puanlaması ve risk hesabı yapılıyor...",
      "Son kontroller sağlanıyor, lütfen bekleyin..."
    ],
    results: [
      "Sonuç veritabanına bağlanılıyor...",
      "Resmi sonuçlar doğrulanıyor...",
      "Tablo oluşturuluyor..."
    ]
  };

  useEffect(() => {
    if (!type) return;
    setMessageIndex(0);

    // Mesaj geçiş süresini biraz uzattık (3 saniye) çünkü işlem uzun sürebilir
    const interval = setInterval(() => {
      setMessageIndex((prev) => {
        const max = steps[type].length - 1;
        return prev < max ? prev + 1 : prev;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [type]);

  if (!type) return null;

  const currentMessages = steps[type];
  const activeMessage = currentMessages[messageIndex];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-racing-900 border border-racing-700 rounded-2xl p-8 max-w-sm w-full shadow-2xl relative overflow-hidden">
        
        {/* Background Accents */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-racing-accent/10 rounded-full -mr-20 -mt-20 blur-2xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-600/10 rounded-full -ml-16 -mb-16 blur-2xl animate-pulse"></div>

        <div className="flex flex-col items-center text-center relative z-10">
          
          {/* Animated Icon */}
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-racing-accent/20 rounded-full blur-xl animate-pulse"></div>
            <div className="bg-black p-5 rounded-full border border-racing-600 relative shadow-inner">
              <Loader2 className="w-10 h-10 text-racing-accent animate-spin duration-1000" />
            </div>
            
            <div className="absolute -right-2 -top-2 bg-racing-800 p-1.5 rounded-full border border-racing-700 text-racing-gold animate-bounce" style={{ animationDelay: '0.5s' }}>
              <Globe size={14} />
            </div>
            <div className="absolute -left-2 -bottom-2 bg-racing-800 p-1.5 rounded-full border border-racing-700 text-blue-400 animate-bounce" style={{ animationDelay: '1s' }}>
              <Server size={14} />
            </div>
          </div>

          <h3 className="text-xl font-bold text-white mb-2">Detaylı Tarama Yapılıyor</h3>
          
          {/* Dynamic Message Area */}
          <div className="h-14 flex items-center justify-center w-full px-2">
            <p className="text-sm text-gray-300 font-mono leading-relaxed">
              {activeMessage}
            </p>
          </div>

          {/* Progress Bar Simulation */}
          <div className="w-full bg-racing-950 h-2 rounded-full mt-6 overflow-hidden border border-racing-800">
            <div 
              className="h-full bg-gradient-to-r from-racing-accent via-blue-500 to-racing-accent bg-[length:200%_100%] animate-[shimmer_2s_infinite]"
              style={{ width: `${((messageIndex + 1) / currentMessages.length) * 100}%` }}
            ></div>
          </div>
          
          <div className="mt-5 flex items-center gap-2 text-[10px] text-gray-500 uppercase tracking-widest border px-3 py-1 rounded-full border-racing-800 bg-racing-950/50">
            <Cpu size={12} />
            <span>Gerçek Veri Modu Aktif</span>
          </div>

        </div>
      </div>
      
      {/* Global Style for shimmer animation if not present */}
      <style>{`
        @keyframes shimmer {
          0% { background-position: 100% 0; }
          100% { background-position: -100% 0; }
        }
      `}</style>
    </div>
  );
};