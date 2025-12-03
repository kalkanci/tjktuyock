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

  const races = program.races;

  // --- ÇOK AYAKLI OYUNLAR (6G, 5G vb.) ---
  if (['6G', '5G', '4G', '3G'].includes(betType)) {
    let legCount = 6;
    if (betType === '5G') legCount = 5;
    if (betType === '4G') legCount = 4;
    if (betType === '3G') legCount = 3;

    if (races.length < startRaceIndex + legCount) {
      legCount = Math.min(legCount, races.length - startRaceIndex);
    }

    const targetRaces = races.slice(startRaceIndex, startRaceIndex + legCount);

    legs = targetRaces.map((race) => {
      // 1. Önce atları Güç Puanına (Power Score) göre sırala
      const sortedByPower = [...race.horses].sort((a, b) => b.power_score - a.power_score);
      
      let selectedHorses: number[] = [];
      let isBanko = false;

      // --- BANKO MANTIĞI ---
      // Eğer en güçlü at, ikinciye 10 puan fark atmışsa ve puanı 85 üstüyse BANKO'dur.
      const bestHorse = sortedByPower[0];
      const secondBest = sortedByPower[1];
      const gap = (secondBest) ? bestHorse.power_score - secondBest.power_score : 100;

      if (bestHorse && bestHorse.power_score >= 90 && gap >= 8) {
        selectedHorses = [bestHorse.no];
        isBanko = true;
      } 
      else {
        // --- KARIŞIK AYAK MANTIĞI ---
        // Normalde ilk 4-5 atı alırız.
        // Ancak atların "no" değerleri 1,2,3,4,5 ise bu veri şüphelidir (LLM hatası olabilir).
        // Bu durumda bile güç puanına sadık kalacağız, çünkü yapay zeka sırt numarasını yanlış bilse bile favoriyi doğru biliyor olabilir.
        
        let limit = 4; // Standart olarak 4 at yaz
        if (sortedByPower.length > 10) limit = 5; // Kalabalık koşuda 5 at

        // İlk 'limit' kadar atı seç
        const mainPicks = sortedByPower.slice(0, limit);
        selectedHorses = mainPicks.map(h => h.no);

        // SÜRPRİZ EKLEME: 
        // Eğer 6. sıradaki atın puanı hala yüksekse (örn: 60 üzeri), onu da ekle.
        // Amaç 1-2-3-4 serisini bozmak ve bombayı yakalamak.
        if (sortedByPower.length > limit) {
           const surpriseHorse = sortedByPower[limit]; 
           if (surpriseHorse.power_score > 65) {
               selectedHorses.push(surpriseHorse.no);
           }
        }
      }

      return {
        raceId: race.id,
        raceNo: race.id, // Resmi koşu numarası (örn: 1. Koşu)
        selectedHorses: selectedHorses.sort((a, b) => a - b), // Kuponda küçükten büyüğe sıralı görünür
        isBanko
      };
    });
    
    combinations = legs.reduce((acc, leg) => acc * leg.selectedHorses.length, 1);
  }

  // --- TEK KOŞULUK OYUNLAR (TABELA, IKILI VS) ---
  else {
    const race = races.find(r => r.id === targetRaceId);
    if (!race) return null;
    
    const sortedHorses = [...race.horses].sort((a, b) => b.power_score - a.power_score);
    if (sortedHorses.length === 0) return null;

    if (betType === 'IKILI' || betType === 'SIRALI' || betType === 'CIFTE') {
        // İlk 3 favoriyi al
        const picks = sortedHorses.slice(0, 3).map(h => h.no);
        legs = [{
            raceId: race.id,
            raceNo: race.id,
            selectedHorses: picks.sort((a,b) => a-b),
            isBanko: false
        }];
        combinations = 6; 
    }
    else if (betType === 'TABELA') {
        // Tabela için ilk 5 at + 1 sürpriz
        const picks = sortedHorses.slice(0, 5).map(h => h.no);
        if (sortedHorses.length > 6 && sortedHorses[6].power_score > 55) {
             picks.push(sortedHorses[6].no);
        }
        legs = [{
            raceId: race.id,
            raceNo: race.id,
            selectedHorses: picks.sort((a,b) => a-b),
            isBanko: false
        }];
        combinations = 1; // Tabela için kombinasyon hesabı karmaşıktır, 1 diyoruz.
    }
  }

  return {
    type: betType,
    legs,
    totalCombinations: combinations,
    estimatedCost: Math.max(combinations * UNIT_PRICE, 1), 
    strategy: 'dengeli',
    raceIndexStart: startRaceIndex,
    targetRaceId: targetRaceId
  };
};