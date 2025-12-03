import React from 'react';
import { X, Trophy, Share2, Wallet, Wand2 } from 'lucide-react';
import { Coupon } from '../types';

interface CouponModalProps {
  isOpen: boolean;
  onClose: () => void;
  coupon: Coupon | null;
  cityName: string;
}

export const CouponModal: React.FC<CouponModalProps> = ({ isOpen, onClose, coupon, cityName }) => {
  if (!isOpen || !coupon) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-md bg-white text-gray-900 rounded-2xl overflow-hidden shadow-2xl animate-fade-in-up transform transition-all">
        
        {/* Header */}
        <div className="bg-racing-900 text-white p-4 flex justify-between items-center border-b-4 border-racing-gold">
          <div className="flex items-center gap-2">
            <div className="bg-racing-gold p-1.5 rounded-lg text-racing-900">
              <Wand2 size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">AI Hazır Kupon</h3>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">{cityName} - Altılı Ganyan</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Coupon Body */}
        <div className="p-1 bg-gray-100">
          <div className="bg-white border border-gray-300 rounded-xl shadow-sm overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-[3rem_1fr] bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
              <div className="p-3 text-center border-r border-gray-200">Ayak</div>
              <div className="p-3">Atlar</div>
            </div>

            {/* Rows */}
            {coupon.legs.map((leg, index) => (
              <div key={index} className="grid grid-cols-[3rem_1fr] border-b border-gray-100 last:border-0 group hover:bg-gray-50 transition-colors">
                <div className="p-3 flex items-center justify-center border-r border-gray-100 font-mono font-bold text-gray-400 text-sm group-hover:text-racing-900">
                  {index + 1}.
                </div>
                <div className="p-3 flex items-center flex-wrap gap-2">
                  {leg.isBanko ? (
                    <div className="flex items-center gap-2 w-full">
                       <span className="flex items-center justify-center w-8 h-8 rounded-full bg-racing-900 text-racing-gold font-bold text-sm shadow-md ring-2 ring-racing-gold/50">
                         {leg.selectedHorses[0]}
                       </span>
                       <span className="text-xs font-bold text-racing-900 uppercase tracking-wide bg-racing-gold/20 px-2 py-1 rounded text-racing-900/80">
                         Banko
                       </span>
                    </div>
                  ) : (
                    leg.selectedHorses.map((horseNo) => (
                      <span 
                        key={horseNo}
                        className="flex items-center justify-center w-7 h-7 rounded-full bg-gray-200 text-gray-700 font-bold text-xs border border-gray-300"
                      >
                        {horseNo}
                      </span>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer / Stats */}
        <div className="bg-gray-50 p-4 border-t border-gray-200">
          <div className="flex justify-between items-center mb-4">
             <div className="flex flex-col">
                <span className="text-xs text-gray-500 font-medium">Kombinasyon</span>
                <span className="text-lg font-bold text-gray-800 font-mono">{coupon.totalCombinations}</span>
             </div>
             <div className="flex flex-col items-end">
                <span className="text-xs text-gray-500 font-medium">Tahmini Tutar</span>
                <span className="text-xl font-bold text-racing-accent font-mono flex items-center gap-1">
                   <Wallet size={16} />
                   {(coupon.estimatedCost).toFixed(2)} TL
                </span>
             </div>
          </div>
          
          <button className="w-full bg-racing-900 text-white font-bold py-3 rounded-xl shadow-lg hover:bg-racing-800 active:scale-95 transition-all flex items-center justify-center gap-2">
            <Share2 size={18} />
            Kuponu Paylaş / Kaydet
          </button>
          <p className="text-[10px] text-center text-gray-400 mt-2">
             Bu kupon yapay zeka analizlerine dayalı bir tahmindir. Kesinlik içermez.
          </p>
        </div>
      </div>
    </div>
  );
};