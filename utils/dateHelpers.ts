import { HOLIDAYS_2025, TIMEZONE, WorkConfig } from '../constants';

export const getCordobaTime = (): Date => {
  const now = new Date();
  const tzDate = new Date(now.toLocaleString('en-US', { timeZone: TIMEZONE }));
  return tzDate;
};

// Check if a date is a holiday
export const isHoliday = (date: Date): boolean => {
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const dateStr = `${month}-${day}`;
  return HOLIDAYS_2025.includes(dateStr);
};

// Check if a date is a weekend (Legacy helper, mostly internal use now)
export const isWeekend = (date: Date): boolean => {
  const day = date.getDay();
  return day === 0 || day === 6;
};

// Check if a date is a working day based on config
export const isWorkDay = (date: Date, config: WorkConfig): boolean => {
  if (isHoliday(date)) return false;
  return config.workDays.includes(date.getDay());
};

// Get the intersection of a time range with the work hours of a specific day
const getWorkHoursInDay = (day: Date, rangeStart: Date, rangeEnd: Date, config: WorkConfig): number => {
  if (!isWorkDay(day, config)) return 0;

  // Define work hours for this specific day
  const workStart = new Date(day);
  workStart.setHours(config.startHour, 0, 0, 0);
  
  const workEnd = new Date(day);
  workEnd.setHours(config.endHour, 0, 0, 0);

  // Calculate overlap
  const effectiveStart = rangeStart > workStart ? rangeStart : workStart;
  const effectiveEnd = rangeEnd < workEnd ? rangeEnd : workEnd;

  if (effectiveStart < effectiveEnd) {
    return (effectiveEnd.getTime() - effectiveStart.getTime()) / (1000 * 60 * 60);
  }
  return 0;
};

// Calculate total work hours and elapsed work hours in a period
export const calculateWorkProgressStats = (start: Date, end: Date, now: Date, config: WorkConfig) => {
  let totalWorkHours = 0;
  let elapsedWorkHours = 0;

  // Clone to iterate
  const currentIter = new Date(start);
  currentIter.setHours(0, 0, 0, 0);
  
  while (currentIter <= end) {
    // Determine the window for this day (00:00 to 23:59:59 usually, but bounded by start/end period)
    const dayStart = new Date(currentIter);
    dayStart.setHours(0,0,0,0);
    const dayEnd = new Date(currentIter);
    dayEnd.setHours(23,59,59,999);

    // Clamp to the actual period
    const actualStart = dayStart < start ? start : dayStart;
    const actualEnd = dayEnd > end ? end : dayEnd;

    // Add to total capacity
    totalWorkHours += getWorkHoursInDay(currentIter, actualStart, actualEnd, config);

    // Add to elapsed
    if (now > actualStart) {
        const elapsedEnd = now < actualEnd ? now : actualEnd;
        elapsedWorkHours += getWorkHoursInDay(currentIter, actualStart, elapsedEnd, config);
    }

    // Next day
    currentIter.setDate(currentIter.getDate() + 1);
  }

  return { total: totalWorkHours, elapsed: elapsedWorkHours };
};

export const getStartOfWeek = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is sunday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

export const getEndOfWeek = (date: Date): Date => {
  const d = getStartOfWeek(date);
  d.setDate(d.getDate() + 6);
  d.setHours(23, 59, 59, 999);
  return d;
};

export const getStartOfMonth = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

export const getEndOfMonth = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
};

export const getStartOfYear = (date: Date): Date => {
  return new Date(date.getFullYear(), 0, 1);
};

export const getEndOfYear = (date: Date): Date => {
  return new Date(date.getFullYear(), 11, 31, 23, 59, 59, 999);
};