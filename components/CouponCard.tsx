
import React from 'react';
import { Ticket, Info } from 'lucide-react';

interface CouponCardProps {
  legs: number[][]; 
  city: string;
}

export const CouponCard: React.FC<CouponCardProps> = ({ legs, city }) => {
  // Tutar Hesabı
  const combinationCount = legs.reduce((acc, leg) => acc * (leg.length || 1), 1);
  const unitPrice = 0.50; 
  const totalCost = (combinationCount * unitPrice).toFixed(2);

  return (
    <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-700 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-5">
        <Ticket size={120} />
      </div>

      <div className="flex justify-between items-center mb-6 relative z-10">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Ticket className="text-green-500" size={20} />
            Sistem Kuponu
          </h2>
          <p className="text-xs text-gray-400 uppercase tracking-widest">{city}</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-black text-green-400 tracking-tighter">₺{totalCost}</div>
          <div className="text-[10px] text-gray-500">Tahmini Tutar</div>
        </div>
      </div>

      <div className="flex gap-1 relative z-10 overflow-x-auto pb-2 no-scrollbar">
        {legs.map((leg, index) => (
          <div key={index} className="flex flex-col items-center flex-1 min-w-[50px]">
            <div className="text-[9px] text-gray-500 font-bold mb-1">{index + 1}.AYAK</div>
            <div className={`
              w-full py-3 rounded-lg flex flex-col items-center justify-start gap-1 min-h-[80px] border
              ${leg.length === 1 
                ? 'bg-green-900/20 border-green-900/50 shadow-[0_0_10px_rgba(34,197,94,0.1)]' 
                : 'bg-gray-800/40 border-gray-700'}
            `}>
              {leg.length > 0 ? (
                leg.map((horseNo) => (
                  <span key={horseNo} className={`
                    font-black text-sm
                    ${leg.length === 1 ? 'text-green-400 text-lg' : 'text-white'}
                  `}>
                    {horseNo}
                  </span>
                ))
              ) : (
                <span className="text-gray-600 text-xs">-</span>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-2 flex gap-2 text-[10px] text-gray-500 items-center justify-center bg-gray-900/50 py-2 rounded-lg">
        <Info size={12} />
        <span>Kalan koşulara göre otomatik oluşturulmuştur.</span>
      </div>
    </div>
  );
};
