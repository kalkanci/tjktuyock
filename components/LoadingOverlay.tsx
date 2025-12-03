import React, { useState, useEffect } from 'react';
import { Loader2, Server, Database, Search, CheckCircle2 } from 'lucide-react';

export type LoadingType = 'cities' | 'analysis' | 'results' | null;

interface LoadingOverlayProps {
  type: LoadingType;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ type }) => {
  const [logLines, setLogLines] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(0);

  // Basit liste çekimi için kısa adımlar
  const analysisSteps = [
    "TJK.org Resmi Veritabanına Bağlanılıyor...",
    "Günlük Yarış Programı İndiriliyor...",
    "At ve Jokey Listeleri Düzenleniyor...",
    "Liste Hazırlanıyor..."
  ];

  const citySteps = [
    "Tarih Bilgisi Doğrulanıyor...",
    "Aktif Hipodromlar Sorgulanıyor..."
  ];

  const resultSteps = [
    "Sonuç Servisine Bağlanılıyor...",
    "Resmi Sonuçlar Doğrulanıyor..."
  ];

  useEffect(() => {
    if (!type) {
      setLogLines([]);
      setCurrentStep(0);
      return;
    }

    let steps = analysisSteps;
    if (type === 'cities') steps = citySteps;
    if (type === 'results') steps = resultSteps;

    // Reset
    setLogLines([steps[0]]);
    setCurrentStep(0);

    // Initial fetch is much faster now (approx 4 sec)
    const totalDuration = type === 'analysis' ? 4000 : 3000; 
    const stepDuration = totalDuration / steps.length;

    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        const next = prev + 1;
        if (next < steps.length) {
          setLogLines(old => [...old.slice(-3), steps[next]]); 
          return next;
        }
        return prev;
      });
    }, stepDuration);

    return () => clearInterval(interval);
  }, [type]);

  if (!type) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-fade-in font-mono">
      <div className="bg-racing-900 border border-racing-700 rounded-xl max-w-md w-full shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="bg-racing-950 p-4 border-b border-racing-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="relative">
               <div className="absolute inset-0 bg-racing-accent/50 blur-lg rounded-full animate-pulse"></div>
               <Loader2 className="w-5 h-5 text-racing-accent animate-spin relative z-10" />
             </div>
             <span className="text-white font-bold text-sm tracking-wider">VERİ AKTARIMI</span>
          </div>
        </div>

        {/* Console View */}
        <div className="p-6 bg-black/50 min-h-[150px] flex flex-col justify-end space-y-3 font-mono text-xs">
           {logLines.map((line, idx) => (
             <div key={idx} className="flex items-center gap-3 animate-slide-up text-gray-300">
                {idx === logLines.length - 1 ? (
                  <Search size={14} className="text-racing-gold shrink-0 animate-pulse" />
                ) : (
                  <CheckCircle2 size={14} className="text-racing-accent shrink-0" />
                )}
                <span className={idx === logLines.length - 1 ? "text-white font-bold" : "opacity-70"}>
                  {line}
                </span>
             </div>
           ))}
           {/* Fake Cursor */}
           <div className="h-4 flex items-center gap-2">
             <span className="text-racing-accent">{'>'}</span>
             <span className="w-2 h-4 bg-racing-accent animate-pulse"></span>
           </div>
        </div>
      </div>
    </div>
  );
};