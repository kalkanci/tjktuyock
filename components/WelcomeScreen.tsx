import React from 'react';
import { Trophy, TrendingUp, Cpu, ChevronRight } from 'lucide-react';

interface WelcomeScreenProps {
  onStart: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStart }) => {
  return (
    <div className="fixed inset-0 bg-racing-950 flex flex-col items-center justify-center p-6 text-center z-[100] overflow-hidden">
      
      {/* Background Effects */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-blue-600/10 rounded-full blur-[100px] animate-pulse"></div>
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-indigo-600/10 rounded-full blur-[100px] animate-pulse" style={{animationDelay: '1s'}}></div>
      
      <div className="relative z-10 max-w-md w-full flex flex-col items-center">
        
        <div className="mb-10 relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-racing-gold to-yellow-600 rounded-full blur-xl opacity-20"></div>
          <div className="w-24 h-24 bg-gradient-to-br from-racing-800 to-racing-900 rounded-3xl border border-racing-700 shadow-2xl flex items-center justify-center relative transform hover:scale-105 transition-transform duration-300">
             <Trophy size={40} className="text-racing-gold" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-white mb-3 tracking-tight">
          TJK <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Analiz AI</span>
        </h1>
        
        <p className="text-gray-400 text-sm leading-relaxed mb-12 max-w-xs mx-auto">
          Yapay zeka destekli at yarışı analiz, bülten ve kupon tahmin platformu.
        </p>

        <div className="grid grid-cols-2 gap-4 w-full mb-12">
           <div className="bg-racing-900/50 p-4 rounded-2xl border border-racing-800/50 backdrop-blur-sm">
              <Cpu className="text-blue-400 mb-2 mx-auto" size={20} />
              <div className="text-xs font-bold text-gray-200">AI Analiz</div>
           </div>
           <div className="bg-racing-900/50 p-4 rounded-2xl border border-racing-800/50 backdrop-blur-sm">
              <TrendingUp className="text-racing-accent mb-2 mx-auto" size={20} />
              <div className="text-xs font-bold text-gray-200">Akıllı Tahmin</div>
           </div>
        </div>

        <button 
          onClick={onStart}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-900/30 flex items-center justify-center gap-2 group transition-all active:scale-95"
        >
          <span>Analize Başla</span>
          <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
};