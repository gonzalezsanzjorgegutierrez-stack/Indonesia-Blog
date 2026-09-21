/**
 * Calculates the current day number of the trip based on a start date.
 * Day 1 = the start date itself. Updates automatically as real time passes.
 */
export const calculateCurrentDay = (tripStartDate?: string): number => {
  if (!tripStartDate) return 1;

  const start = new Date(tripStartDate + 'T00:00:00');
  if (isNaN(start.getTime())) return 1;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  start.setHours(0, 0, 0, 0);

  const diffTime = today.getTime() - start.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;

  return Math.max(1, diffDays);
};

/** Returns today's date as an ISO string (YYYY-MM-DD), for use in <input type="date"> */
export const getTodayISO = (): string => {
  return new Date().toISOString().slice(0, 10);
};

/** Fecha de hoy en la zona horaria del dispositivo (YYYY-MM-DD). Con UTC, en Bali de madrugada saldría "ayer". */
export const localDateISO = (d: Date = new Date()): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
