import { DailyProgram, Race, Coupon, CouponLeg, BetType } from "../types";

const UNIT_PRICE = 0.50; // TJK Birim Fiyatı (Varsayılan)

/**
 * Belirtilen Bahis Türüne göre otomatik kupon oluşturur.
 */
export const generateAdvancedCoupon = (
  program: DailyProgram, 
  betType: BetType, 
  startRaceIndex: number = 0, // Altılı/Beşli için başlangıç (0-based index of program.races)
  targetRaceId: number = 0 // Tek koşuluk oyunlar için
): Coupon | null => {
  
  if (!program.races || program.races.length === 0) return null;

  let legs: CouponLeg[] = [];
  let combinations = 1;

  // --- ÇOK AYAKLI OYUNLAR ---
  if (['6G', '5G', '4G', '3G'].includes(betType)) {
    let legCount = 6;
    if (betType === '5G') legCount = 5;
    if (betType === '4G') legCount = 4;
    if (betType === '3G') legCount = 3;

    // Yeterli koşu var mı kontrol et
    if (program.races.length < startRaceIndex + legCount) {
      return null; // Yeterli koşu yok
    }

    const targetRaces = program.races.slice(startRaceIndex, startRaceIndex + legCount);

    legs = targetRaces.map((race) => {
      const sortedHorses = [...race.horses].sort((a, b) => b.power_score - a.power_score);
      
      let selectedHorses: number[] = [];
      let isBanko = false;

      // Basit Mantık:
      // Banko: Puanı 90+ ve farkı 10+
      if (sortedHorses[0].power_score > 90 && (sortedHorses.length < 2 || (sortedHorses[0].power_score - sortedHorses[1].power_score > 10))) {
        selectedHorses = [sortedHorses[0].no];
        isBanko = true;
      } else if (sortedHorses[0].power_score > 85) {
        // Güçlü favori ama yanına 1-2 at
        selectedHorses = sortedHorses.slice(0, 3).map(h => h.no);
      } else {
        // Karışık ayak, 4-5 at
        selectedHorses = sortedHorses.slice(0, 5).map(h => h.no);
      }

      return {
        raceId: race.id,
        raceNo: race.id,
        selectedHorses: selectedHorses.sort((a, b) => a - b),
        isBanko
      };
    });
    
    combinations = legs.reduce((acc, leg) => acc * leg.selectedHorses.length, 1);
  }

  // --- TEK KOŞULUK OYUNLAR ---
  else {
    const race = program.races.find(r => r.id === targetRaceId);
    if (!race) return null;
    
    const sortedHorses = [...race.horses].sort((a, b) => b.power_score - a.power_score);
    
    // IKILI & SIRALI: İlk 2-3 atı seçer
    if (betType === 'IKILI' || betType === 'SIRALI' || betType === 'CIFTE') {
        // En güçlü 3 atı seçip kombinasyon yapalım
        const top3 = sortedHorses.slice(0, 3).map(h => h.no).sort((a,b) => a-b);
        legs = [{
            raceId: race.id,
            raceNo: race.id,
            selectedHorses: top3,
            isBanko: false
        }];
        // Kombinasyon hesabı yaklaşık: 3 atın ikili kombinasyonu 3'tür.
        combinations = 3; 
    }
    // TABELA (İlk 4): İlk 5-6 atı seçer
    else if (betType === 'TABELA') {
        const top5 = sortedHorses.slice(0, 5).map(h => h.no).sort((a,b) => a-b);
        legs = [{
            raceId: race.id,
            raceNo: race.id,
            selectedHorses: top5,
            isBanko: false
        }];
        // 5 atlı tabela kombinasyonu (sırasız kabul edersek basitleştirme)
        combinations = 5; // Temsili
    }
  }

  return {
    type: betType,
    legs,
    totalCombinations: combinations,
    estimatedCost: combinations * UNIT_PRICE,
    strategy: 'dengeli',
    raceIndexStart: startRaceIndex,
    targetRaceId: targetRaceId
  };
};