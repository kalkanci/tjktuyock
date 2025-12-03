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

  // Koşu listesini güvenli bir şekilde al
  const races = program.races;

  // --- ÇOK AYAKLI OYUNLAR ---
  if (['6G', '5G', '4G', '3G'].includes(betType)) {
    let legCount = 6;
    if (betType === '5G') legCount = 5;
    if (betType === '4G') legCount = 4;
    if (betType === '3G') legCount = 3;

    // Yeterli koşu var mı kontrol et
    if (races.length < startRaceIndex + legCount) {
      // Eğer veri eksik geldiyse (API hatası vb.), mevcut olan kadarını yapmaya çalış
      // Ama kullanıcı deneyimi için null dönmektense, mevcut koşularla işlem yapalım
      // return null; 
      legCount = Math.min(legCount, races.length - startRaceIndex);
    }

    const targetRaces = races.slice(startRaceIndex, startRaceIndex + legCount);

    legs = targetRaces.map((race) => {
      // Sadece puana göre değil, biraz çeşitlilik katmak için mantık
      const sortedHorses = [...race.horses].sort((a, b) => b.power_score - a.power_score);
      
      let selectedHorses: number[] = [];
      let isBanko = false;

      // Puanlar çok yakınsa veya veri yetersizse çeşitlendir
      // Banko: 1. atın puanı 90+ ve 2. ata 8 puan fark atmışsa
      const firstHorse = sortedHorses[0];
      const secondHorse = sortedHorses[1];

      if (firstHorse && firstHorse.power_score > 88 && (!secondHorse || (firstHorse.power_score - secondHorse.power_score > 8))) {
        selectedHorses = [firstHorse.no];
        isBanko = true;
      } else {
        // Karışık ayak: İlk 4-5 atı al
        // Eğer at sayısı azsa (örn 4 at koşuyorsa) hepsini yazma
        const pickCount = Math.min(sortedHorses.length, 4);
        selectedHorses = sortedHorses.slice(0, pickCount).map(h => h.no);
        
        // Sürpriz ekle: Bazen 6. veya 7. attan da ekle (Puanı 50 üstüyse)
        if (sortedHorses.length > 5 && sortedHorses[5].power_score > 60) {
            selectedHorses.push(sortedHorses[5].no);
        }
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

  // --- TEK KOŞULUK OYUNLAR (TABELA, IKILI VS) ---
  else {
    const race = races.find(r => r.id === targetRaceId);
    if (!race) return null;
    
    // Güç puanına göre sırala
    const sortedHorses = [...race.horses].sort((a, b) => b.power_score - a.power_score);
    
    if (sortedHorses.length === 0) return null;

    // IKILI & SIRALI: İlk 2 favori + 1 plase
    if (betType === 'IKILI' || betType === 'SIRALI' || betType === 'CIFTE') {
        const picks = sortedHorses.slice(0, 3).map(h => h.no);
        legs = [{
            raceId: race.id,
            raceNo: race.id,
            selectedHorses: picks.sort((a,b) => a-b),
            isBanko: false
        }];
        combinations = 6; // Tahmini kombinasyon (İkili için)
    }
    // TABELA (İlk 4): İlk 5 favori + 1 sürpriz
    else if (betType === 'TABELA') {
        // İlk 5 favoriyi al
        const picks = sortedHorses.slice(0, 5).map(h => h.no);
        
        // Eğer 1-2-3-4-5 ardışık geliyorsa ve atların gerçek numaraları bunlarsa yapacak bir şey yok,
        // ama yapay zeka halüsinasyonu ise prompt düzeltildi.
        // Yine de bir sürpriz at ekleyelim (Listenin ortasından)
        if (sortedHorses.length > 6) {
             picks.push(sortedHorses[6].no);
        }

        legs = [{
            raceId: race.id,
            raceNo: race.id,
            selectedHorses: picks.sort((a,b) => a-b),
            isBanko: false
        }];
        combinations = 12; // Tabela kombine temsili
    }
  }

  return {
    type: betType,
    legs,
    totalCombinations: combinations,
    estimatedCost: Math.max(combinations * UNIT_PRICE, 1), // En az 1 TL
    strategy: 'dengeli',
    raceIndexStart: startRaceIndex,
    targetRaceId: targetRaceId
  };
};