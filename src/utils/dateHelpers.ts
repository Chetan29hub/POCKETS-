import {
  format, isToday, isYesterday, startOfWeek, endOfWeek,
  startOfMonth, endOfMonth, subDays, subMonths, parseISO,
} from 'date-fns';

export const fmt = (date: Date | string, pattern = 'yyyy-MM-dd') =>
  format(typeof date === 'string' ? parseISO(date) : date, pattern);

export const todayStr  = () => format(new Date(), 'yyyy-MM-dd');
export const monthStr  = () => format(new Date(), 'yyyy-MM');
export const monthStartStr = () => format(startOfMonth(new Date()), 'yyyy-MM-dd');
export const monthEndStr   = () => format(endOfMonth(new Date()), 'yyyy-MM-dd');
export const weekStartStr  = () => format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
export const weekEndStr    = () => format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
export const yesterdayStr  = () => format(subDays(new Date(), 1), 'yyyy-MM-dd');
export const lastMonthStartStr = () => format(startOfMonth(subMonths(new Date(), 1)), 'yyyy-MM-dd');
export const lastMonthEndStr   = () => format(endOfMonth(subMonths(new Date(), 1)), 'yyyy-MM-dd');

export function humanDate(dateStr: string): string {
  const d = parseISO(dateStr);
  if (isToday(d))     return 'Today';
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'dd MMM yyyy');
}

export function groupLabel(dateStr: string): string {
  const d = parseISO(dateStr);
  if (isToday(d))     return 'Today';
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'EEEE, dd MMM');
}

export function daysLeftInMonth(): number {
  const today = new Date();
  const end   = endOfMonth(today);
  return end.getDate() - today.getDate();
}

export function formatTime(timeStr: string): string {
  const [h, m] = timeStr.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}
