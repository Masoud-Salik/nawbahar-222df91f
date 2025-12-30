// Afghan Solar Hijri month names in Persian/Dari
export const AFGHAN_MONTHS = [
  "حمل",      // Hamal - March/April
  "ثور",      // Sawr - April/May
  "جوزا",     // Jawza - May/June
  "سرطان",    // Saratan - June/July
  "اسد",      // Asad - July/August
  "سنبله",    // Sonbola - August/September
  "میزان",    // Mizan - September/October
  "عقرب",     // Aqrab - October/November
  "قوس",      // Qaws - November/December
  "جدی",      // Jadi - December/January
  "دلو",      // Dalw - January/February
  "حوت",      // Hoot - February/March
] as const;

// Convert Gregorian to Solar Hijri (Shamsi)
export function gregorianToSolar(date: Date): { year: number; month: number; day: number } {
  const gy = date.getFullYear();
  const gm = date.getMonth() + 1;
  const gd = date.getDate();

  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let jy: number;

  const gy2 = gm > 2 ? gy + 1 : gy;
  let days = 355666 + 365 * gy + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100) + Math.floor((gy2 + 399) / 400) + gd + g_d_m[gm - 1];
  jy = -1595 + 33 * Math.floor(days / 12053);
  days %= 12053;
  jy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    jy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  const jm = days < 186 ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30);
  const jd = 1 + (days < 186 ? days % 31 : (days - 186) % 30);

  return { year: jy, month: jm, day: jd };
}

// Format date in Solar Hijri with Afghan month names
export function formatSolarDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const solar = gregorianToSolar(d);
  return `${solar.day} ${AFGHAN_MONTHS[solar.month - 1]} ${solar.year}`;
}

// Short format: just day and month
export function formatSolarShort(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const solar = gregorianToSolar(d);
  return `${solar.day} ${AFGHAN_MONTHS[solar.month - 1]}`;
}
