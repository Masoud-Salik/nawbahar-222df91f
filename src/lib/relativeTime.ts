// Relative time formatting in Persian
export function getRelativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffWeek = Math.floor(diffDay / 7);
  const diffMonth = Math.floor(diffDay / 30);

  if (diffSec < 60) return "همین الان";
  if (diffMin < 60) return `${diffMin} دقیقه پیش`;
  if (diffHour < 24) return `${diffHour} ساعت پیش`;
  if (diffDay === 1) return "دیروز";
  if (diffDay < 7) return `${diffDay} روز پیش`;
  if (diffWeek === 1) return "یک هفته پیش";
  if (diffWeek < 4) return `${diffWeek} هفته پیش`;
  if (diffMonth === 1) return "یک ماه پیش";
  if (diffMonth < 12) return `${diffMonth} ماه پیش`;
  
  return `${Math.floor(diffMonth / 12)} سال پیش`;
}
