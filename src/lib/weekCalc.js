// Training-week and day calculation utilities.
// All date arithmetic uses Monday-anchored ISO weeks.

import { DELOAD_WEEK } from './workoutData.js';

// Maps JS getDay() values (0=Sun … 6=Sat) to program day numbers.
// Days not listed are rest days (null).
const DOW_TO_DAY = {
  1: 1, // Monday   → Day 1
  2: 2, // Tuesday  → Day 2
  4: 3, // Thursday → Day 3
  6: 4  // Saturday → Day 4
};

/**
 * Return the ISO date string (YYYY-MM-DD) for the most recent Monday on or
 * before the given Date object.
 * @param {Date} date
 * @returns {string}
 */
function getMondayOf(date) {
  const d = new Date(date);
  const dow = d.getDay(); // 0 = Sunday
  const diff = dow === 0 ? -6 : 1 - dow; // shift back to Monday
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

/**
 * Parse a YYYY-MM-DD string or Date into a UTC-midnight Date.
 * Using noon avoids DST edge cases when only date math is needed.
 * @param {string | Date} value
 * @returns {Date}
 */
function toDate(value) {
  if (value instanceof Date) return value;
  // Parse as local noon to avoid midnight-DST issues
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0);
}

/**
 * Given a program start date, return details about the current program week.
 *
 * @param {string} startDate - ISO date string of the first program Monday (or any date;
 *   the function anchors to the Monday of that week as week 1 start).
 * @param {number | null} weekOverride - If set, treat this as the current week number (1-5).
 * @returns {{
 *   weekNumber: number,
 *   weekIndex: number,
 *   cycleWeek: number,
 *   isDeload: boolean,
 *   daysIntoWeek: number,
 *   weekStartDate: string
 * }}
 */
export function getCurrentWeek(startDate, weekOverride = null) {
  const start = toDate(getMondayOf(toDate(startDate)));
  const now = toDate(getMondayOf(new Date()));

  const msPerDay = 24 * 60 * 60 * 1000;
  const msPerWeek = 7 * msPerDay;

  const weekIndex = Math.max(0, Math.round((now - start) / msPerWeek));
  const cycleWeek = (weekIndex % DELOAD_WEEK) + 1; // 1-5
  const isDeload = cycleWeek === DELOAD_WEEK;
  const weekNumber = isDeload ? DELOAD_WEEK : cycleWeek;

  // Days into the current calendar week (Mon = 0, Tue = 1, … Sun = 6)
  const today = new Date();
  const dow = today.getDay(); // 0=Sun
  const daysIntoWeek = dow === 0 ? 6 : dow - 1; // Mon-anchored

  const weekStartDate = getMondayOf(today);

  if (weekOverride !== null) {
    const overrideCycle = Math.max(1, Math.min(DELOAD_WEEK, weekOverride));
    return {
      weekNumber: overrideCycle,
      weekIndex,
      cycleWeek: overrideCycle,
      isDeload: overrideCycle === DELOAD_WEEK,
      daysIntoWeek,
      weekStartDate
    };
  }

  return { weekNumber, weekIndex, cycleWeek, isDeload, daysIntoWeek, weekStartDate };
}

/**
 * Return the program day number (1-4) for today, or null on rest days.
 * @returns {number | null}
 */
export function getTodayDay() {
  const dow = new Date().getDay();
  return DOW_TO_DAY[dow] ?? null;
}

/**
 * Return the next upcoming training day, including today if it is a training day.
 *
 * @returns {{ dayNumber: number, date: string, daysAway: number }}
 */
export function getNextTrainingDay() {
  const trainingDows = Object.keys(DOW_TO_DAY).map(Number).sort((a, b) => a - b);

  const now = new Date();
  const todayDow = now.getDay();

  // Find the next training dow >= todayDow, wrapping around the week.
  let daysAway = null;
  let targetDow = null;

  for (const dow of trainingDows) {
    const diff = (dow - todayDow + 7) % 7;
    if (daysAway === null || diff < daysAway) {
      daysAway = diff;
      targetDow = dow;
    }
  }

  const targetDate = new Date(now);
  targetDate.setDate(now.getDate() + daysAway);

  return {
    dayNumber: DOW_TO_DAY[targetDow],
    date: targetDate.toISOString().slice(0, 10),
    daysAway
  };
}
