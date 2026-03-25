/**
 * ISO 8601 week-date utilities.
 *
 * An ISO week year's first week contains January 4th.
 * Weeks start on Monday (day 1) and end on Sunday (day 7).
 */

/**
 * Return the ISO week number and ISO year for a given Date.
 * @param {Date} date
 * @returns {{ isoYear: number, isoWeek: number }}
 */
function computeISOWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  // Set to nearest Thursday: current date + 4 − current day number (Mon=1 … Sun=7)
  const dayNum = d.getUTCDay() || 7; // convert Sunday from 0 → 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);

  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);

  return { isoYear: d.getUTCFullYear(), isoWeek: weekNo };
}

/**
 * Convert a JS Date to an ISO week string "YYYY-Www".
 * @param {Date} date — any JavaScript Date object
 * @returns {string} e.g. "2025-W20"
 */
export function getISOWeek(date) {
  if (!(date instanceof Date) || isNaN(date)) {
    throw new Error('getISOWeek: argument must be a valid Date object');
  }
  const { isoYear, isoWeek } = computeISOWeek(date);
  return `${isoYear}-W${String(isoWeek).padStart(2, '0')}`;
}

/**
 * Get the current ISO week string "YYYY-Www" for today.
 * @returns {string} e.g. "2025-W20"
 */
export function getCurrentISOWeek() {
  return getISOWeek(new Date());
}

/**
 * Convert an ISO week string to a date range (Monday 00:00:00 → Sunday 23:59:59.999).
 * @param {string} isoWeek — e.g. "2025-W20"
 * @returns {{ start: Date, end: Date }}
 */
export function isoWeekToDateRange(isoWeek) {
  const regex = /^\d{4}-W(0[1-9]|[1-4]\d|5[0-3])$/;
  if (!regex.test(isoWeek)) {
    throw new Error(
      `isoWeekToDateRange: invalid isoWeek format "${isoWeek}". Expected "YYYY-Www".`
    );
  }

  const [yearStr, weekStr] = isoWeek.split('-W');
  const year = parseInt(yearStr, 10);
  const week = parseInt(weekStr, 10);

  // Jan 4 is always in ISO week 1. Find the Monday of week 1.
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Day = jan4.getUTCDay() || 7; // Mon=1 … Sun=7
  const week1Monday = new Date(Date.UTC(year, 0, 4 - (jan4Day - 1)));

  // Target Monday = week1Monday + (week − 1) * 7 days
  const start = new Date(week1Monday.getTime() + (week - 1) * 7 * 86400000);

  // Sunday 23:59:59.999
  const end = new Date(start.getTime() + 6 * 86400000 + 86400000 - 1);

  return { start, end };
}

/**
 * Add or subtract weeks from an ISO week string.
 * @param {string} isoWeek — e.g. "2025-W20"
 * @param {number} weeks — positive or negative number of weeks to add
 * @returns {string} — ISO week string in "YYYY-Www" format
 */
export function addWeeks(isoWeek, weeks) {
  const { start } = isoWeekToDateRange(isoWeek);
  const newDate = new Date(start.getTime() + weeks * 7 * 86400000);
  return getISOWeek(newDate);
}

/**
 * Get a human-readable label for an ISO week (e.g., "Week 20: Jan 13 - Jan 19, 2025").
 * @param {string} isoWeek — e.g. "2025-W20"
 * @returns {string} — formatted week label
 */
export function getWeekLabel(isoWeek) {
  const { start, end } = isoWeekToDateRange(isoWeek);
  const [, weekNumStr] = isoWeek.split('-W');
  const weekNum = parseInt(weekNumStr, 10);
  
  const formatDate = (date) => {
    const month = date.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' });
    const day = date.getUTCDate();
    return `${month} ${day}`;
  };

  const startStr = formatDate(start);
  const endStr = formatDate(end);
  const year = start.getUTCFullYear();

  return `Week ${weekNum}: ${startStr} - ${endStr}, ${year}`;
}
